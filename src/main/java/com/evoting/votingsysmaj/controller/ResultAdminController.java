package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.ResultAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/results")
public class ResultAdminController {

    private final ResultAdminService service;

    public ResultAdminController(ResultAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return service.finishedElections();
    }

    @GetMapping("/{electionId}")
    public Map<String, Object> details(@PathVariable int electionId) {
        return service.details(electionId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}