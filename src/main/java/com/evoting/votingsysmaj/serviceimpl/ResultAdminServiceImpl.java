package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.ResultAdminService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ResultAdminServiceImpl implements ResultAdminService {

    private final JdbcTemplate jdbc;

    public ResultAdminServiceImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Map<String, Object>> finishedElections() {
        return jdbc.queryForList("""
                select id, title, election_type, status,
                       to_char(end_time, 'DD Mon YYYY HH12:MI AM') as end_time
                from elections
                where is_deleted = false
                  and status in ('COMPLETED', 'FAILED', 'CANCELLED')
                order by end_time desc
                """);
    }

    @Override
    public Map<String, Object> details(int electionId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, title, election_type, state, city, ward_no, status,
                       result_status, total_votes, result_published, winner_candidate_id,
                       fail_reason, stop_reason,
                       to_char(start_time, 'DD Mon YYYY HH12:MI AM') as start_time,
                       to_char(end_time, 'DD Mon YYYY HH12:MI AM') as end_time
                from elections
                where id = ? and is_deleted = false
                """, electionId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Election not found.");

        Map<String, Object> election = rows.get(0);
        String status = String.valueOf(election.get("status"));
        if (!List.of("COMPLETED", "FAILED", "CANCELLED").contains(status))
            throw new IllegalArgumentException("Results are not available until the election is completed.");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("election", election);

        if (!status.equals("COMPLETED")) {
            res.put("candidates", List.of());
            return res;
        }

        List<Map<String, Object>> candidates = jdbc.queryForList("""
                select candidate_id, candidate_name, party, symbol, votes, vote_percent, "rank"
                from election_results
                where election_id = ?
                order by "rank", votes desc, candidate_name
                """, electionId);

        int eligible = eligibleVoters(election);
        int total = ((Number) election.get("total_votes")).intValue();
        BigDecimal turnout = eligible == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(total).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(eligible), 2, RoundingMode.HALF_UP);

        res.put("candidates", candidates);
        res.put("eligible_voters", eligible);
        res.put("turnout_percent", turnout);
        return res;
    }

    // Voters who belong to the election's area (all voters for a country election)
    private int eligibleVoters(Map<String, Object> election) {
        String type = String.valueOf(election.get("election_type")).toUpperCase();
        StringBuilder sql = new StringBuilder("select count(*) from mock_voters where role = 'VOTER'");
        List<Object> args = new ArrayList<>();

        if (!type.equals("COUNTRY")) {
            sql.append(" and lower(state) = lower(?)");
            args.add(election.get("state"));
        }
        if (type.equals("CITY") || type.equals("WARD")) {
            sql.append(" and lower(city) = lower(?)");
            args.add(election.get("city"));
        }

        Integer n = jdbc.queryForObject(sql.toString(), Integer.class, args.toArray());
        return n == null ? 0 : n;
    }
}