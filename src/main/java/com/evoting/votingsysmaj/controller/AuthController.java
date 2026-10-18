package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dao.MockVoterDao;
import com.evoting.votingsysmaj.dto.LoginRequest;
import com.evoting.votingsysmaj.pojo.MockVoter;
import com.evoting.votingsysmaj.util.SessionStore;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final MockVoterDao mockVoterDao;
    private final SessionStore sessions;

    public AuthController(MockVoterDao mockVoterDao, SessionStore sessions) {
        this.mockVoterDao = mockVoterDao;
        this.sessions = sessions;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Optional<MockVoter> voter = mockVoterDao.login(request.getContactNo(), request.getPin());

        if (voter.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid mobile number or PIN."));
        }

        String token = sessions.issue(voter.get().getId(), voter.get().getRole());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(token, SessionStore.TTL.getSeconds()).toString())
                .body(Map.of("role", voter.get().getRole()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = SessionStore.COOKIE, required = false) String token) {
        sessions.revoke(token);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie("", 0).toString())
                .body(Map.of("loggedOut", true));
    }

    private ResponseCookie cookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(SessionStore.COOKIE, value)
                .httpOnly(true)
                .secure(false)       // production (HTTPS) mein true karna
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }
}