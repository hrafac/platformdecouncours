package com.recruiter.application.dto;

public class AppliedJobDTO {
    private Long applicationId;
    private String candidateName;
    private String jobTitle;
    private String status;
    private String applicationDate;
    private Double matchScore;

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getApplicationDate() { return applicationDate; }
    public void setApplicationDate(String applicationDate) { this.applicationDate = applicationDate; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }
}
