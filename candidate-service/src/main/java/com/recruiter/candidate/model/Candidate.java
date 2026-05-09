package com.recruiter.candidate.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userId; // Link to Auth Service User
    private String fullName;
    private String email;
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String skills; // Stored as comma separated: "Java, Spring, React"
    
    @Column(columnDefinition = "TEXT")
    private String experience;
}
