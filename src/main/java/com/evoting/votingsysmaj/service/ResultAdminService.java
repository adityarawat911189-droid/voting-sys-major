package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface ResultAdminService {

    // Elections that are finished (completed, failed or cancelled)
    List<Map<String, Object>> finishedElections();

    // Full result for one election
    Map<String, Object> details(int electionId);
}