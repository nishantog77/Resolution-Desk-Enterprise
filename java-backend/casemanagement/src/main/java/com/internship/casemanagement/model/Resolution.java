package com.internship.casemanagement.model;

import lombok.Data;

@Data
public class Resolution {
    private String rootCause;
    private String actionTaken;
    private double effectivenessScore;
}