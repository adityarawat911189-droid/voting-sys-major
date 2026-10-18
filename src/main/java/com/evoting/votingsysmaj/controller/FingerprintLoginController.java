package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.FingerprintLoginService;
import com.evoting.votingsysmaj.util.SessionStore;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/webauthn")
public class FingerprintLoginController {

    public record ContactRequest(String contactNo) {}

    private final FingerprintLoginService service;
    private final SessionStore sessions;

    public FingerprintLoginController(FingerprintLoginService service, SessionStore sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    /** Step 1: mobile number bhejo -> WebAuthn options (JSON). */
    @PostMapping(value = "/options", produces = MediaType.APPLICATION_JSON_VALUE)
    public String options(@RequestBody ContactRequest req) {
        return service.options(req == null ? null : req.contactNo());
    }

    /** Step 2: browser ka assertion bhejo -> session cookie + role. */
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestParam String contactNo, @RequestBody String credentialJson) {
        Map<String, Object> r = service.finish(contactNo, credentialJson);
        String role = String.valueOf(r.get("role"));
        String token = sessions.issue((Integer) r.get("voterId"), role);

        ResponseCookie cookie = ResponseCookie.from(SessionStore.COOKIE, token)
                .httpOnly(true)
                .secure(false)       // production (HTTPS) mein true karna
                .sameSite("Strict")
                .path("/")
                .maxAge(SessionStore.TTL)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("role", role));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", String.valueOf(ex.getReason())));
    }
}