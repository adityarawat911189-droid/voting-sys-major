package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.dao.CandidateDao;
import com.evoting.votingsysmaj.dao.MockVoterDao;
import com.evoting.votingsysmaj.dto.CreateCandidateRequest;
import com.evoting.votingsysmaj.pojo.Candidate;
import com.evoting.votingsysmaj.pojo.MockVoter;
import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.CandidateService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CandidateServiceImpl implements CandidateService {

    private final MockVoterDao voterDao;
    private final CandidateDao candidateDao;
    private final AuditService audit;

    public CandidateServiceImpl(MockVoterDao voterDao, CandidateDao candidateDao, AuditService audit) {
        this.voterDao = voterDao;
        this.candidateDao = candidateDao;
        this.audit = audit;
    }

    @Override
    @Transactional
    public Candidate create(CreateCandidateRequest req) {
        MockVoter voter = voterDao
                .findRegisteredByNameAndPhone(req.name(), req.phone())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Voter not found"));

        if (candidateDao.existsByVoter(voter.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This voter is already a candidate");
        }

        Candidate c = new Candidate();
        c.setVoterId(voter.getId());
        c.setParty(req.partyName());
        c.setManifesto(req.manifesto());
        c.setQualification(req.qualification());
        c.setOccupation(req.occupation());
        c.setStatus(Candidate.STATUS_APPROVED);
        Candidate saved = candidateDao.save(c);

        audit.log("CANDIDATE_CREATED", "CANDIDATE", saved.getId(), null, null,
                Map.of("name", String.valueOf(req.name()),
                        "voter_id", voter.getId(),
                        "party", req.partyName() == null ? "" : req.partyName().trim()));

        return saved;
    }

    @Override
    @Transactional
    public void delete(Integer candidateId) {
        Candidate c = candidateDao.findById(candidateId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Candidate not found"));

        if (candidateDao.isInClosedNominationElection(candidateId, LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Nomination period has ended, so the candidate cannot be deleted");
        }

        if (candidateDao.hasVotesOrResults(candidateId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This candidate has votes or results and cannot be deleted");
        }

        candidateDao.removeFromElections(candidateId);
        candidateDao.removeChangeRequests(candidateId);
        candidateDao.delete(c);

        audit.log("CANDIDATE_REMOVED", "CANDIDATE", candidateId, null,
                Map.of("candidate_id", candidateId), Map.of("role", "VOTER"));
    }
}