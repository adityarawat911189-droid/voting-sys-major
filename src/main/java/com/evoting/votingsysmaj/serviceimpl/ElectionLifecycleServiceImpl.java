package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.ElectionLifecycleService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ElectionLifecycleServiceImpl implements ElectionLifecycleService {

    private static final int MIN_CANDIDATES = 2;

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ElectionLifecycleServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Override
    public List<Integer> dueToOpenNomination() {
        return jdbc.queryForList("""
                select id from elections
                where is_deleted = false and status = 'DRAFT' and nomination_start <= ?
                order by id
                """, Integer.class, LocalDateTime.now());
    }

    @Override
    public List<Integer> dueToStart() {
        return jdbc.queryForList("""
                select id from elections
                where is_deleted = false and status = 'NOMINATION' and start_time <= ?
                order by id
                """, Integer.class, LocalDateTime.now());
    }

    @Override
    public List<Integer> dueToComplete() {
        return jdbc.queryForList("""
                select id from elections
                where is_deleted = false and status = 'ONGOING' and end_time <= ?
                order by id
                """, Integer.class, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void openNomination(int id) {
        String title = title(id);
        int n = jdbc.update("""
                update elections set status = 'NOMINATION'
                where id = ? and status = 'DRAFT' and is_deleted = false
                """, id);
        if (n == 0) return;

        audit.logSystem("ELECTION_NOMINATION_OPENED", "ELECTION", id, null,
                Map.of("status", "DRAFT"),
                Map.of("title", title, "status", "NOMINATION"));
    }

    @Override
    @Transactional
    public void startVoting(int id) {
        String title = title(id);
        Integer cnt = jdbc.queryForObject(
                "select count(*) from election_candidates where election_id = ?", Integer.class, id);
        int candidates = cnt == null ? 0 : cnt;

        if (candidates >= MIN_CANDIDATES) {
            int n = jdbc.update("""
                    update elections set status = 'ONGOING', actual_start_time = ?
                    where id = ? and status = 'NOMINATION' and is_deleted = false
                    """, LocalDateTime.now(), id);
            if (n == 0) return;

            audit.logSystem("ELECTION_STARTED", "ELECTION", id, null,
                    Map.of("status", "NOMINATION"),
                    Map.of("title", title, "status", "ONGOING", "candidates", candidates));
        } else {
            String why = "Voting shuru hone tak kam se kam " + MIN_CANDIDATES
                    + " candidate nahi the (mile: " + candidates + ")";
            int n = jdbc.update("""
                    update elections set status = 'FAILED', fail_reason = ?
                    where id = ? and status = 'NOMINATION' and is_deleted = false
                    """, why, id);
            if (n == 0) return;

            audit.logSystem("ELECTION_FAILED", "ELECTION", id, why,
                    Map.of("status", "NOMINATION"),
                    Map.of("title", title, "status", "FAILED"));
        }
    }

    @Override
    @Transactional
    public void complete(int id) {
        String title = title(id);

        List<Map<String, Object>> rows = jdbc.queryForList("""
                select ec.candidate_id, v.name, c.party, c.symbol,
                       (select count(*) from votes vt
                        where vt.election_id = ec.election_id and vt.candidate_id = ec.candidate_id) as votes
                from election_candidates ec
                join candidates c on c.id = ec.candidate_id
                join mock_voters v on v.id = c.voter_id
                where ec.election_id = ?
                order by votes desc, v.name
                """, id);

        int total = 0;
        for (Map<String, Object> r : rows) total += votes(r);

        String resultStatus;
        Integer winnerId = null;
        String winnerName = "-";
        if (total == 0 || rows.isEmpty()) {
            resultStatus = "NO_VOTES";
        } else {
            boolean tie = rows.size() > 1 && votes(rows.get(1)) == votes(rows.get(0));
            if (tie) {
                resultStatus = "TIE";
            } else {
                resultStatus = "WINNER_DECLARED";
                winnerId = ((Number) rows.get(0).get("candidate_id")).intValue();
                winnerName = String.valueOf(rows.get(0).get("name"));
            }
        }

        int n = jdbc.update("""
                update elections
                set status = 'COMPLETED', actual_end_time = ?, total_votes = ?,
                    result_status = ?, winner_candidate_id = ?
                where id = ? and status = 'ONGOING' and is_deleted = false
                """, LocalDateTime.now(), total, resultStatus, winnerId, id);
        if (n == 0) return;

        int rank = 0;
        int prevVotes = -1;
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> r = rows.get(i);
            int v = votes(r);
            if (v != prevVotes) rank = i + 1;
            prevVotes = v;

            BigDecimal percent = total == 0
                    ? BigDecimal.ZERO
                    : BigDecimal.valueOf(v).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

            jdbc.update("""
                    insert into election_results
                        (election_id, candidate_id, candidate_name, party, symbol, votes, vote_percent, "rank")
                    values (?, ?, ?, ?, ?, ?, ?, ?)
                    """, id, ((Number) r.get("candidate_id")).intValue(), r.get("name"),
                    r.get("party"), r.get("symbol"), v, percent, rank);
        }

        audit.logSystem("ELECTION_COMPLETED", "ELECTION", id, null,
                Map.of("status", "ONGOING"),
                Map.of("title", title, "status", "COMPLETED", "total_votes", total,
                        "result", resultStatus, "winner", winnerName));
    }

    // ---------- helpers ----------

    private String title(int id) {
        return jdbc.queryForObject("select title from elections where id = ?", String.class, id);
    }

    private int votes(Map<String, Object> r) {
        return ((Number) r.get("votes")).intValue();
    }
}