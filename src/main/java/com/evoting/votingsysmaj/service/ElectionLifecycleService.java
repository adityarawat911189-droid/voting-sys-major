package com.evoting.votingsysmaj.service;

import java.util.List;

public interface ElectionLifecycleService {
    List<Integer> dueToOpenNomination();
    List<Integer> dueToStart();
    List<Integer> dueToComplete();

    void openNomination(int electionId);
    void startVoting(int electionId);
    void complete(int electionId);
}