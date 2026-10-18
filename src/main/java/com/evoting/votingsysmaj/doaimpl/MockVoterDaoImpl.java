package com.evoting.votingsysmaj.doaimpl;
import java.time.LocalDate;
import com.evoting.votingsysmaj.dao.MockVoterDao;
import com.evoting.votingsysmaj.pojo.MockVoter;
import com.evoting.votingsysmaj.repository.MockVoterRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class MockVoterDaoImpl implements MockVoterDao {

    private final MockVoterRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<MockVoter> findById(Integer id) {
        return repository.findById(id);
    }

    @Override
    public MockVoter save(MockVoter voter) {
        return repository.save(voter);
    }
    @Override
    public Optional<MockVoter> findRegisteredByNameAndPhone(String name, String phone) {
        if (name == null || name.isBlank() || phone == null || phone.isBlank()) {
            return Optional.empty();
        }
        return repository.findByContactNo(phone)
                .filter(v -> Boolean.TRUE.equals(v.getRegistered()))
                .filter(v -> normalize(name).equals(normalize(v.getName())));
    }

    @Override
    public Optional<MockVoter> findByDetails(String name, String contactNo, LocalDate dob) {
        if (name == null || name.isBlank() || contactNo == null || contactNo.isBlank() || dob == null) {
            return Optional.empty();
        }
        return repository.findByContactNo(contactNo)
                .filter(v -> dob.equals(v.getDob()))
                .filter(v -> normalize(name).equals(normalize(v.getName())));
    }

    // capital/small aur extra spaces ka farak nahi padega
    private String normalize(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase();
    }
    public MockVoterDaoImpl(MockVoterRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Optional<MockVoter> login(String contactNo, String pin) {
        if (contactNo == null || contactNo.isBlank() || pin == null || pin.isBlank()) {
            return Optional.empty();
        }
        return repository.findByContactNo(contactNo)
                .filter(v -> Boolean.TRUE.equals(v.getRegistered()))
                .filter(v -> v.getPin() != null && passwordEncoder.matches(pin, v.getPin()));
    }
}