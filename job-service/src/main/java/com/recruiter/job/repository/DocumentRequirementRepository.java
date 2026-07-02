package com.recruiter.job.repository;

import com.recruiter.job.model.DocumentRequirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRequirementRepository extends JpaRepository<DocumentRequirement, Long> {
    List<DocumentRequirement> findByJobOfferId(Long jobOfferId);
}
