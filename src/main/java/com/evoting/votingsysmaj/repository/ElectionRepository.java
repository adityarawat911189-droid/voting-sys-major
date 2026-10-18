package com.evoting.votingsysmaj.repository;

import com.evoting.votingsysmaj.pojo.Election;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectionRepository extends JpaRepository<Election, Integer> {
}