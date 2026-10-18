package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface ChangeRequestAdminService {
    List<Map<String, Object>> list(String status);
    Map<String, Object> approve(int requestId);
    Map<String, Object> reject(int requestId, String reason);
}