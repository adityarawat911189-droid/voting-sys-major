package com.evoting.votingsysmaj.serviceimpl;

import com.evoting.votingsysmaj.dao.ElectionDao;
import com.evoting.votingsysmaj.dto.CreateElectionRequest;
import com.evoting.votingsysmaj.pojo.Election;
import com.evoting.votingsysmaj.service.AuditService;
import com.evoting.votingsysmaj.service.ElectionService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class ElectionServiceImpl implements ElectionService {

    private static final Set<String> TYPES = Set.of("COUNTRY", "STATE", "CITY", "WARD");

    private final ElectionDao dao;
    private final AuditService audit;

    public ElectionServiceImpl(ElectionDao dao, AuditService audit) {
        this.dao = dao;
        this.audit = audit;
    }


    @Override
    @Transactional
    public Election create(CreateElectionRequest req) {
        if (isBlank(req.title())) throw new IllegalArgumentException("Title cannot be empty");

        String type = req.electionType() == null ? "" : req.electionType().trim().toUpperCase();
        if (!TYPES.contains(type)) throw new IllegalArgumentException("Election type must be one of COUNTRY, STATE, CITY, or WARD");

        boolean needState = !type.equals("COUNTRY");
        boolean needCity = type.equals("CITY") || type.equals("WARD");
        boolean needWard = type.equals("WARD");

        if (needState && isBlank(req.state())) throw new IllegalArgumentException("State is required");
        if (needCity && isBlank(req.city())) throw new IllegalArgumentException("City is required");
        if (needWard && (req.wardNo() == null || req.wardNo() <= 0)) throw new IllegalArgumentException("Ward number is required");

        if (req.nominationStart() == null || req.nominationEnd() == null
                || req.startTime() == null || req.endTime() == null)
            throw new IllegalArgumentException("All dates are required");

        if (!req.nominationStart().isBefore(req.nominationEnd()))
            throw new IllegalArgumentException("Nomination start must be before nomination end");
        if (req.nominationEnd().isAfter(req.startTime()))
            throw new IllegalArgumentException("Nomination end cannot be after voting start");
        if (!req.startTime().isBefore(req.endTime()))
            throw new IllegalArgumentException("Voting start must be before voting end");

        Election e = new Election();
        e.setTitle(req.title().trim());
        e.setDescription(req.description());
        e.setElectionType(type);
        e.setState(needState ? req.state().trim() : null);
        e.setCity(needCity ? req.city().trim() : null);
        e.setWardNo(needWard ? req.wardNo() : null);
        e.setNominationStart(req.nominationStart());
        e.setNominationEnd(req.nominationEnd());
        e.setStartTime(req.startTime());
        e.setEndTime(req.endTime());
        // status default DRAFT Election.java se aayega, created_by abhi null

        Election saved = dao.save(e);
        audit.log("ELECTION_CREATED", "ELECTION", saved.getId(), null, null,
                Map.of("title", req.title().trim(),
                        "type", type,
                        "voting_start", req.startTime().toString(),
                        "voting_end", req.endTime().toString()));
        return saved;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}