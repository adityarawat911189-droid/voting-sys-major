package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface VoterAdminService {
    Map<String, Object> list(int page, int size);
    List<Map<String, Object>> search(String query);
    Map<String, Object> details(int voterId);
}