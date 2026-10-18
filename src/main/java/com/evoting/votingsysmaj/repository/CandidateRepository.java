package com.evoting.votingsysmaj.repository;

import com.evoting.votingsysmaj.pojo.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface CandidateRepository extends JpaRepository<Candidate, Integer> {

    boolean existsByVoterId(Integer voterId);

    @Query(value = """
            select count(*) > 0 from election_candidates ec
            join elections e on e.id = ec.election_id
            where ec.candidate_id = :candidateId
              and e.is_deleted = false
              and e.nomination_end < :now
            """, nativeQuery = true)
    boolean isInClosedNominationElection(@Param("candidateId") Integer candidateId,
                                         @Param("now") LocalDateTime now);

    @Query(value = """
            select (select count(*) from votes where candidate_id = :candidateId)
                 + (select count(*) from election_results where candidate_id = :candidateId)
                 + (select count(*) from elections where winner_candidate_id = :candidateId) > 0
            """, nativeQuery = true)
    boolean hasVotesOrResults(@Param("candidateId") Integer candidateId);

    @Modifying
    @Query(value = "delete from election_candidates where candidate_id = :candidateId", nativeQuery = true)
    void removeFromElections(@Param("candidateId") Integer candidateId);

    @Modifying
    @Query(value = "delete from candidate_change_requests where candidate_id = :candidateId", nativeQuery = true)
    void removeChangeRequests(@Param("candidateId") Integer candidateId);
}