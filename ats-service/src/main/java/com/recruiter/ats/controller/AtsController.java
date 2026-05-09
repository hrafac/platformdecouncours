package com.recruiter.ats.controller;

import com.recruiter.ats.model.Application;
import com.recruiter.ats.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ats")
public class AtsController {

    @Autowired
    private ApplicationRepository applicationRepository;

    // ========== Score Calculation ==========
    
    @PostMapping("/score")
    public double calculateScore(@RequestBody Map<String, String> data) {
        String candidateSkills = data.getOrDefault("candidateSkills", "").toLowerCase();
        String jobSkills = data.getOrDefault("jobSkills", "").toLowerCase();

        if (jobSkills.isEmpty()) return 0.0;

        List<String> candidateList = Arrays.asList(candidateSkills.split(",\\s*"));
        List<String> jobList = Arrays.asList(jobSkills.split(",\\s*"));

        long matches = jobList.stream()
                .filter(skill -> candidateList.contains(skill))
                .count();

        return (double) matches / jobList.size() * 100;
    }

    // ========== CRUD Applications ==========
    
    @GetMapping("/applications")
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/candidate/{candidateId}")
    public List<Application> getApplicationsByCandidate(@PathVariable Long candidateId) {
        return applicationRepository.findByCandidateId(candidateId);
    }

    @GetMapping("/applications/job/{jobId}")
    public List<Application> getApplicationsByJob(@PathVariable Long jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    @GetMapping("/applications/status/{status}")
    public List<Application> getApplicationsByStatus(@PathVariable String status) {
        return applicationRepository.findByStatus(status);
    }

    @PostMapping("/applications")
    public Application createApplication(@RequestBody Application application) {
        return applicationRepository.save(application);
    }

    @PostMapping("/applications/apply")
    public Application applyToJob(@RequestBody Map<String, Object> data) {
        Application application = new Application();
        application.setCandidateId(Long.valueOf(data.get("candidateId").toString()));
        application.setJobId(Long.valueOf(data.get("jobId").toString()));
        
        // Calculate score if skills are provided
        if (data.containsKey("candidateSkills") && data.containsKey("jobSkills")) {
            double score = calculateScore(Map.of(
                "candidateSkills", data.get("candidateSkills").toString(),
                "jobSkills", data.get("jobSkills").toString()
            ));
            application.setScore(score);
        }
        
        return applicationRepository.save(application);
    }

    @PutMapping("/applications/{id}")
    public ResponseEntity<Application> updateApplication(@PathVariable Long id, @RequestBody Application applicationDetails) {
        return applicationRepository.findById(id)
                .map(application -> {
                    application.setCandidateId(applicationDetails.getCandidateId());
                    application.setJobId(applicationDetails.getJobId());
                    application.setStatus(applicationDetails.getStatus());
                    application.setScore(applicationDetails.getScore());
                    application.setNotes(applicationDetails.getNotes());
                    return ResponseEntity.ok(applicationRepository.save(application));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<Application> updateApplicationStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData) {
        return applicationRepository.findById(id)
                .map(application -> {
                    application.setStatus(statusData.get("status"));
                    if (statusData.containsKey("notes")) {
                        application.setNotes(statusData.get("notes"));
                    }
                    return ResponseEntity.ok(applicationRepository.save(application));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        if (applicationRepository.existsById(id)) {
            applicationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
