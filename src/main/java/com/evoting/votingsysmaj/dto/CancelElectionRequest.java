package com.evoting.votingsysmaj.dto;

public record CancelElectionRequest(Integer electionId, String reason) {}