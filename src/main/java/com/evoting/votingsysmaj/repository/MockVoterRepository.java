package com.evoting.votingsysmaj.repository;

import com.evoting.votingsysmaj.pojo.MockVoter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MockVoterRepository extends JpaRepository<MockVoter, Integer> {
    Optional<MockVoter> findByContactNo(String contactNo);
}