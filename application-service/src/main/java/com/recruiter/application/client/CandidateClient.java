package com.recruiter.application.client;

import com.recruiter.application.config.FeignConfig;
import com.recruiter.application.dto.CandidateDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service", configuration = FeignConfig.class)
public interface CandidateClient {
    @GetMapping("/api/auth/candidates/{id}")
    CandidateDTO getCandidate(@PathVariable("id") String id);
}
