package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.CancelElectionRequest;
import com.evoting.votingsysmaj.service.ElectionCancelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/election-cancel")
public class ElectionCancelController {

    private final ElectionCancelService service;

    public ElectionCancelController(ElectionCancelService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return service.cancellable();
    }

    @PostMapping
    public Map<String, Object> cancel(@RequestBody CancelElectionRequest req) {
        return service.cancel(req.electionId(), req.reason());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}