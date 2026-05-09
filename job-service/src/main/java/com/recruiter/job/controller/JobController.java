package com.recruiter.job.controller;

import com.recruiter.job.model.JobOffer;
import com.recruiter.job.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobRepository repository;

    @PostMapping
    public JobOffer createJob(@RequestBody JobOffer job) {
        return repository.save(job);
    }

    @GetMapping
    public List<JobOffer> getAllJobs() {
        return repository.findAll();
    }

    @GetMapping("/latest")
    public List<JobOffer> getLast5Jobs() {
        return repository.findTop5ByOrderByIdDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobOffer> getJob(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobOffer> updateJob(@PathVariable Long id, @RequestBody JobOffer jobDetails) {
        return repository.findById(id)
                .map(job -> {
                    job.setTitle(jobDetails.getTitle());
                    job.setDescription(jobDetails.getDescription());
                    job.setRequirements(jobDetails.getRequirements());
                    job.setSalary(jobDetails.getSalary());
                    job.setLocation(jobDetails.getLocation());
                    job.setType(jobDetails.getType());
                    job.setCompetitionDate(jobDetails.getCompetitionDate());
                    job.setCompetitionTime(jobDetails.getCompetitionTime());
                    job.setCompetitionStatus(jobDetails.getCompetitionStatus());
                    return ResponseEntity.ok(repository.save(job));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<JobOffer> getJobDetails(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
