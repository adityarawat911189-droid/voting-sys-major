package com.evoting.votingsysmaj.util;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** Login ke baad ka session. Token HttpOnly cookie mein jaata hai. Server restart par sab logout ho jaate hain. */
@Component
public class SessionStore {

    public static final String COOKIE = "session_token";
    public static final Duration TTL = Duration.ofHours(2);

    public record Session(Integer voterId, String role, Instant expiresAt) {}

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String issue(Integer voterId, String role) {
        sessions.values().removeIf(s -> s.expiresAt().isBefore(Instant.now()));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new Session(voterId, role, Instant.now().plus(TTL)));
        return token;
    }

    public Optional<Session> validate(String token) {
        if (token == null) return Optional.empty();
        Session s = sessions.get(token);
        if (s == null || s.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            return Optional.empty();
        }
        return Optional.of(s);
    }

    /** Cookie se voter id. Login nahi ya VOTER role nahi to 401/403. */
    public int requireVoter(String token) {
        Session s = validate(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again."));
        if (!"VOTER".equals(s.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only voters can use this.");
        }
        return s.voterId();
    }

    public void revoke(String token) {
        if (token != null) sessions.remove(token);
    }
}