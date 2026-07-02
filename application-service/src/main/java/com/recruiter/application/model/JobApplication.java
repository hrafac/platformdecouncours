package com.recruiter.application.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long candidateId;
    private Long jobId;
    private Double matchScore;
    private String status; // PENDING, ACCEPTED, REJECTED
    private LocalDateTime applicationDate;
    
    // Nouveaux champs pour les informations de candidature
    @Column(columnDefinition = "TEXT")
    private String cvContent;        // Contenu du CV
    private String cvFileName;       // Nom du fichier CV
    @Column(columnDefinition = "TEXT")
    private String coverLetter;      // Lettre de motivation
    private String portfolioUrl;     // URL du portfolio
    private String linkedinProfile;  // Profil LinkedIn
    @Column(columnDefinition = "TEXT")
    private String additionalInfo;   // Informations supplémentaires
    private String expectedSalary;   // Salaire attendu
    private String availabilityDate; // Date de disponibilité

    @OneToMany(mappedBy = "jobApplication", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ContestDocument> contestDocuments = new ArrayList<>();

    @Transient
    public String getContestDocumentFileName() {
        if (contestDocuments == null || contestDocuments.isEmpty()) {
            return null;
        }
        return contestDocuments.get(0).getFileName();
    }

    @Transient
    public void setContestDocumentFileName(String contestDocumentFileName) {
        if (contestDocuments == null) {
            contestDocuments = new ArrayList<>();
        }
        if (contestDocuments.isEmpty()) {
            ContestDocument document = new ContestDocument();
            document.setFileName(contestDocumentFileName);
            document.setJobApplication(this);
            contestDocuments.add(document);
        } else {
            contestDocuments.get(0).setFileName(contestDocumentFileName);
        }
    }

    @Transient
    public String getContestDocumentContent() {
        if (contestDocuments == null || contestDocuments.isEmpty()) {
            return null;
        }
        return contestDocuments.get(0).getContent();
    }

    @Transient
    public void setContestDocumentContent(String contestDocumentContent) {
        if (contestDocuments == null) {
            contestDocuments = new ArrayList<>();
        }
        if (contestDocuments.isEmpty()) {
            ContestDocument document = new ContestDocument();
            document.setContent(contestDocumentContent);
            document.setJobApplication(this);
            contestDocuments.add(document);
        } else {
            contestDocuments.get(0).setContent(contestDocumentContent);
        }
    }
}
