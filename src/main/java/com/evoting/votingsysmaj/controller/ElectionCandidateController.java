package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.AddCandidateToElectionRequest;
import com.evoting.votingsysmaj.service.ElectionCandidateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/election-candidates")
public class ElectionCandidateController {

    private final ElectionCandidateService service;

    public ElectionCandidateController(ElectionCandidateService service) {
        this.service = service;
    }

    @GetMapping("/elections")
    public List<Map<String, Object>> elections() {
        return service.upcomingElections();
    }

    @GetMapping("/candidates")
    public List<Map<String, Object>> candidates(@RequestParam int electionId) {
        return service.eligibleCandidates(electionId);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(@RequestBody AddCandidateToElectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.add(req.electionId(), req.candidateId()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}