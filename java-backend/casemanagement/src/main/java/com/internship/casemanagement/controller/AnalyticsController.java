package com.internship.casemanagement.controller;

import com.internship.casemanagement.model.Case;
import com.internship.casemanagement.CaseRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AnalyticsController {

    private final CaseRepository caseRepository;

    public AnalyticsController(CaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    // 1. Root analytics endpoint
    @GetMapping
    public Map<String, Object> getAnalytics() {
        List<Case> allCases = caseRepository.findAll();

        long totalCases = allCases.size();
        long openCases = allCases.stream().filter(c -> "Open".equalsIgnoreCase(c.getStatus())).count();
        long resolvedCases = allCases.stream().filter(c -> "Resolved".equalsIgnoreCase(c.getStatus())).count();
        long criticalIssues = allCases.stream().filter(c -> c.getSeverity() != null && c.getSeverity().contains("P1")).count();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalVolume", totalCases);
        metrics.put("openCases", openCases);
        metrics.put("resolvedCases", resolvedCases);
        metrics.put("criticalIssues", criticalIssues);

        return metrics;
    }

    // 2. Trending endpoint
    @GetMapping("/trending")
    public List<Map<String, Object>> getTrendingAnalytics() {
        List<Case> allCases = caseRepository.findAll();

        Map<String, Long> categoryCounts = allCases.stream()
                .filter(c -> c.getCategory() != null)
                .collect(Collectors.groupingBy(Case::getCategory, Collectors.counting()));

        return categoryCounts.entrySet().stream().map(entry -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", entry.getKey());
            item.put("value", entry.getValue());
            return item;
        }).collect(Collectors.toList());
    }

    // 3. Devices endpoint 
    @GetMapping("/devices")
    public List<Map<String, Object>> getDeviceAnalytics() {
        List<Case> allCases = caseRepository.findAll();

        Map<String, Long> deviceCounts = allCases.stream()
                // 
                .filter(c -> c.getDevice() != null && !c.getDevice().trim().isEmpty())
                .collect(Collectors.groupingBy(Case::getDevice, Collectors.counting()));

        return deviceCounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue())) // Sort highest to lowest
                .limit(5) // Limit to exactly Top 5
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                }).collect(Collectors.toList());
    }
}