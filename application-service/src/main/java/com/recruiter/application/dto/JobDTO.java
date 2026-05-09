package com.recruiter.application.dto;

import lombok.Data;

@Data
public class JobDTO {
    private Long id;
    private String title;
    private String company;
    private String description;
    private String requirements;
    private Double salary;
    private String location;
    private String type;
}
