package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.RejectChangeRequest;
import com.evoting.votingsysmaj.service.ChangeRequestAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/change-requests")
public class ChangeRequestAdminController {

    private final ChangeRequestAdminService service;

    public ChangeRequestAdminController(ChangeRequestAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(defaultValue = "PENDING") String status) {
        return service.list(status);
    }

    @PostMapping("/{id}/approve")
    public Map<String, Object> approve(@PathVariable int id) {
        return service.approve(id);
    }

    @PostMapping("/{id}/reject")
    public Map<String, Object> reject(@PathVariable int id, @RequestBody RejectChangeRequest req) {
        return service.reject(id, req.reason());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}