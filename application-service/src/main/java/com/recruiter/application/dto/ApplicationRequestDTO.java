package com.recruiter.application.dto;

import lombok.Data;

@Data
public class ApplicationRequestDTO {
    private Long candidateId;
    private Long jobId;
    private String cvContent;        // Contenu du CV (texte ou base64)
    private String cvFileName;       // Nom du fichier CV
    private String coverLetter;      // Lettre de motivation
    private String portfolioUrl;     // URL du portfolio (optionnel)
    private String linkedinProfile;  // Profil LinkedIn (optionnel)
    private String additionalInfo;   // Informations supplémentaires
    private String expectedSalary;   // Salaire attendu (optionnel)
    private String availabilityDate; // Date de disponibilité

    // Champs pour le document de concours
    private String contestDocumentFileName; // Nom du fichier du document de concours
    private String contestDocumentContent;  // Contenu du document de concours (texte ou base64)
}
