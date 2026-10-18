package com.evoting.votingsysmaj.controller;

import com.evoting.votingsysmaj.dto.CreateCandidateRequest;
import com.evoting.votingsysmaj.pojo.Candidate;
import com.evoting.votingsysmaj.service.CandidateService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/candidates")
@CrossOrigin(origins = "http://localhost:5173")
public class CandidateController {

    private final CandidateService service;

    public CandidateController(CandidateService service) {
        this.service = service;
    }

    @PostMapping
    public Candidate create(@RequestBody CreateCandidateRequest req) {
        return service.create(req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}