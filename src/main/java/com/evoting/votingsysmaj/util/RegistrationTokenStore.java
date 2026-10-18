package com.evoting.votingsysmaj.util;
import java.util.Set;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RegistrationTokenStore {

    public static final Duration TTL = Duration.ofMinutes(15);

    private record Entry(Integer voterId, Instant expiresAt) {}

    private final Map<String, Entry> tokens = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String issue(Integer voterId) {
        tokens.values().removeIf(e -> e.expiresAt().isBefore(Instant.now())); // purane saaf
        faceVerified.retainAll(tokens.keySet());
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.put(token, new Entry(voterId, Instant.now().plus(TTL)));
        return token;
    }

    /** Valid token ho to voter id deta hai, warna empty. */
    public Optional<Integer> validate(String token) {
        if (token == null) return Optional.empty();
        Entry e = tokens.get(token);
        if (e == null || e.expiresAt().isBefore(Instant.now())) {
            tokens.remove(token);
            return Optional.empty();
        }
        return Optional.of(e.voterId());
    }

    public void revoke(String token) {
        if (token != null) {
            tokens.remove(token);
            faceVerified.remove(token);
        }
    }

    private final Set<String> faceVerified = ConcurrentHashMap.newKeySet();

    public void markFaceVerified(String token) {
        if (token != null) faceVerified.add(token);
    }

    public boolean isFaceVerified(String token) {
        return token != null && faceVerified.contains(token);
    }
}