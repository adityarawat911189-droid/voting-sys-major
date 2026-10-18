package com.evoting.votingsysmaj.dao;

import com.evoting.votingsysmaj.pojo.MockVoter;

import java.time.LocalDate;
import java.util.Optional;

public interface MockVoterDao {
    Optional<MockVoter> login(String contactNo, String pin);
    Optional<MockVoter> findByDetails(String name, String contactNo, LocalDate dob);
    Optional<MockVoter> findById(Integer id);
    MockVoter save(MockVoter voter);
    Optional<MockVoter> findRegisteredByNameAndPhone(String name, String phone);
}