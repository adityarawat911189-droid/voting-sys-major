package com.evoting.votingsysmaj.service;

import com.evoting.votingsysmaj.dto.CreateCandidateRequest;
import com.evoting.votingsysmaj.pojo.Candidate;

public interface CandidateService {
    Candidate create(CreateCandidateRequest req);
    void delete(Integer candidateId);
}