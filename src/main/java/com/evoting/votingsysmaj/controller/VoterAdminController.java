package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.service.VoterAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/voters")
public class VoterAdminController {

    private final VoterAdminService service;

    public VoterAdminController(VoterAdminService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "15") int size) {
        return service.list(page, size);
    }

    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        return service.search(q);
    }

    @GetMapping("/{id}")
    public Map<String, Object> details(@PathVariable int id) {
        return service.details(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}