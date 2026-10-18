package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.ElectionCandidateService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ElectionCandidateServiceImpl implements ElectionCandidateService {

    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public ElectionCandidateServiceImpl(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Override
    public List<Map<String, Object>> upcomingElections() {
        return jdbc.queryForList("""
                select id, title, election_type, state, city, ward_no,
                       to_char(nomination_end, 'DD Mon YYYY HH12:MI AM') as nomination_end
                from elections
                where is_deleted = false
                  and status in ('DRAFT', 'NOMINATION')
                  and nomination_end > ?
                order by start_time
                """, LocalDateTime.now());
    }

    @Override
    public List<Map<String, Object>> eligibleCandidates(int electionId) {
        Map<String, Object> election = openElection(electionId);
        List<Map<String, Object>> all = jdbc.queryForList("""
                select c.id, v.name, c.party, c.status, v.state, v.city
                from candidates c
                join mock_voters v on v.id = c.voter_id
                where c.status <> 'REJECTED'
                  and not exists (select 1 from election_candidates ec
                                  where ec.election_id = ? and ec.candidate_id = c.id)
                order by v.name
                """, electionId);
        return all.stream().filter(c -> belongs(election, c)).toList();
    }

    @Override
    @Transactional
    public Map<String, Object> add(Integer electionId, Integer candidateId) {
        if (electionId == null || candidateId == null)
            throw new IllegalArgumentException("Both election and candidate must be selected");

        Map<String, Object> election = openElection(electionId);

        List<Map<String, Object>> rows = jdbc.queryForList("""
                select c.id, c.status, v.name, v.state, v.city
                from candidates c
                join mock_voters v on v.id = c.voter_id
                where c.id = ?
                """, candidateId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Candidate not found");

        Map<String, Object> c = rows.get(0);
        if ("REJECTED".equals(c.get("status")))
            throw new IllegalArgumentException("A rejected candidate cannot be added to an election");
        if (!belongs(election, c))
            throw new IllegalArgumentException("This candidate does not belong to the area of this election");

        Integer dup = jdbc.queryForObject(
                "select count(*) from election_candidates where election_id = ? and candidate_id = ?",
                Integer.class, electionId, candidateId);
        if (dup != null && dup > 0)
            throw new IllegalArgumentException("This candidate is already added to this election");

        jdbc.update("insert into election_candidates (election_id, candidate_id) values (?, ?)",
                electionId, candidateId);
        jdbc.update("update candidates set status = 'APPROVED' where id = ? and status = 'PENDING'",
                candidateId);

        audit.log("CANDIDATE_ADDED_TO_ELECTION", "ELECTION", electionId, null, null,
                Map.of("election", String.valueOf(election.get("title")),
                        "candidate", String.valueOf(c.get("name")),
                        "candidate_id", candidateId));

        return Map.of("message", "Candidate added to the election successfully");
    }

    // ---------- helpers ----------

    private Map<String, Object> openElection(int electionId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, title, election_type, state, city, ward_no
                from elections
                where id = ? and is_deleted = false
                  and status in ('DRAFT', 'NOMINATION')
                  and nomination_end > ?
                """, electionId, LocalDateTime.now());
        if (rows.isEmpty())
            throw new IllegalArgumentException("This election is no longer upcoming or could not be found");
        return rows.get(0);
    }

    // Candidate (voter) ka area election ke type se match karta hai ya nahi
    private boolean belongs(Map<String, Object> election, Map<String, Object> voter) {
        String type = String.valueOf(election.get("election_type")).toUpperCase();
        boolean needState = !type.equals("COUNTRY");
        boolean needCity = type.equals("CITY") || type.equals("WARD");
        // WARD: abhi ward_no check nahi (mock_voters me ward_no khaali hai)
        if (needState && !same(election.get("state"), voter.get("state"))) return false;
        if (needCity && !same(election.get("city"), voter.get("city"))) return false;
        return true;
    }

    private boolean same(Object a, Object b) {
        return a != null && b != null && a.toString().trim().equalsIgnoreCase(b.toString().trim());
    }
}