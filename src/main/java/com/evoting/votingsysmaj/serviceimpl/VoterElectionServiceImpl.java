package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.pojo.Vote;
import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.VoterElectionService;
import com.evoting.votingsysmaj.util.PinGuard;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VoterElectionServiceImpl implements VoterElectionService {

    private final JdbcTemplate jdbc;
    private final PinGuard pinGuard;
    private final AuditService audit;
    private final SecureRandom random = new SecureRandom();

    public VoterElectionServiceImpl(JdbcTemplate jdbc, PinGuard pinGuard, AuditService audit) {
        this.jdbc = jdbc;
        this.pinGuard = pinGuard;
        this.audit = audit;
    }

    // ------------------------------------------------------------------
    // LIST: voter ke liye ONGOING elections
    // ------------------------------------------------------------------
    @Override
    public List<Map<String, Object>> ongoingFor(int voterId) {
        Map<String, Object> voter = voter(voterId);
        LocalDateTime now = LocalDateTime.now();

        List<Map<String, Object>> rows = jdbc.queryForList("""
                select e.id, e.title, e.description, e.election_type, e.state, e.city, e.ward_no,
                       to_char(e.end_time, 'DD Mon YYYY, HH12:MI AM') as end_label,
                       exists (select 1 from vote_participation vp
                               where vp.election_id = e.id and vp.voter_id = ?) as voted
                from elections e
                where e.is_deleted = false and e.status = 'ONGOING'
                  and e.start_time <= ? and e.end_time > ?
                order by e.end_time, e.id
                """, voterId, now, now);

        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> e : rows) {
            if (!eligible(e, voter)) continue;

            int electionId = ((Number) e.get("id")).intValue();
            List<Map<String, Object>> candidates = jdbc.queryForList("""
                    select c.id, mv.name, c.party, c.symbol
                    from election_candidates ec
                    join candidates c on c.id = ec.candidate_id
                    join mock_voters mv on mv.id = c.voter_id
                    where ec.election_id = ?
                    order by mv.name
                    """, electionId);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", electionId);
            item.put("title", e.get("title"));
            item.put("description", e.get("description"));
            item.put("type", e.get("election_type"));
            item.put("state", e.get("state"));
            item.put("city", e.get("city"));
            item.put("wardNo", e.get("ward_no"));
            item.put("endsAt", e.get("end_label"));
            item.put("voted", Boolean.TRUE.equals(e.get("voted")));
            item.put("candidates", candidates);
            out.add(item);
        }
        return out;
    }

    // ------------------------------------------------------------------
    // VOTE: sab ek transaction mein. Koi bhi step fail hua to sab rollback.
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public Map<String, Object> vote(int voterId, int electionId, int candidateId, String pin) {
        Map<String, Object> voter = voter(voterId);
        pinGuard.check(voterId, (String) voter.get("pin"), pin);

        // Election row lock: ek election ke saare votes line se chalte hain (hash chain bhi isi se safe rehti hai)
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, title, election_type, state, city, ward_no, status, start_time, end_time
                from elections
                where id = ? and is_deleted = false
                for update
                """, electionId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Election not found.");
        }
        Map<String, Object> e = rows.get(0);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = ((Timestamp) e.get("start_time")).toLocalDateTime();
        LocalDateTime end = ((Timestamp) e.get("end_time")).toLocalDateTime();
        if (!"ONGOING".equals(e.get("status")) || now.isBefore(start) || !now.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voting is not open for this election.");
        }
        if (!eligible(e, voter)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This election is not for your area.");
        }

        Integer isCandidate = jdbc.queryForObject(
                "select count(*) from election_candidates where election_id = ? and candidate_id = ?",
                Integer.class, electionId, candidateId);
        if (isCandidate == null || isCandidate == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid candidate for this election.");
        }

        // 1) Kisne vote diya: (election_id, voter_id) pe unique index ek hi baar ki guarantee deta hai
        try {
            jdbc.update("insert into vote_participation (election_id, voter_id, voted_at) values (?, ?, ?)",
                    electionId, voterId, now);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted in this election.");
        }

        // 2) Vote (anonymous: isme voter_id nahi hai). Hash chain har election ki apni.
        List<String> last = jdbc.queryForList(
                "select hash from votes where election_id = ? order by id desc limit 1", String.class, electionId);
        String prev = last.isEmpty() ? Vote.GENESIS_HASH : last.get(0);

        byte[] raw = new byte[16];
        random.nextBytes(raw);
        String receipt = HexFormat.of().formatHex(raw);   // voter ko milta hai, DB mein sirf uska hash
        String receiptHash = sha256(receipt);
        String hash = sha256(String.join("|", prev, String.valueOf(electionId),
                String.valueOf(candidateId), receiptHash));

        jdbc.update("""
                insert into votes (election_id, candidate_id, receipt_hash, prev_hash, hash)
                values (?, ?, ?, ?, ?)
                """, electionId, candidateId, receiptHash, prev, hash);

        // 3) Election ka live total
        Integer total = jdbc.queryForObject(
                "update elections set total_votes = total_votes + 1 where id = ? returning total_votes",
                Integer.class, electionId);

        // 4) Audit (voter ya candidate ki pehchaan nahi, taaki vote anonymous rahe)
        audit.logSystem("VOTE_CAST", "ELECTION", electionId, null, null,
                Map.of("title", String.valueOf(e.get("title")), "total_votes", total == null ? 0 : total));

        pinGuard.clear(voterId);
        return Map.of(
                "message", "Your vote has been recorded.",
                "election", String.valueOf(e.get("title")),
                "receipt", receipt);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private Map<String, Object> voter(int voterId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select id, pin, state, city, ward_no, registered from mock_voters where id = ?", voterId);
        if (rows.isEmpty() || !Boolean.TRUE.equals(rows.get(0).get("registered"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again.");
        }
        return rows.get(0);
    }

    /** COUNTRY: sab. STATE: state match. CITY: city match. WARD: city + ward_no match. */
    private boolean eligible(Map<String, Object> e, Map<String, Object> v) {
        String type = String.valueOf(e.get("election_type")).trim().toUpperCase();
        return switch (type) {
            case "COUNTRY" -> true;
            case "STATE" -> same(e.get("state"), v.get("state"));
            case "CITY" -> same(e.get("city"), v.get("city"));
            case "WARD" -> same(e.get("city"), v.get("city"))
                    && e.get("ward_no") != null && e.get("ward_no").equals(v.get("ward_no"));
            default -> false;
        };
    }

    // capital/small aur extra spaces ka farak nahi
    private boolean same(Object a, Object b) {
        if (a == null || b == null) return false;
        String x = a.toString().trim().replaceAll("\\s+", " ").toLowerCase();
        String y = b.toString().trim().replaceAll("\\s+", " ").toLowerCase();
        return !x.isEmpty() && x.equals(y);
    }

    private String sha256(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}