package com.evoting.votingsysmaj.service;

import java.util.List;
import java.util.Map;

public interface ElectionCancelService {

    // Dropdown ke liye: jo elections cancel ho sakte hain
    List<Map<String, Object>> cancellable();

    // Election cancel karo
    Map<String, Object> cancel(Integer electionId, String reason);
}