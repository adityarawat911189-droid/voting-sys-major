package com.evoting.votingsysmaj.util;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** PIN dobara check karne ki ek hi jagah (vote, fingerprint register). 15 minute mein 5 galat PIN ke baad block. */
@Component
public class PinGuard {

    private static final int MAX_WRONG_PINS = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private final PasswordEncoder encoder;

    // voterId -> [wrongCount, windowStartMillis]
    private final Map<Integer, long[]> wrongPins = new ConcurrentHashMap<>();

    public PinGuard(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public void check(int voterId, String storedHash, String pin) {
        long now = System.currentTimeMillis();
        long[] a = wrongPins.get(voterId);
        if (a != null && now - a[1] <= WINDOW_MS && a[0] >= MAX_WRONG_PINS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many wrong PIN attempts. Try again in a few minutes.");
        }
        if (pin == null || pin.isBlank() || storedHash == null || !encoder.matches(pin, storedHash)) {
            wrongPins.compute(voterId, (k, cur) ->
                    cur == null || now - cur[1] > WINDOW_MS ? new long[]{1, now} : new long[]{cur[0] + 1, cur[1]});
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Wrong PIN.");
        }
    }

    public void clear(int voterId) {
        wrongPins.remove(voterId);
    }
}