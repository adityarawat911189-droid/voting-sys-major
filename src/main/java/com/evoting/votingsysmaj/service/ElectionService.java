package com.evoting.votingsysmaj.service;

import com.evoting.votingsysmaj.dto.CreateElectionRequest;
import com.evoting.votingsysmaj.pojo.Election;

public interface ElectionService {
    Election create(CreateElectionRequest req);
}