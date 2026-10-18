package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.ElectionCancelService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ElectionCancelServiceImpl implements ElectionCancelService {

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ElectionCancelServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Override
    public List<Map<String, Object>> cancellable() {
        return jdbc.queryForList("""
                select e.id, e.title, e.election_type, e.state, e.city, e.ward_no, e.status,
                       to_char(e.start_time, 'DD Mon YYYY HH12:MI AM') as start_time,
                       (select count(*) from election_candidates ec where ec.election_id = e.id) as candidate_count
                from elections e
                where e.is_deleted = false
                  and e.status in ('DRAFT', 'NOMINATION', 'ONGOING')
                order by e.start_time
                """);
    }

    @Override
    @Transactional
    public Map<String, Object> cancel(Integer electionId, String reason) {
        if (electionId == null) throw new IllegalArgumentException("An election must be selected");

        String r = reason == null ? "" : reason.trim();
        if (r.length() < 10) throw new IllegalArgumentException("Reason must be at least 10 characters long");
        if (r.length() > 500) throw new IllegalArgumentException("Reason cannot exceed 500 characters");

        List<Map<String, Object>> rows = jdbc.queryForList(
                "select title, status from elections where id = ? and is_deleted = false", electionId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Election not found");

        String status = String.valueOf(rows.get(0).get("status"));
        String title = String.valueOf(rows.get(0).get("title"));
        if (!List.of("DRAFT", "NOMINATION", "ONGOING").contains(status))
            throw new IllegalArgumentException("This election is " + status + " and cannot be cancelled");

        int updated = jdbc.update("""
                update elections set status = 'CANCELLED', stop_reason = ?
                where id = ? and status in ('DRAFT', 'NOMINATION', 'ONGOING')
                """, r, electionId);
        if (updated == 0)
            throw new IllegalArgumentException("The election status has just changed. Please try again");

        audit.log("ELECTION_CANCELLED", "ELECTION", electionId, r,
                Map.of("title", title, "status", status),
                Map.of("status", "CANCELLED"));

        return Map.of("message", "\"" + title + "\" has been cancelled");
    }
}