package com.internship.casemanagement.service;

import com.internship.casemanagement.model.AIRecommendRequest;
import com.internship.casemanagement.model.AIRecommendResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AIGatewayService {

    // Your local Python server URL
    private final String PYTHON_AI_URL = "http://localhost:8000/solve";

    public AIRecommendResponse getRecommendations(AIRecommendRequest request) {
        RestTemplate restTemplate = new RestTemplate();
        try {
            // Forward the payload to the Python engine
            return restTemplate.postForObject(PYTHON_AI_URL, request, AIRecommendResponse.class);
        } catch (Exception e) {
            
            AIRecommendResponse fallback = new AIRecommendResponse();
            fallback.setAction("FLAG_FOR_REVIEW");
            fallback.setMessage("AI Microservice connection timeout. Falling back to default triage pipeline.");
            fallback.setSuggested_resolution("Please reference standard operating manual parameters manually.");
            return fallback;
        }
    }
}