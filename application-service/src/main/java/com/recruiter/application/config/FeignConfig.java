package com.recruiter.application.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            // Pas d'en-tête Authorization pour les communications inter-services
            // Les endpoints sont configurés comme publics dans l'auth-service
        };
    }
}
