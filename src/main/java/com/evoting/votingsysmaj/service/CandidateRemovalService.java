package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface CandidateRemovalService {
    List<Map<String, Object>> listAll();
    Map<String, Object> demote(int candidateId);
    Map<String, Object> demoteByNamePhone(String name, String phone, String reason);
}