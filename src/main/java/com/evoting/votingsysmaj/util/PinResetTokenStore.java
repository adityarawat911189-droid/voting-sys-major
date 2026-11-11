package com.evoting.votingsysmaj.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PinResetTokenStore {

    private record Entry(String contactNo, Instant expires) {}

    private final Map<String, Entry> map = new ConcurrentHashMap<>();
    private final SecureRandom rnd = new SecureRandom();

    public String issue(String contactNo) {
        byte[] b = new byte[32];
        rnd.nextBytes(b);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        map.put(token, new Entry(contactNo, Instant.now().plus(Duration.ofMinutes(5))));
        return token;
    }

    /** Token ek hi baar chalta hai. */
    public boolean consume(String token, String contactNo) {
        Entry e = (token == null || token.isBlank()) ? null : map.remove(token);
        return e != null && e.contactNo().equals(contactNo) && Instant.now().isBefore(e.expires());
    }
}