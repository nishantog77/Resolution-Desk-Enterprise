package com.internship.casemanagement.controller;

import com.internship.casemanagement.model.Case;
import com.internship.casemanagement.model.AIRecommendRequest;
import com.internship.casemanagement.model.AIRecommendResponse;
import com.internship.casemanagement.CaseRepository;
import com.internship.casemanagement.service.AIGatewayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cases")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class CaseController {

    private final CaseRepository caseRepository;
    private final AIGatewayService aiGatewayService;

    public CaseController(CaseRepository caseRepository, AIGatewayService aiGatewayService) {
        this.caseRepository = caseRepository;
        this.aiGatewayService = aiGatewayService;
    }

    // Day 12 - Filter cases by category or status (Now pulling from Cloud DB!)
    @GetMapping
    public ResponseEntity<?> getAllCases(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {

        try {
            List<Case> allCases = caseRepository.findAll();

            if (category != null && !category.isEmpty()) {
                allCases = allCases.stream()
                        .filter(c -> category.equalsIgnoreCase(c.getCategory()))
                        .toList();
            }

            if (status != null && !status.isEmpty()) {
                allCases = allCases.stream()
                        .filter(c -> status.equalsIgnoreCase(c.getStatus()))
                        .toList();
            }

            return ResponseEntity.ok(allCases);

        } catch (Exception e) {
            System.out.println("======!!! DATABASE FETCH CRASH !!!======");
            e.printStackTrace();
            System.out.println("========================================");
            return ResponseEntity.status(500).body("Database mapping error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Case> getCaseById(@PathVariable String id) {
        Optional<Case> c = caseRepository.findById(id);
        return c.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // FIX 1: Generates the exact 5-digit padded case ID matching your Supabase history (CASE-2024-XXXXX)
    @PostMapping
    public ResponseEntity<Case> createCase(@RequestBody Case newCase) {
        long totalCases = caseRepository.count();

        // Generates the perfectly padded sequential sequence: CASE-2024-00349
        String sequentialId = String.format("CASE-2024-%05d", totalCases + 1);

        newCase.setId(sequentialId);

        if (newCase.getStatus() == null || newCase.getStatus().isEmpty()) {
            newCase.setStatus("OPEN");
        }

        Case savedCase = caseRepository.save(newCase);
        return ResponseEntity.ok(savedCase);
    }

    // FIX 2: Bulletproof Patch Endpoint (Updates status AND resolution notes dynamically)
    @PatchMapping("/{id}")
    public ResponseEntity<Case> updateCase(@PathVariable String id, @RequestBody Case updates) {
        return caseRepository.findById(id)
                .map(existingCase -> {
                    // Update status if provided by frontend
                    if (updates.getStatus() != null && !updates.getStatus().isEmpty()) {
                        existingCase.setStatus(updates.getStatus());
                    }

                    // Update resolution notes if provided
                    if (updates.getResolutionNotes() != null && !updates.getResolutionNotes().isEmpty()) {
                        existingCase.setResolutionNotes(updates.getResolutionNotes());
                        // Fail-safe: If notes are saved, force the state to RESOLVED so it vanishes from Open queue
                        existingCase.setStatus("RESOLVED");
                    }

                    Case savedCase = caseRepository.save(existingCase);
                    return ResponseEntity.ok(savedCase);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // FIX 3: Fail-safe Notes Endpoint (Forces the status to RESOLVED when notes are written)
    @PutMapping("/{id}/notes")
    public ResponseEntity<Case> updateNotes(@PathVariable String id, @RequestBody String updatedNotes) {
        return caseRepository.findById(id)
                .map(existingCase -> {
                    existingCase.setResolutionNotes(updatedNotes);

                    // Force state transition to RESOLVED to guarantee filtering synchronization
                    existingCase.setStatus("RESOLVED");

                    Case savedCase = caseRepository.save(existingCase);
                    return ResponseEntity.ok(savedCase);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/recommend")
    public ResponseEntity<AIRecommendResponse> getAIRecommendations(@RequestBody AIRecommendRequest request) {
        AIRecommendRequest adjustedRequest = new AIRecommendRequest();
        adjustedRequest.setDescription(request.getDescription());
        adjustedRequest.setCategory(request.getCategory());
        adjustedRequest.setDevice(request.getDevice());

        AIRecommendResponse response = aiGatewayService.getRecommendations(adjustedRequest);
        return ResponseEntity.ok(response);
    }
}