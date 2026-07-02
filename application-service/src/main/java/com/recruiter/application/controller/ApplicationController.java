package com.recruiter.application.controller;

import com.recruiter.application.client.*;
import com.recruiter.application.dto.AppliedJobDTO;
import com.recruiter.application.dto.ApplicationRequestDTO;
import com.recruiter.application.dto.CandidateDTO;
import com.recruiter.application.dto.ContestDocumentDTO;
import com.recruiter.application.dto.JobDTO;
import com.recruiter.application.model.ContestDocument;
import com.recruiter.application.model.JobApplication;
import com.recruiter.application.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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

            List<ContestDocument> contestDocuments = application.getContestDocuments();
            if (contestDocuments == null || contestDocuments.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            if (contestDocuments.size() == 1) {
                return buildDocumentResponse(contestDocuments.get(0));
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zipOut = new ZipOutputStream(baos)) {
                int index = 1;
                java.util.Set<String> usedFileNames = new java.util.HashSet<>();
                for (ContestDocument document : contestDocuments) {
                    String fileName = document.getFileName();
                    if (fileName == null || fileName.isBlank()) {
                        fileName = "contest-document-" + index + ".dat";
                    }
                    fileName = makeUniqueFileName(fileName, usedFileNames, index);
                    byte[] documentBytes = decodeDocumentContent(document.getContent());
                    ZipEntry entry = new ZipEntry(fileName);
                    zipOut.putNextEntry(entry);
                    zipOut.write(documentBytes);
                    zipOut.closeEntry();
                    index++;
                }
            }

            byte[] zipBytes = baos.toByteArray();
            String zipName = "contest-documents-" + applicationId + ".zip";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/zip")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(zipBytes.length))
                .header("Cache-Control", "no-cache")
                .body(zipBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error downloading contest documents: " + e.getMessage());
        }
    }

    private ResponseEntity<byte[]> buildDocumentResponse(ContestDocument document) {
        byte[] docBytes = decodeDocumentContent(document.getContent());
        String contentType = detectContentType(docBytes, "application/octet-stream");
        String fileName = (document.getFileName() != null && !document.getFileName().isEmpty())
                ? document.getFileName() : "DocumentConcours";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(docBytes.length))
                .header("Cache-Control", "no-cache")
                .body(docBytes);
    }

    private byte[] decodeDocumentContent(String content) {
        if (content == null || content.isEmpty()) {
            return new byte[0];
        }
        try {
            return Base64.getDecoder().decode(content);
        } catch (IllegalArgumentException e) {
            return content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    private String detectContentType(byte[] bytes, String fallback) {
        if (bytes == null || bytes.length < 2) {
            return fallback;
        }
        if (bytes.length >= 4 &&
            bytes[0] == 0x25 && bytes[1] == 0x50 &&
            bytes[2] == 0x44 && bytes[3] == 0x46) {
            return "application/pdf";
        }
        if (bytes.length >= 2 && bytes[0] == 0x50 && bytes[1] == 0x4B) {
            return "application/zip";
        }
        if (bytes.length >= 2 &&
            ((bytes[0] == (byte) 0xFE && bytes[1] == (byte) 0xFF) ||
             (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xFE))) {
            return "text/plain; charset=utf-16";
        }
        return "text/plain; charset=utf-8";
    }

    private String makeUniqueFileName(String originalFileName, java.util.Set<String> usedFileNames, int index) {
        String fileName = originalFileName;
        if (!usedFileNames.add(fileName)) {
            String baseName = fileName;
            String extension = "";
            int dotIndex = fileName.lastIndexOf('.');
            if (dotIndex > 0) {
                baseName = fileName.substring(0, dotIndex);
                extension = fileName.substring(dotIndex);
            }
            int suffix = 1;
            while (!usedFileNames.add(baseName + " (" + suffix + ")" + extension)) {
                suffix++;
            }
            fileName = baseName + " (" + suffix + ")" + extension;
        }
        return fileName;
    }

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public JobApplication applyMultipart(
            @RequestParam Long candidateId,
            @RequestParam Long jobId,
            @RequestPart(required = false) MultipartFile cvFile,
            @RequestPart(required = false) MultipartFile contestDocumentFile,
            @ModelAttribute ApplicationRequestDTO applicationRequest) {
        return processApplication(candidateId, jobId, cvFile, contestDocumentFile, applicationRequest);
    }

    @PostMapping(value = "/apply", consumes = {MediaType.APPLICATION_JSON_VALUE, "application/json;charset=UTF-8"})
    public JobApplication applyJson(
            @RequestParam Long candidateId,
            @RequestParam Long jobId,
            @RequestBody ApplicationRequestDTO applicationRequest) {
        return processApplication(candidateId, jobId, null, null, applicationRequest);
    }

    private JobApplication processApplication(Long candidateId,
                                              Long jobId,
                                              MultipartFile cvFile,
                                              MultipartFile contestDocumentFile,
                                              ApplicationRequestDTO applicationRequest) {
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
                    byte[] cvBytes = cvFile.getBytes();
                    String cvBase64 = Base64.getEncoder().encodeToString(cvBytes);
                    application.setCvContent(cvBase64);
                    application.setCvFileName(cvFile.getOriginalFilename());
                } catch (Exception e) {
                    throw new RuntimeException("Error processing CV file: " + e.getMessage());
                }
            } else if (applicationRequest != null) {
                application.setCvContent(applicationRequest.getCvContent());
                application.setCvFileName(applicationRequest.getCvFileName());
            }

            // 5bis. Handle Contest Document file upload(s)
            if (contestDocumentFile != null && !contestDocumentFile.isEmpty()) {
                try {
                    byte[] docBytes = contestDocumentFile.getBytes();
                    String docBase64 = Base64.getEncoder().encodeToString(docBytes);
                    addContestDocument(application, contestDocumentFile.getOriginalFilename(), docBase64);
                } catch (Exception e) {
                    throw new RuntimeException("Error processing contest document file: " + e.getMessage());
                }
            } else if (applicationRequest != null) {
                if (applicationRequest.getContestDocuments() != null && !applicationRequest.getContestDocuments().isEmpty()) {
                    for (ContestDocumentDTO documentDTO : applicationRequest.getContestDocuments()) {
                        addContestDocument(application, documentDTO.getFileName(), documentDTO.getContent());
                    }
                } else if (applicationRequest.getContestDocumentFileName() != null || applicationRequest.getContestDocumentContent() != null) {
                    addContestDocument(application,
                            applicationRequest.getContestDocumentFileName(),
                            applicationRequest.getContestDocumentContent());
                }
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

            JobApplication savedApplication = repository.save(application);
            sendApplicationNotifications(candidate, job, savedApplication);
            return savedApplication;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error processing application: " + e.getMessage(), e);
        }
    }

    private void addContestDocument(JobApplication application, String fileName, String content) {
        if ((fileName == null || fileName.isBlank()) && (content == null || content.isBlank())) {
            return;
        }
        ContestDocument document = new ContestDocument();
        document.setFileName(fileName);
        document.setContent(content);
        document.setJobApplication(application);
        if (application.getContestDocuments() == null) {
            application.setContestDocuments(new java.util.ArrayList<>());
        }
        application.getContestDocuments().add(document);
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
                jobApplication.put("contestDocuments", app.getContestDocuments());
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
