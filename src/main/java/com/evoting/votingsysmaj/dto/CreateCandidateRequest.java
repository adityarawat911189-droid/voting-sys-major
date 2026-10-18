package com.evoting.votingsysmaj.dto;

public record CreateCandidateRequest(
        String name, String phone, String partyName,
        String manifesto, String qualification,
        String occupation) {}