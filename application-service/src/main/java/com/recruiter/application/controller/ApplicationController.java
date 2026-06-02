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
import feign.FeignException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.server.ResponseStatusException;

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
    @Autowired private JavaMailSender mailSender;

    @Value("${notifications.admin.email:admin@example.com}")
    private String adminEmail;
    
@GetMapping("/download-contest-document/{applicationId}")
    public ResponseEntity<?> downloadContestDocument(@PathVariable Long applicationId) {
        try {
            JobApplication application = repository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

            String docContent = application.getContestDocumentContent();
            String docFileName = application.getContestDocumentFileName();

            if (docContent == null || docContent.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            byte[] docBytes;
            String contentType = "application/octet-stream";
            try {
                docBytes = Base64.getDecoder().decode(docContent);
                // Détection du type PDF
                if (docBytes.length >= 4 &&
                    docBytes[0] == 0x25 && docBytes[1] == 0x50 &&
                    docBytes[2] == 0x44 && docBytes[3] == 0x46) {
                    contentType = "application/pdf";
                } else {
                    contentType = "application/octet-stream";
                }
            } catch (Exception e) {
                // Si ce n'est pas du base64, traiter comme texte
                docBytes = docContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                contentType = "text/plain; charset=utf-8";
            }

            String fileName = (docFileName != null && !docFileName.isEmpty()) ? docFileName : "DocumentConcours.pdf";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(docBytes.length))
                .header("Cache-Control", "no-cache")
                // .header("Access-Control-Allow-Origin", "*")
                .body(docBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error downloading contest document: " + e.getMessage());
        }
    }
    @PostMapping("/apply")
        public JobApplication apply(
            @RequestParam Long candidateId,
            @RequestParam Long jobId,
            @RequestParam(required = false) MultipartFile cvFile,
            @RequestParam(required = false) MultipartFile contestDocumentFile,
            @RequestBody(required = false) ApplicationRequestDTO applicationRequest) {
        try {
            // 1. Fetch Candidate skills from auth-service
            CandidateDTO candidate;
            try {
                candidate = candidateClient.getCandidate(candidateId.toString());
            } catch (FeignException.Forbidden e) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas le droit d'accéder à ce candidat.");
            } catch (FeignException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erreur lors de la récupération du candidat.");
            }

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

            // 5bis. Handle Contest Document file upload
            if (contestDocumentFile != null && !contestDocumentFile.isEmpty()) {
                try {
                    // Convert PDF to Base64 string for storage
                    byte[] docBytes = contestDocumentFile.getBytes();
                    String docBase64 = Base64.getEncoder().encodeToString(docBytes);
                    application.setContestDocumentContent(docBase64);
                    application.setContestDocumentFileName(contestDocumentFile.getOriginalFilename());
                } catch (Exception e) {
                    throw new RuntimeException("Error processing contest document file: " + e.getMessage());
                }
            } else if (applicationRequest != null) {
                // Fallback to text/base64 content if no file uploaded
                application.setContestDocumentContent(applicationRequest.getContestDocumentContent());
                application.setContestDocumentFileName(applicationRequest.getContestDocumentFileName());
            }

            // 6. Set additional application information if provided
            if (applicationRequest != null) {
                application.setCoverLetter(applicationRequest.getCoverLetter());
                application.setPortfolioUrl(applicationRequest.getPortfolioUrl());
                application.setLinkedinProfile(applicationRequest.getLinkedinProfile());
                application.setAdditionalInfo(applicationRequest.getAdditionalInfo());
                application.setExpectedSalary(applicationRequest.getExpectedSalary());
                application.setAvailabilityDate(applicationRequest.getAvailabilityDate());

                    // Gestion du document de concours
                    application.setContestDocumentFileName(applicationRequest.getContestDocumentFileName());
                    application.setContestDocumentContent(applicationRequest.getContestDocumentContent());
            }

            JobApplication savedApplication = repository.save(application);
            sendApplicationNotifications(candidate, job, savedApplication);
            return savedApplication;
        } catch (ResponseStatusException e) {
            throw e; // Laisser Spring gérer la réponse HTTP
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
    public List<AppliedJobDTO> getAppliedJobsByCandidate(@PathVariable Long candidateId) {
        List<JobApplication> applications = repository.findByCandidateId(candidateId);
        List<AppliedJobDTO> result = new ArrayList<>();
        for (JobApplication app : applications) {
            AppliedJobDTO dto = new AppliedJobDTO();
            dto.setApplicationId(app.getId());
            dto.setStatus(app.getStatus());
            dto.setApplicationDate(app.getApplicationDate() != null ? app.getApplicationDate().toString() : null);
            dto.setMatchScore(app.getMatchScore());

            // Récupérer le nom du candidat
            try {
                CandidateDTO candidate = candidateClient.getCandidate(app.getCandidateId().toString());
                dto.setCandidateName(candidate.getFullName());
            } catch (Exception e) {
                dto.setCandidateName("Non disponible");
            }

            // Récupérer le titre du job
            try {
                JobDTO job = jobClient.getJob(app.getJobId());
                dto.setJobTitle(job.getTitle());
            } catch (Exception e) {
                dto.setJobTitle("Non disponible");
            }

            result.add(dto);
        }
        return result;
    }

    private void sendApplicationNotifications(CandidateDTO candidate, JobDTO job, JobApplication application) {
        try {
            if (candidate != null && candidate.getEmail() != null && !candidate.getEmail().isBlank()) {
                MimeMessage candidateMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(candidateMessage, "UTF-8");
                helper.setTo(candidate.getEmail());
                helper.setSubject("Votre candidature au concours \"" + job.getTitle() + "\" a bien été reçue");

                String candidateHtml = "<html><body style=\"font-family:Arial,sans-serif;color:#333;line-height:1.5;\">" +
                        "<h2 style=\"color:#1f4e79;\">Confirmation de candidature</h2>" +
                        "<p>Bonjour <strong>" + (candidate.getFullName() != null ? candidate.getFullName() : "Candidat") + "</strong>,</p>" +
                        "<p>Merci d'avoir postulé au concours <strong>\"" + job.getTitle() + "\"</strong>.</p>" +
                        "<div style=\"background:#f5f8fb;border:1px solid #dce6f1;padding:14px;border-radius:8px;max-width:520px;\">" +
                        "<p style=\"margin:0 0 8px 0;\"><strong>Détails de la candidature</strong></p>" +
                        "<ul style=\"margin:0;padding-left:18px;\">" +
                        "<li>ID de candidature : " + application.getId() + "</li>" +
                        "<li>Statut : " + application.getStatus() + "</li>" +
                        "</ul>" +
                        "</div>" +
                        "<p>Nous étudions votre dossier et nous reviendrons vers vous rapidement.</p>" +
                        "<p>Cordialement,<br><strong>L'équipe recrutement</strong></p>" +
                        "</body></html>";

                helper.setText(candidateHtml, true);
                mailSender.send(candidateMessage);
            }

            if (adminEmail != null && !adminEmail.isBlank()) {
                MimeMessage adminMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(adminMessage, "UTF-8");
                helper.setTo(adminEmail);
                helper.setSubject("Nouvelle candidature reçue pour \"" + job.getTitle() + "\"");

                String adminHtml = "<html><body style=\"font-family:Arial,sans-serif;color:#333;line-height:1.5;\">" +
                        "<h2 style=\"color:#1f4e79;\">Nouvelle candidature</h2>" +
                        "<p>Une nouvelle candidature a été soumise.</p>" +
                        "<table style=\"width:100%;max-width:560px;border-collapse:collapse;\">" +
                        "<tr><td style=\"padding:8px;border:1px solid #dce6f1;background:#eef4fb;\"><strong>Nom</strong></td><td style=\"padding:8px;border:1px solid #dce6f1;\">" + (candidate != null && candidate.getFullName() != null ? candidate.getFullName() : "inconnu") + "</td></tr>" +
                        "<tr><td style=\"padding:8px;border:1px solid #dce6f1;background:#eef4fb;\"><strong>Email</strong></td><td style=\"padding:8px;border:1px solid #dce6f1;\">" + (candidate != null && candidate.getEmail() != null ? candidate.getEmail() : "email inconnu") + "</td></tr>" +
                        "<tr><td style=\"padding:8px;border:1px solid #dce6f1;background:#eef4fb;\"><strong>Titre du concours</strong></td><td style=\"padding:8px;border:1px solid #dce6f1;\">" + job.getTitle() + "</td></tr>" +
                        "<tr><td style=\"padding:8px;border:1px solid #dce6f1;background:#eef4fb;\"><strong>ID candidature</strong></td><td style=\"padding:8px;border:1px solid #dce6f1;\">" + application.getId() + "</td></tr>" +
                        "</table>" +
                        "<p>Merci de consulter le tableau de bord admin pour plus d'informations.</p>" +
                        "<p>Cordialement,<br><strong>Le système de candidature</strong></p>" +
                        "</body></html>";

                helper.setText(adminHtml, true);
                mailSender.send(adminMessage);
            }
        } catch (MessagingException e) {
            System.err.println("Erreur lors de la construction de l'email : " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi des notifications email : " + e.getMessage());
        }
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
                jobApplication.put("cvFileName", app.getCvFileName());
                jobApplication.put("contestDocumentContent", app.getContestDocumentContent());
                jobApplication.put("contestDocumentFileName", app.getContestDocumentFileName());
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
                // .header("Access-Control-Allow-Origin", "*")
                .body(cvBytes);
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error downloading CV: " + e.getMessage());
        }
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<JobApplication> updateStatus(
            @PathVariable Long applicationId,
            @RequestParam String status) {
        JobApplication application = repository.findById(applicationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        application.setStatus(status);
        repository.save(application);
sendStatusChangeEmail(application, status);
            return ResponseEntity.ok(application);
    }

    private void sendStatusChangeEmail(JobApplication application, String status) {
        try {
            CandidateDTO candidate = candidateClient.getCandidate(application.getCandidateId().toString());
            JobDTO job = jobClient.getJob(application.getJobId());

            if (candidate != null && candidate.getEmail() != null && !candidate.getEmail().isBlank()) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
                helper.setTo(candidate.getEmail());
                helper.setSubject("Mise à jour de votre candidature pour \"" + job.getTitle() + "\"");

                StringBuilder body = new StringBuilder();
                body.append("<html><body style=\"font-family:Arial,sans-serif;color:#333;line-height:1.6;\">")
                    .append("<h2 style=\"color:#1f4e79;\">Mise à jour de votre candidature</h2>")
                    .append("<p>Bonjour <strong>")
                    .append(candidate.getFullName() != null ? candidate.getFullName() : "Candidat")
                    .append("</strong>,</p>");

                if ("ACCEPTED".equalsIgnoreCase(status)) {
                    body.append("<p style=\"color:#0f7d5f;\"><strong>Félicitations !</strong></p>");
                    body.append("<p>Votre candidature pour le concours <strong>\"").append(job.getTitle()).append("\"</strong> a été acceptée.</p>");
                    body.append("<p>Prochaine étape : un membre de l'équipe recrutement vous contactera bientôt pour finaliser votre dossier.</p>");
                } else if ("REJECTED".equalsIgnoreCase(status)) {
                    body.append("<p style=\"color:#c0392b;\"><strong>Nous sommes désolés.</strong></p>");
                    body.append("<p>Votre candidature pour le concours <strong>\"").append(job.getTitle()).append("\"</strong> n'a pas été retenue.</p>");
                    body.append("<p>Merci pour votre intérêt. Nous vous souhaitons bonne continuation.</p>");
                } else {
                    body.append("<p>Le statut de votre candidature pour le concours <strong>\"")
                        .append(job.getTitle())
                        .append("\"</strong> a été mis à jour.</p>");
                }

                body.append("<div style=\"background:#f5f8fb;border:1px solid #dce6f1;padding:14px;border-radius:8px;max-width:520px;\">")
                    .append("<p style=\"margin:0 0 8px 0;font-weight:bold;\">Détails de la candidature</p>")
                    .append("<p style=\"margin:0;\">ID de candidature : " + application.getId() + "</p>")
                    .append("<p style=\"margin:0;\">Statut : " + status + "</p>")
                    .append("</div>");

                body.append("<p>Cordialement,<br><strong>L'équipe recrutement</strong></p>")
                    .append("</body></html>");

                helper.setText(body.toString(), true);
                mailSender.send(message);
            }
        } catch (MessagingException e) {
            System.err.println("Erreur lors de la construction de l'email de statut : " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email de mise à jour du statut : " + e.getMessage());
        }
    }
}
