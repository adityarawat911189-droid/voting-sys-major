package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.VoterProfileService;
import com.evoting.votingsysmaj.util.SessionStore;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/voter")
public class VoterProfileController {

    public record PinRequest(String pin) {}

    private final VoterProfileService service;
    private final SessionStore sessions;

    public VoterProfileController(VoterProfileService service, SessionStore sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping("/profile")
    public Map<String, Object> profile(@CookieValue(name = SessionStore.COOKIE, required = false) String token) {
        return service.profile(sessions.requireVoter(token));
    }

    /** PIN bhejo -> WebAuthn options (JSON) milte hain. */
    @PostMapping(value = "/fingerprint/options", produces = MediaType.APPLICATION_JSON_VALUE)
    public String fingerprintOptions(
            @CookieValue(name = SessionStore.COOKIE, required = false) String token,
            @RequestBody PinRequest req) {
        return service.fingerprintOptions(sessions.requireVoter(token), req == null ? null : req.pin());
    }

    /** Browser ka credential (JSON) seedha bhejo. */
    @PostMapping(value = "/fingerprint/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> registerFingerprint(
            @CookieValue(name = SessionStore.COOKIE, required = false) String token,
            @RequestBody String credentialJson) {
        return service.registerFingerprint(sessions.requireVoter(token), credentialJson);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", String.valueOf(ex.getReason())));
    }
}