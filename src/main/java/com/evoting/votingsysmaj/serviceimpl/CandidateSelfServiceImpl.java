package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.CandidateSelfService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class CandidateSelfServiceImpl implements CandidateSelfService {

    private static final int MAX_SHORT = 100;
    private static final int MAX_MANIFESTO = 5000;

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public CandidateSelfServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    // ------------------------------------------------------------------
    @Override
    public Map<String, Object> me(int voterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select c.id, mv.name, c.party, c.symbol, c.manifesto, c.occupation, c.qualification, c.status
                from candidates c
                join mock_voters mv on mv.id = c.voter_id
                where c.voter_id = ? and c.status = 'APPROVED'
                order by c.id desc
                limit 1
                """, voterId);

        Map<String, Object> out = new LinkedHashMap<>();
        if (rows.isEmpty()) {
            out.put("candidate", false);
            return out;
        }

        Map<String, Object> c = rows.get(0);
        int candidateId = ((Number) c.get("id")).intValue();

        out.put("candidate", true);
        out.put("name", c.get("name"));
        out.put("party", c.get("party"));
        out.put("symbol", c.get("symbol"));
        out.put("manifesto", c.get("manifesto"));
        out.put("occupation", c.get("occupation"));
        out.put("qualification", c.get("qualification"));
        out.put("status", c.get("status"));

        List<Map<String, Object>> latest = jdbc.queryForList("""
                select id, party, manifesto, qualification, occupation, status, rejection_reason,
                       to_char(requested_at, 'DD Mon YYYY, HH12:MI AM') as requested_at,
                       to_char(reviewed_at, 'DD Mon YYYY, HH12:MI AM') as reviewed_at
                from candidate_change_requests
                where candidate_id = ?
                order by id desc
                limit 1
                """, candidateId);
        out.put("latestRequest", latest.isEmpty() ? null : latest.get(0));

        String block = blockReason(candidateId);
        out.put("canRequest", block == null);
        out.put("blockReason", block);
        return out;
    }

    // ------------------------------------------------------------------
    @Override
    @Transactional
    public Map<String, Object> requestChange(int voterId, String party, String manifesto,
                                             String qualification, String occupation) {
        // Candidate row lock: do request ek saath aayein to bhi sirf ek PENDING banegi
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, party, manifesto, qualification, occupation
                from candidates
                where voter_id = ? and status = 'APPROVED'
                order by id desc
                limit 1
                for update
                """, voterId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not an approved candidate.");
        }
        Map<String, Object> cur = rows.get(0);
        int candidateId = ((Number) cur.get("id")).intValue();

        String block = blockReason(candidateId);
        if (block != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, block);
        }

        // Khaali chhoda hua field = badlav nahi, purani value hi rahegi.
        // Saare 4 fields request mein jaate hain, taaki approve karne par kuch khaali na ho jaye.
        String p = pick(party, cur.get("party"), MAX_SHORT, "Party");
        String m = pick(manifesto, cur.get("manifesto"), MAX_MANIFESTO, "Manifesto");
        String q = pick(qualification, cur.get("qualification"), MAX_SHORT, "Qualification");
        String o = pick(occupation, cur.get("occupation"), MAX_SHORT, "Occupation");

        boolean changed = differs(p, cur.get("party")) || differs(m, cur.get("manifesto"))
                || differs(q, cur.get("qualification")) || differs(o, cur.get("occupation"));
        if (!changed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have not changed anything.");
        }

        jdbc.update("""
                insert into candidate_change_requests (candidate_id, party, manifesto, qualification, occupation)
                values (?, ?, ?, ?, ?)
                """, candidateId, p, m, q, o);

        audit.logSystem("CANDIDATE_CHANGE_REQUESTED", "CANDIDATE", candidateId, null, null,
                Map.of("status", "PENDING"));

        return Map.of("message", "Your request has been sent to the admin.", "status", "PENDING");
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    /** Request kyun nahi ho sakti (null = ho sakti hai). */
    private String blockReason(int candidateId) {
        Integer pending = jdbc.queryForObject(
                "select count(*) from candidate_change_requests where candidate_id = ? and status = 'PENDING'",
                Integer.class, candidateId);
        if (pending != null && pending > 0) {
            return "Your previous request is still pending. You can send a new one after the admin reviews it.";
        }

        Integer ongoing = jdbc.queryForObject("""
                select count(*)
                from election_candidates ec
                join elections e on e.id = ec.election_id
                where ec.candidate_id = ? and e.is_deleted = false and e.status = 'ONGOING'
                """, Integer.class, candidateId);
        if (ongoing != null && ongoing > 0) {
            return "Changes are not allowed while voting is on in an election you are part of.";
        }
        return null;
    }

    private String pick(String input, Object current, int max, String label) {
        String n = input == null ? "" : input.trim();
        if (n.isEmpty()) return current == null ? null : current.toString();
        if (n.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    label + " must be at most " + max + " characters.");
        }
        return n;
    }

    private boolean differs(String next, Object current) {
        return !Objects.equals(Objects.toString(next, "").trim(), Objects.toString(current, "").trim());
    }
}