package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface VoterElectionService {

    List<Map<String, Object>> ongoingFor(int voterId);

    Map<String, Object> vote(int voterId, int electionId, int candidateId, String pin);
}