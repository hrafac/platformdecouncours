package com.recruiter.job.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobOffer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String company;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String requirements; // e.g., "Java, SQL, Docker"
    
    private Double salary;
    private String location;
    private String type; // FULL_TIME, PART_TIME, CONTRACT
    
    // Competition fields
    private LocalDate competitionDate;
    private LocalTime competitionTime;
   
    private String competitionStatus; // "NOT_STARTED", "IN_PROGRESS", "COMPLETED"
}
