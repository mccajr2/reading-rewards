package com.example.reading.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class BrevoEmailService {
    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${spring.mail.from:noreply@example.com}")
    private String mailFrom;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    public boolean sendEmail(String to, String subject, String htmlContent) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        String body = String.format(
            "{\"sender\":{\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":\"%s\"}",
            mailFrom, to, subject, htmlContent.replace("\"", "\\\"")
        );

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
