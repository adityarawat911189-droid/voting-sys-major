package com.evoting.votingsysmaj.dto;

import java.time.LocalDateTime;

public record CreateElectionRequest(
        String title,
        String description,
        String electionType,
        String state,
        String city,
        Integer wardNo,
        LocalDateTime nominationStart,
        LocalDateTime nominationEnd,
        LocalDateTime startTime,
        LocalDateTime endTime) {}