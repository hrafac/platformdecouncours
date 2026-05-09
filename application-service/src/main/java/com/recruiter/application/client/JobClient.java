package com.recruiter.application.client;

import com.recruiter.application.config.FeignConfig;
import com.recruiter.application.dto.JobDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "job-service", configuration = FeignConfig.class)
public interface JobClient {
    @GetMapping("/api/jobs/{id}")
    JobDTO getJob(@PathVariable("id") Long id);
}
