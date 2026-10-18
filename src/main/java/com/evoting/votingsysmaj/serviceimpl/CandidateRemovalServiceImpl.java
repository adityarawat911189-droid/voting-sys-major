package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.CandidateRemovalService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class CandidateRemovalServiceImpl implements CandidateRemovalService {

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public CandidateRemovalServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Override
    public List<Map<String, Object>> listAll() {
        return jdbc.queryForList("""
                select c.id, v.id as voter_id, v.name, v.father_name, v.city,
                       right(v.contact_no, 4) as phone_last4,
                       c.party, c.status,
                       (select count(*) from election_candidates ec where ec.candidate_id = c.id) as election_count
                from candidates c
                join mock_voters v on v.id = c.voter_id
                order by v.name, v.id
                """);
    }

    @Override
    @Transactional
    public Map<String, Object> demoteByNamePhone(String name, String phone, String reason) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Name is required");
        if (phone == null || !phone.trim().matches("[6-9][0-9]{9}"))
            throw new IllegalArgumentException("Please enter a valid 10-digit phone number");
        String why = reason == null ? "" : reason.trim();
        if (why.length() < 10) throw new IllegalArgumentException("Reason must be at least 10 characters long");
        if (why.length() > 500) throw new IllegalArgumentException("Reason cannot exceed 500 characters");

        List<Map<String, Object>> rows = jdbc.queryForList("""
                select c.id, c.party, v.id as voter_id, v.name
                from candidates c
                join mock_voters v on v.id = c.voter_id
                where lower(trim(v.name)) = lower(trim(?)) and v.contact_no = ?
                """, name, phone.trim());
        if (rows.isEmpty())
            throw new IllegalArgumentException("No candidate found with this name and phone number");

        Map<String, Object> c = rows.get(0);
        int candidateId = ((Number) c.get("id")).intValue();
        int voterId = ((Number) c.get("voter_id")).intValue();
        String voterName = String.valueOf(c.get("name"));
        String party = c.get("party") == null ? "Independent" : String.valueOf(c.get("party"));

        if (count("select count(*) from election_candidates ec join elections e on e.id = ec.election_id "
                + "where ec.candidate_id = ? and e.status in ('ONGOING', 'COMPLETED')", candidateId) > 0)
            throw new IllegalArgumentException("This candidate is part of an ongoing or completed election and cannot be converted to a voter");

        if (count("select count(*) from votes where candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("Votes have already been cast for this candidate, so they cannot be converted to a voter");

        if (count("select count(*) from elections where winner_candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("This candidate is the winner of an election and cannot be converted to a voter");

        if (count("select count(*) from election_results where candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("An election result exists for this candidate, so they cannot be converted to a voter");

        jdbc.update("delete from candidate_change_requests where candidate_id = ?", candidateId);
        jdbc.update("delete from election_candidates where candidate_id = ?", candidateId);
        jdbc.update("delete from candidates where id = ?", candidateId);

        audit.log("CANDIDATE_REMOVED", "CANDIDATE", candidateId, why,
                Map.of("name", voterName, "voter_id", voterId, "party", party),
                Map.of("role", "VOTER"));

        return Map.of("message", voterName + " is now a regular voter");
    }


    @Override
    @Transactional
    public Map<String, Object> demote(int candidateId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select c.id, v.name
                from candidates c
                join mock_voters v on v.id = c.voter_id
                where c.id = ?
                """, candidateId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Candidate not found");
        String name = String.valueOf(rows.get(0).get("name"));

        if (count("select count(*) from election_candidates ec join elections e on e.id = ec.election_id "
                + "where ec.candidate_id = ? and e.status in ('ONGOING', 'COMPLETED')", candidateId) > 0)
            throw new IllegalArgumentException("This candidate is part of an ongoing or completed election and cannot be converted to a voter");

        if (count("select count(*) from votes where candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("Votes have already been cast for this candidate, so they cannot be converted to a voter");

        if (count("select count(*) from elections where winner_candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("This candidate is the winner of an election and cannot be converted to a voter");

        if (count("select count(*) from election_results where candidate_id = ?", candidateId) > 0)
            throw new IllegalArgumentException("An election result exists for this candidate, so they cannot be converted to a voter");

        jdbc.update("delete from candidate_change_requests where candidate_id = ?", candidateId);
        jdbc.update("delete from election_candidates where candidate_id = ?", candidateId);
        jdbc.update("delete from candidates where id = ?", candidateId);

        return Map.of("message", name + " is now a regular voter");
    }


    private int count(String sql, int id) {
        Integer n = jdbc.queryForObject(sql, Integer.class, id);
        return n == null ? 0 : n;
    }
}