package com.recruiter.application.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

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

    // Champs pour le document de concours
    private String contestDocumentFileName; // Nom du fichier du document de concours
    @Column(columnDefinition = "TEXT")
    private String contestDocumentContent;  // Contenu du document de concours (optionnel)
}
