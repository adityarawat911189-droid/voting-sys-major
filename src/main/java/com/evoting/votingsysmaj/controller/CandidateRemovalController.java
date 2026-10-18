package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.RemoveCandidateRequest;
import com.evoting.votingsysmaj.service.CandidateRemovalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/candidate-removal")
public class CandidateRemovalController {

    private final CandidateRemovalService service;

    public CandidateRemovalController(CandidateRemovalService service) {
        this.service = service;
    }

    @PostMapping("/demote")
    public Map<String, Object> demote(@RequestBody RemoveCandidateRequest req) {
        return service.demoteByNamePhone(req.name(), req.phone(), req.reason());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}