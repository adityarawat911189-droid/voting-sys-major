package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.CreateElectionRequest;
import com.evoting.votingsysmaj.pojo.Election;
import com.evoting.votingsysmaj.service.ElectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/elections")
public class ElectionController {

    private final ElectionService service;

    public ElectionController(ElectionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Election> create(@RequestBody CreateElectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}