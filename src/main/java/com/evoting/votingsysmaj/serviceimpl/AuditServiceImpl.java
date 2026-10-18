package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.service.AuditService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditServiceImpl implements AuditService {

    private static final String GENESIS = "0".repeat(64);
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS");
    private static final DateTimeFormatter REF = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final JdbcTemplate jdbc;

    public AuditServiceImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Login jodne par yahan logged-in admin ki id aayegi. Abhi DB me ek hi ADMIN hai to wahi.
    @Override
    public Integer currentAdminId() {
        List<Integer> ids = jdbc.queryForList("select id from mock_voters where role = 'ADMIN'", Integer.class);
        return ids.size() == 1 ? ids.get(0) : null;
    }

    @Override
    @Transactional
    public void log(String action, String targetType, Integer targetId, String reason,
                    Map<String, Object> oldValue, Map<String, Object> newValue) {
        write(currentAdminId(), action, targetType, targetId, reason, oldValue, newValue);
    }

    // Scheduler jaise automatic kaamon ke liye: admin_id khaali rehta hai
    @Override
    @Transactional
    public void logSystem(String action, String targetType, Integer targetId, String reason,
                          Map<String, Object> oldValue, Map<String, Object> newValue) {
        write(null, action, targetType, targetId, reason, oldValue, newValue);
    }

    private void write(Integer adminId, String action, String targetType, Integer targetId, String reason,
                       Map<String, Object> oldValue, Map<String, Object> newValue) {
        // Ek time par ek hi entry likhi jaye, taaki hash chain na tute
        jdbc.execute("select pg_advisory_xact_lock(90210)");

        List<String> last = jdbc.queryForList("select hash from audit_logs order by id desc limit 1", String.class);
        String prev = last.isEmpty() ? GENESIS : last.get(0);

        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
        String ref = "AUD-" + now.format(REF) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String why = reason == null || reason.isBlank() ? null : reason.trim();
        String oldJson = norm(toJson(oldValue));
        String newJson = norm(toJson(newValue));

        String hash = hash(prev, ref, adminId, action, targetType, targetId, why, "SUCCESS", oldJson, newJson, now);

        jdbc.update("""
                insert into audit_logs (ref_no, admin_id, action, target_type, target_id, reason, status,
                                        old_value, new_value, created_at, prev_hash, hash)
                values (?, ?, ?, ?, ?, ?, 'SUCCESS', cast(? as jsonb), cast(? as jsonb), ?, ?, ?)
                """, ref, adminId, action, targetType, targetId, why, oldJson, newJson, now, prev, hash);
    }

    @Override
    public Map<String, Object> list(String action, String from, String to, int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int p = Math.max(page, 1);

        StringBuilder where = new StringBuilder(" where 1 = 1");
        List<Object> args = new ArrayList<>();
        try {
            if (action != null && !action.isBlank()) {
                where.append(" and a.action = ?");
                args.add(action.trim());
            }
            if (from != null && !from.isBlank()) {
                where.append(" and a.created_at >= ?");
                args.add(LocalDate.parse(from).atStartOfDay());
            }
            if (to != null && !to.isBlank()) {
                where.append(" and a.created_at < ?");
                args.add(LocalDate.parse(to).plusDays(1).atStartOfDay());
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date");
        }

        Integer total = jdbc.queryForObject("select count(*) from audit_logs a" + where, Integer.class, args.toArray());
        int t = total == null ? 0 : total;

        List<Object> itemArgs = new ArrayList<>(args);
        itemArgs.add(s);
        itemArgs.add((p - 1) * s);

        List<Map<String, Object>> items = jdbc.queryForList("""
                select a.id, a.ref_no,
                       to_char(a.created_at, 'DD Mon YYYY HH12:MI:SS AM') as time,
                       coalesce(v.name, 'Admin') as admin,
                       a.action, a.target_type, a.target_id, a.reason, a.status,
                       a.old_value::text as old_value, a.new_value::text as new_value,
                       left(a.hash, 10) as hash_short
                from audit_logs a
                left join mock_voters v on v.id = a.admin_id
                """ + where + " order by a.id desc limit ? offset ?", itemArgs.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("items", items);
        res.put("total", t);
        res.put("page", p);
        res.put("size", s);
        res.put("pages", Math.max(1, (int) Math.ceil(t / (double) s)));
        return res;
    }

    // Poori chain dobara check karta hai: kisi ne entry badli to yahan pakdi jayegi
    @Override
    public Map<String, Object> verify() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, ref_no, admin_id, action, target_type, target_id, reason, status,
                       old_value::text as old_value, new_value::text as new_value,
                       created_at, prev_hash, hash
                from audit_logs
                order by id
                """);

        String prev = GENESIS;
        Integer brokenAt = null;
        for (Map<String, Object> r : rows) {
            LocalDateTime at = ((Timestamp) r.get("created_at")).toLocalDateTime();
            String expected = hash(prev, (String) r.get("ref_no"), (Integer) r.get("admin_id"),
                    (String) r.get("action"), (String) r.get("target_type"), (Integer) r.get("target_id"),
                    (String) r.get("reason"), (String) r.get("status"),
                    (String) r.get("old_value"), (String) r.get("new_value"), at);
            if (!prev.equals(r.get("prev_hash")) || !expected.equals(r.get("hash"))) {
                brokenAt = (Integer) r.get("id");
                break;
            }
            prev = (String) r.get("hash");
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("valid", brokenAt == null);
        res.put("checked", rows.size());
        res.put("brokenAtId", brokenAt);
        return res;
    }

    // ---------- helpers ----------

    private String hash(String prev, String ref, Integer adminId, String action, String type, Integer targetId,
                        String reason, String status, String oldJson, String newJson, LocalDateTime at) {
        String raw = String.join("|", prev, ref, s(adminId), action, s(type), s(targetId),
                s(reason), status, s(oldJson), s(newJson), at.format(TS));
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private String s(Object o) {
        return o == null ? "" : o.toString();
    }

    private String norm(String json) {
        if (json == null) return null;
        return jdbc.queryForObject("select cast(? as jsonb)::text", String.class, json);
    }

    private String toJson(Map<String, Object> m) {
        if (m == null) return null;
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(esc(e.getKey())).append("\":");
            Object v = e.getValue();
            if (v == null) sb.append("null");
            else if (v instanceof Number || v instanceof Boolean) sb.append(v);
            else sb.append('"').append(esc(v.toString())).append('"');
        }
        return sb.append('}').toString();
    }

    private String esc(String t) {
        return t.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }
}