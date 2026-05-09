package com.recruiter.application.dto;

import lombok.Data;

@Data
public class CandidateDTO {
    private Long id;
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String skills;
    private String experience;
}
