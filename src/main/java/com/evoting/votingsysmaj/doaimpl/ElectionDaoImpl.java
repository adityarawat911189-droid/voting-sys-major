package com.evoting.votingsysmaj.doaimpl;

import com.evoting.votingsysmaj.dao.ElectionDao;
import com.evoting.votingsysmaj.pojo.Election;
import com.evoting.votingsysmaj.repository.ElectionRepository;
import org.springframework.stereotype.Repository;

@Repository
public class ElectionDaoImpl implements ElectionDao {

    private final ElectionRepository repository;

    public ElectionDaoImpl(ElectionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Election save(Election election) {
        return repository.save(election);
    }
}