package com.evoting.votingsysmaj.service;

import java.util.Map;

public interface AuditService {

    void log(String action, String targetType, Integer targetId, String reason,
             Map<String, Object> oldValue, Map<String, Object> newValue);

    Integer currentAdminId();
    void logSystem(String action, String targetType, Integer targetId, String reason,
                   Map<String, Object> oldValue, Map<String, Object> newValue);

    Map<String, Object> list(String action, String from, String to, int page, int size);

    Map<String, Object> verify();
}