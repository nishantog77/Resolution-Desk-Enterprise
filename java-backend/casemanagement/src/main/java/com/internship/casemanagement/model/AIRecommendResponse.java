package com.internship.casemanagement.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AIRecommendResponse {
    private String action;
    private double ml_confidence_metric;
    private String ticket_id;
    private String environment;
    private String severity;
    private String system_layer;
    private String error_code;
    private String failure_log;
    private String matched_historical_ticket;
    private String verified_resolution;
    private String suggested_resolution;
    private String warning;
    private String message;
}