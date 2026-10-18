package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.CandidateSelfService;
import com.evoting.votingsysmaj.util.SessionStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/voter/candidate")
public class CandidateSelfController {

    public record ChangeRequest(String party, String manifesto, String qualification, String occupation) {}

    private final CandidateSelfService service;
    private final SessionStore sessions;

    public CandidateSelfController(CandidateSelfService service, SessionStore sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@CookieValue(name = SessionStore.COOKIE, required = false) String token) {
        return service.me(voterId(token));
    }

    @PostMapping("/change-request")
    public Map<String, Object> changeRequest(
            @CookieValue(name = SessionStore.COOKIE, required = false) String token,
            @RequestBody ChangeRequest req) {
        int voterId = voterId(token);
        return service.requestChange(voterId, req.party(), req.manifesto(), req.qualification(), req.occupation());
    }

    private int voterId(String token) {
        SessionStore.Session s = sessions.validate(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again."));
        if (!"VOTER".equals(s.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only voters can use this.");
        }
        return s.voterId();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", String.valueOf(ex.getReason())));
    }
}