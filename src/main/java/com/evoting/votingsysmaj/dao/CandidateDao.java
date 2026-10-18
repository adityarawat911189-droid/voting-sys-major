package com.evoting.votingsysmaj.dao;

import com.evoting.votingsysmaj.pojo.Candidate;

import java.time.LocalDateTime;
import java.util.Optional;

public interface CandidateDao {
    boolean existsByVoter(Integer voterId);
    Candidate save(Candidate candidate);

    Optional<Candidate> findById(Integer id);
    boolean isInClosedNominationElection(Integer candidateId, LocalDateTime now);
    boolean hasVotesOrResults(Integer candidateId);
    void removeFromElections(Integer candidateId);
    void removeChangeRequests(Integer candidateId);
    void delete(Candidate candidate);
}