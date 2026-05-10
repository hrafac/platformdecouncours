package com.recruiter.candidate.controller;

import com.recruiter.candidate.model.Candidate;
import com.recruiter.candidate.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    @Autowired
    private CandidateRepository repository;

    @PostMapping
    public Candidate createProfile(@RequestBody Candidate candidate) {
        return repository.save(candidate);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getProfile(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Candidate> getProfileByUserId(@PathVariable String userId) {
        Candidate candidate = repository.findByUserId(userId);
        if (candidate != null) {
            return ResponseEntity.ok(candidate);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public List<Candidate> getAll() {
        return repository.findAll();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Candidate> updateProfile(@PathVariable Long id, @RequestBody Candidate candidateDetails) {
        return repository.findById(id)
                .map(candidate -> {
                    // Mettre à jour les champs mais conserver le même ID et userId
                    candidate.setFullName(candidateDetails.getFullName());
                    candidate.setEmail(candidateDetails.getEmail());
                    candidate.setPhone(candidateDetails.getPhone());
                    candidate.setSkills(candidateDetails.getSkills());
                    candidate.setExperience(candidateDetails.getExperience());
                    // Ne pas modifier userId pour éviter les doublons
                    return ResponseEntity.ok(repository.save(candidate));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Méthode pour mettre à jour par userId (plus sûre)
    @PutMapping("/user/{userId}")
    public ResponseEntity<Candidate> updateProfileByUserId(@PathVariable String userId, @RequestBody Candidate candidateDetails) {
        Candidate candidate = repository.findByUserId(userId);
        if (candidate != null) {
            candidate.setFullName(candidateDetails.getFullName());
            candidate.setEmail(candidateDetails.getEmail());
            candidate.setPhone(candidateDetails.getPhone());
            candidate.setSkills(candidateDetails.getSkills());
            candidate.setExperience(candidateDetails.getExperience());
            return ResponseEntity.ok(repository.save(candidate));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
