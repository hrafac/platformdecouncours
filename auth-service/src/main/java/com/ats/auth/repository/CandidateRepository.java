package com.ats.auth.repository;

import com.ats.auth.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByUserId(String userId);
    Optional<Candidate> findFirstByUserId(String userId);
    List<Candidate> findAllByUserId(String userId);
}
