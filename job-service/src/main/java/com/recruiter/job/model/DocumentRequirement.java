package com.recruiter.job.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean papierRequis; // true si un papier est requis, false sinon

    @Column(columnDefinition = "TEXT")
    private String descriptionPapier; // description du papier demandé

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_offer_id", nullable = false)
    @JsonBackReference
    private JobOffer jobOffer;
}
