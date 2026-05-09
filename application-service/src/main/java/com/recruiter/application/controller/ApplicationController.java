package com.recruiter.application.controller;

import com.recruiter.application.client.*;
import com.recruiter.application.dto.*;
import com.recruiter.application.model.*;
import com.recruiter.application.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired private ApplicationRepository repository;
    @Autowired private AtsClient atsClient;
    @Autowired private CandidateClient candidateClient;
    @Autowired private JobClient jobClient;

    @PostMapping("/apply")
    public JobApplication apply(
            @RequestParam Long candidateId, 
            @RequestParam Long jobId,
            @RequestParam(required = false) MultipartFile cvFile,
            @RequestBody(required = false) ApplicationRequestDTO applicationRequest) {
        try {
            // 1. Fetch Candidate skills from auth-service
            CandidateDTO candidate = candidateClient.getCandidate(candidateId.toString());
            
            // 2. Fetch Job requirements
            JobDTO job = jobClient.getJob(jobId);

            // 3. Call ATS to get score
            Map<String, String> scoreRequest = new HashMap<>();
            scoreRequest.put("candidateSkills", candidate.getSkills());
            scoreRequest.put("jobSkills", job.getRequirements());
            
            double score = atsClient.getScore(scoreRequest);

            // 4. Save application with all information
            JobApplication application = new JobApplication();
            application.setCandidateId(candidateId);
            application.setJobId(jobId);
            application.setMatchScore(score);
            application.setStatus("PENDING");
            application.setApplicationDate(LocalDateTime.now());
            
            // 5. Handle CV file upload
            if (cvFile != null && !cvFile.isEmpty()) {
                try {
                    // Convert PDF to Base64 string for storage
                    byte[] cvBytes = cvFile.getBytes();
                    String cvBase64 = Base64.getEncoder().encodeToString(cvBytes);
                    application.setCvContent(cvBase64);
                    application.setCvFileName(cvFile.getOriginalFilename());
                } catch (Exception e) {
                    throw new RuntimeException("Error processing CV file: " + e.getMessage());
                }
            } else if (applicationRequest != null) {
                // Fallback to text CV content if no file uploaded
                application.setCvContent(applicationRequest.getCvContent());
                application.setCvFileName(applicationRequest.getCvFileName());
            }
            
            // 6. Set additional application information if provided
            if (applicationRequest != null) {
                application.setCoverLetter(applicationRequest.getCoverLetter());
                application.setPortfolioUrl(applicationRequest.getPortfolioUrl());
                application.setLinkedinProfile(applicationRequest.getLinkedinProfile());
                application.setAdditionalInfo(applicationRequest.getAdditionalInfo());
                application.setExpectedSalary(applicationRequest.getExpectedSalary());
                application.setAvailabilityDate(applicationRequest.getAvailabilityDate());
            }

            return repository.save(application);
        } catch (Exception e) {
            // Log the error and return a more informative response
            throw new RuntimeException("Error processing application: " + e.getMessage(), e);
        }
    }

    @GetMapping("/job/{jobId}")
    public List<JobApplication> getByJob(@PathVariable Long jobId) {
        return repository.findByJobId(jobId);
    }

    @GetMapping("/candidate/{candidateId}/jobs")
    @Transactional(readOnly = true)
    public List<JobApplication> getAppliedJobsByCandidate(@PathVariable Long candidateId) {
        return repository.findByCandidateId(candidateId);
    }

    @GetMapping("/candidate/{candidateId}/jobs/details")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAppliedJobsDetailsByCandidate(@PathVariable Long candidateId) {
        List<JobApplication> applications;
        if (candidateId == 0) {
            // candidateId = 0 means get all applications
            applications = repository.findAll();
        } else {
            applications = repository.findByCandidateId(candidateId);
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (JobApplication app : applications) {
            try {
                JobDTO job = jobClient.getJob(app.getJobId());
                CandidateDTO candidate = null;
                
                // Try to get candidate info, but don't fail if auth-service is not available
                try {
                    candidate = candidateClient.getCandidate(app.getCandidateId().toString());
                } catch (Exception candidateEx) {
                    // Create a minimal candidate object with just the ID
                    candidate = new CandidateDTO();
                    candidate.setId(app.getCandidateId());
                    candidate.setFullName("Candidat #" + app.getCandidateId());
                    candidate.setEmail("Non disponible");
                }
                
                Map<String, Object> jobApplication = new HashMap<>();
                jobApplication.put("applicationId", app.getId());
                jobApplication.put("status", app.getStatus());
                jobApplication.put("applicationDate", app.getApplicationDate());
                jobApplication.put("matchScore", app.getMatchScore());
                jobApplication.put("candidateId", app.getCandidateId());
                jobApplication.put("job", job);
                jobApplication.put("candidate", candidate);
                // Garder le contenu du CV tel quel (base64 ou texte)
                String cvContent = app.getCvContent();
                jobApplication.put("cvContent", cvContent);
                jobApplication.put("coverLetter", app.getCoverLetter());
                jobApplication.put("portfolioUrl", app.getPortfolioUrl());
                jobApplication.put("linkedinProfile", app.getLinkedinProfile());
                jobApplication.put("additionalInfo", app.getAdditionalInfo());
                jobApplication.put("expectedSalary", app.getExpectedSalary());
                jobApplication.put("availabilityDate", app.getAvailabilityDate());
                result.add(jobApplication);
            } catch (Exception e) {
                continue;
            }
        }
        
        return result;
    }
    
    @GetMapping("/download-cv/{applicationId}")
    public ResponseEntity<?> downloadCV(@PathVariable Long applicationId) {
        try {
            JobApplication application = repository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
            
            String cvContent = application.getCvContent();
            String cvFileName = application.getCvFileName();
            
            if (cvContent == null || cvContent.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Vérifier si le contenu est en base64
            byte[] cvBytes;
            String contentType = "application/octet-stream";
            
            try {
                cvBytes = Base64.getDecoder().decode(cvContent);
                System.out.println("Décodage base64 réussi, taille: " + cvBytes.length + " bytes");
                
                // Détecter le type de contenu à partir des premiers octets
                if (cvBytes.length > 4) {
                    String header = new String(cvBytes, 0, Math.min(10, cvBytes.length));
                    System.out.println("Header du fichier: " + header);
                    
                    // Vérification plus robuste pour PDF
                    if (cvBytes.length >= 4 && 
                        cvBytes[0] == 0x25 && cvBytes[1] == 0x50 && 
                        cvBytes[2] == 0x44 && cvBytes[3] == 0x46) {
                        contentType = "application/pdf";
                        System.out.println("Type détecté: PDF");
                    } else if (cvBytes.length >= 2 && 
                              cvBytes[0] == 0x50 && cvBytes[1] == 0x4B) {
                        contentType = "application/zip";
                        System.out.println("Type détecté: ZIP");
                    } else if (cvBytes.length >= 2 && 
                              (cvBytes[0] == (byte)0xFE && cvBytes[1] == (byte)0xFF) ||
                              (cvBytes[0] == (byte)0xFF && cvBytes[1] == (byte)0xFE)) {
                        contentType = "text/plain; charset=utf-16";
                        System.out.println("Type détecté: UTF-16 text");
                    } else if (cvBytes.length > 0 && Character.isLetter(cvBytes[0])) {
                        contentType = "text/plain; charset=utf-8";
                        System.out.println("Type détecté: UTF-8 text");
                    } else {
                        contentType = "application/octet-stream";
                        System.out.println("Type détecté: octet-stream (premiers octets: " + 
                            String.format("%02X %02X %02X %02X", cvBytes[0], cvBytes[1], cvBytes[2], cvBytes[3]) + ")");
                    }
                }
            } catch (Exception e) {
                // Si ce n'est pas du base64, traiter comme du texte
                System.out.println("Échec du décodage base64, traitement comme texte: " + e.getMessage());
                cvBytes = cvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                contentType = "text/plain; charset=utf-8";
                System.out.println("Taille du texte: " + cvBytes.length + " bytes");
            }
            
            String fileName = (cvFileName != null && !cvFileName.isEmpty()) ? cvFileName : "CV.txt";
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(cvBytes.length))
                .header("Cache-Control", "no-cache")
                .header("Access-Control-Allow-Origin", "*")
                .body(cvBytes);
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error downloading CV: " + e.getMessage());
        }
    }
}
