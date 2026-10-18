package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface ElectionCandidateService {

    // Dropdown 1: sirf hone wale elections
    List<Map<String, Object>> upcomingElections();

    // Dropdown 2: sirf us election ke type ke candidates
    List<Map<String, Object>> eligibleCandidates(int electionId);

    // Candidate ko election me add karo
    Map<String, Object> add(Integer electionId, Integer candidateId);
}