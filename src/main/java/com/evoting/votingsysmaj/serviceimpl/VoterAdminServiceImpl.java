package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.VoterAdminService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VoterAdminServiceImpl implements VoterAdminService {

    // true = Aadhaar aur PAN me sirf aakhri 4 akshar dikhenge. Poora dekhna ho to false karo.
    private static final boolean MASK_SENSITIVE = true;

    private final JdbcTemplate jdbc;

    public VoterAdminServiceImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, Object> list(int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int p = Math.max(page, 1);

        Integer total = jdbc.queryForObject("select count(*) from mock_voters", Integer.class);
        int t = total == null ? 0 : total;

        List<Map<String, Object>> items = jdbc.queryForList("""
                select id, name, gender, city, state, ward_no, contact_no, registered, role
                from mock_voters
                order by id
                limit ? offset ?
                """, s, (p - 1) * s);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("items", items);
        res.put("total", t);
        res.put("page", p);
        res.put("size", s);
        res.put("pages", Math.max(1, (int) Math.ceil(t / (double) s)));
        return res;
    }

    @Override
    public List<Map<String, Object>> search(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) throw new IllegalArgumentException("Please enter at least 2 characters");

        String like = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        String digits = q.replaceAll("\\s", "");
        String likeDigits = like.replaceAll("\\s", "");

        return jdbc.queryForList("""
                select id, name, father_name, city, state, contact_no, registered
                from mock_voters
                where lower(name) like lower(?)
                   or contact_no like ?
                   or aadhaar_no = ?
                   or cast(id as text) = ?
                order by name, id
                limit 20
                """, "%" + like + "%", likeDigits + "%", digits, digits);
    }

    @Override
    public Map<String, Object> details(int voterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, name, gender, to_char(dob, 'DD Mon YYYY') as dob,
                       father_name, mother_name, spouse_name, nationality,
                       state, city, ward_no, address,
                       contact_no, aadhaar_no, pan_no, registered, role
                from mock_voters
                where id = ?
                """, voterId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Voter not found");

        Map<String, Object> v = new LinkedHashMap<>(rows.get(0));
        if (MASK_SENSITIVE) {
            v.put("aadhaar_no", mask(v.get("aadhaar_no")));
            v.put("pan_no", mask(v.get("pan_no")));
        }

        v.put("candidacy", jdbc.queryForList("""
                select id as candidate_id, party, status
                from candidates
                where voter_id = ?
                """, voterId));

        v.put("candidate_elections", jdbc.queryForList("""
                select e.title, e.status
                from election_candidates ec
                join candidates c on c.id = ec.candidate_id
                join elections e on e.id = ec.election_id
                where c.voter_id = ?
                order by e.start_time
                """, voterId));

        v.put("voted_in", jdbc.queryForList("""
                select e.title, to_char(vp.voted_at, 'DD Mon YYYY HH12:MI AM') as voted_at
                from vote_participation vp
                join elections e on e.id = vp.election_id
                where vp.voter_id = ?
                order by vp.voted_at desc
                """, voterId));

        return v;
    }

    private String mask(Object o) {
        if (o == null) return null;
        String s = o.toString();
        if (s.length() <= 4) return s;
        return "*".repeat(s.length() - 4) + s.substring(s.length() - 4);
    }
}