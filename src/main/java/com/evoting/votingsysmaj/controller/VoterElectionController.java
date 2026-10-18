package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.VoterElectionService;
import com.evoting.votingsysmaj.util.SessionStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voter")
public class VoterElectionController {

    public record VoteRequest(Integer candidateId, String pin) {}

    private final VoterElectionService service;
    private final SessionStore sessions;

    public VoterElectionController(VoterElectionService service, SessionStore sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping("/elections")
    public List<Map<String, Object>> elections(
            @CookieValue(name = SessionStore.COOKIE, required = false) String token) {
        return service.ongoingFor(voterId(token));
    }

    @PostMapping("/elections/{electionId}/vote")
    public Map<String, Object> vote(
            @CookieValue(name = SessionStore.COOKIE, required = false) String token,
            @PathVariable int electionId,
            @RequestBody VoteRequest req) {
        int voterId = voterId(token);
        if (req == null || req.candidateId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a candidate.");
        }
        return service.vote(voterId, electionId, req.candidateId(), req.pin());
    }

    /** Cookie se voter id nikalta hai. Sirf VOTER role list dekh sakta hai aur vote kar sakta hai. */
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