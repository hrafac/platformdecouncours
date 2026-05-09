package com.recruiter.application.client;

import com.recruiter.application.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "ats-service", configuration = FeignConfig.class)
public interface AtsClient {
    @PostMapping("/api/ats/score")
    double getScore(@RequestBody Map<String, String> data);
}
