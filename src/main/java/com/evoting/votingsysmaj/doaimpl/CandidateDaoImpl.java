package com.evoting.votingsysmaj.doaimpl;

import com.evoting.votingsysmaj.dao.CandidateDao;
import com.evoting.votingsysmaj.pojo.Candidate;
import com.evoting.votingsysmaj.repository.CandidateRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class CandidateDaoImpl implements CandidateDao {

    private final CandidateRepository repository;

    public CandidateDaoImpl(CandidateRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean existsByVoter(Integer voterId) {
        return repository.existsByVoterId(voterId);
    }

    @Override
    public Candidate save(Candidate candidate) {
        return repository.save(candidate);
    }

    @Override
    public Optional<Candidate> findById(Integer id) {
        return repository.findById(id);
    }

    @Override
    public boolean isInClosedNominationElection(Integer candidateId, LocalDateTime now) {
        return repository.isInClosedNominationElection(candidateId, now);
    }

    @Override
    public boolean hasVotesOrResults(Integer candidateId) {
        return repository.hasVotesOrResults(candidateId);
    }

    @Override
    public void removeFromElections(Integer candidateId) {
        repository.removeFromElections(candidateId);
    }

    @Override
    public void removeChangeRequests(Integer candidateId) {
        repository.removeChangeRequests(candidateId);
    }

    @Override
    public void delete(Candidate candidate) {
        repository.delete(candidate);
    }
}