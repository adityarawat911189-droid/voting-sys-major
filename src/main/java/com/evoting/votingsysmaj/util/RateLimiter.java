package com.evoting.votingsysmaj.util;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

@Component
public class RateLimiter {

    private final Map<String, Deque<Instant>> hits = new HashMap<>();

    public synchronized boolean allow(String key, int max, Duration window) {
        Instant now = Instant.now();
        Deque<Instant> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        while (!q.isEmpty() && q.peekFirst().isBefore(now.minus(window))) q.pollFirst();
        if (q.size() >= max) return false;
        q.addLast(now);
        return true;
    }
}