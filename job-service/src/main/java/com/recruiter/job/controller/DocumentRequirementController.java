package com.recruiter.job.controller;

import com.recruiter.job.model.DocumentRequirement;
import com.recruiter.job.model.JobOffer;
import com.recruiter.job.repository.DocumentRequirementRepository;
import com.recruiter.job.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DocumentRequirementController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private DocumentRequirementRepository requirementRepository;

    @PostMapping("/jobs/{jobId}/requirements")
    public ResponseEntity<DocumentRequirement> addRequirement(@PathVariable Long jobId,
                                                              @RequestBody DocumentRequirement requirement) {
        return jobRepository.findById(jobId)
                .map(jobOffer -> {
                    requirement.setJobOffer(jobOffer);
                    DocumentRequirement saved = requirementRepository.save(requirement);
                    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/{jobId}/requirements")
    public ResponseEntity<List<DocumentRequirement>> getRequirementsForJob(@PathVariable Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(requirementRepository.findByJobOfferId(jobId));
    }

    @GetMapping("/requirements/{id}")
    public ResponseEntity<DocumentRequirement> getRequirement(@PathVariable Long id) {
        return requirementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/requirements/{id}")
    public ResponseEntity<DocumentRequirement> updateRequirement(@PathVariable Long id,
                                                                  @RequestBody DocumentRequirement requirementDetails) {
        return requirementRepository.findById(id)
                .map(requirement -> {
                    requirement.setPapierRequis(requirementDetails.getPapierRequis());
                    requirement.setDescriptionPapier(requirementDetails.getDescriptionPapier());
                    return ResponseEntity.ok(requirementRepository.save(requirement));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/requirements/{id}")
    public ResponseEntity<Void> deleteRequirement(@PathVariable Long id) {
        if (!requirementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        requirementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
