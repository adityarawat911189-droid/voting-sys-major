package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.ChangeRequestAdminService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChangeRequestAdminServiceImpl implements ChangeRequestAdminService {

    // Ye order candidates table ke update se match karta hai
    private static final String[] FIELDS = {"party", "manifesto", "qualification", "occupation"};

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ChangeRequestAdminServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Override
    public List<Map<String, Object>> list(String status) {
        String st = status == null ? "PENDING" : status.trim().toUpperCase();
        if (!List.of("PENDING", "APPROVED", "REJECTED").contains(st))
            throw new IllegalArgumentException("Invalid status");

        String order = st.equals("PENDING") ? "r.requested_at asc" : "r.reviewed_at desc, r.id desc";

        return jdbc.queryForList("""
                select r.id, r.candidate_id, v.name, r.status,
                       to_char(r.requested_at, 'DD Mon YYYY HH12:MI AM') as requested_at,
                       to_char(r.reviewed_at, 'DD Mon YYYY HH12:MI AM') as reviewed_at,
                       r.rejection_reason,
                       c.party as cur_party, c.manifesto as cur_manifesto,
                       c.qualification as cur_qualification, c.occupation as cur_occupation,
                       r.party as new_party, r.manifesto as new_manifesto,
                       r.qualification as new_qualification, r.occupation as new_occupation
                from candidate_change_requests r
                join candidates c on c.id = r.candidate_id
                join mock_voters v on v.id = c.voter_id
                where r.status = ?
                """ + " order by " + order, st);
    }

    @Override
    @Transactional
    public Map<String, Object> approve(int requestId) {
        Map<String, Object> r = lockPending(requestId);
        int candidateId = ((Number) r.get("candidate_id")).intValue();
        String name = String.valueOf(r.get("name"));

        Map<String, Object> before = new LinkedHashMap<>();
        Map<String, Object> after = new LinkedHashMap<>();
        String[] result = new String[FIELDS.length];

        for (int i = 0; i < FIELDS.length; i++) {
            String f = FIELDS[i];
            String cur = (String) r.get("cur_" + f);
            String neu = clean((String) r.get(f));
            String curTrim = cur == null ? null : cur.trim();
            if (neu != null && !neu.equals(curTrim)) {
                before.put(f, cur == null ? "" : cur);
                after.put(f, neu);
                result[i] = neu;
            } else {
                result[i] = cur;
            }
        }

        if (after.isEmpty())
            throw new IllegalArgumentException("This request contains no actual changes. Please reject it instead");

        jdbc.update("update candidates set party = ?, manifesto = ?, qualification = ?, occupation = ? where id = ?",
                result[0], result[1], result[2], result[3], candidateId);

        jdbc.update("update candidate_change_requests set status = 'APPROVED', reviewed_by = ?, reviewed_at = ? where id = ?",
                audit.currentAdminId(), LocalDateTime.now(), requestId);

        after.put("candidate", name);
        after.put("request_id", requestId);
        audit.log("CHANGE_REQUEST_APPROVED", "CANDIDATE", candidateId, null, before, after);

        return Map.of("message", "Request for " + name + " has been approved and the details have been updated");
    }

    @Override
    @Transactional
    public Map<String, Object> reject(int requestId, String reason) {
        String why = reason == null ? "" : reason.trim();
        if (why.length() < 10) throw new IllegalArgumentException("Reason must be at least 10 characters long");
        if (why.length() > 500) throw new IllegalArgumentException("Reason cannot exceed 500 characters");

        Map<String, Object> r = lockPending(requestId);
        int candidateId = ((Number) r.get("candidate_id")).intValue();
        String name = String.valueOf(r.get("name"));

        jdbc.update("""
                update candidate_change_requests
                set status = 'REJECTED', rejection_reason = ?, reviewed_by = ?, reviewed_at = ?
                where id = ?
                """, why, audit.currentAdminId(), LocalDateTime.now(), requestId);

        audit.log("CHANGE_REQUEST_REJECTED", "CANDIDATE", candidateId, why, null,
                Map.of("candidate", name, "request_id", requestId));

        return Map.of("message", "Request for " + name + " has been rejected");
    }

    // ---------- helpers ----------

    // Request ko lock karke lata hai, aur dekhta hai ki abhi pending hai ya nahi
    private Map<String, Object> lockPending(int requestId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select r.id, r.candidate_id, r.status,
                       r.party, r.manifesto, r.qualification, r.occupation,
                       c.party as cur_party, c.manifesto as cur_manifesto,
                       c.qualification as cur_qualification, c.occupation as cur_occupation,
                       v.name
                from candidate_change_requests r
                join candidates c on c.id = r.candidate_id
                join mock_voters v on v.id = c.voter_id
                where r.id = ?
                for update of r
                """, requestId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Request not found");

        Map<String, Object> r = rows.get(0);
        if (!"PENDING".equals(r.get("status")))
            throw new IllegalArgumentException("This request has already been reviewed");
        return r;
    }

    private String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}