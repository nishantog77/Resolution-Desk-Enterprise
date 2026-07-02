package com.internship.casemanagement.model;

import com.fasterxml.jackson.annotation.JsonProperty; // <-- Added this import!
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Entity
@Table(name = "tickets") // Maps exactly to your Supabase table
public class Case {

    @Id
    @Column(name = "case_id") // Maps to your Primary Key
    private String id;

    private String category;

    // THE FIX: Your DB stores this as a varchar, so we treat it as a String!
    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "customer_tier")
    private String customerTier;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String device;

    private String notes;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    private String severity;

    private String status;

    @Column(name = "sub_category")
    private String subCategory;

    private String title;

    // 1. MUST be empty for Hibernate to fetch existing rows safely
    public Case() {
    }

    // 2. Runs ONLY once, right before a brand new ticket is inserted
    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = "CAS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.status == null) {
            this.status = "Open";
        }
        if (this.createdAt == null) {
            // Formats the current time as a String to safely insert into your varchar column
            this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
    }

    // --- GETTERS AND SETTERS FOR ALL 12 COLUMNS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    // BRAND NEW FIX: Forces Java to output "case_id" in the JSON response so your React table sees it
    @JsonProperty("case_id")
    public String getCaseIdForReact() {
        return this.id;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getCustomerTier() { return customerTier; }
    public void setCustomerTier(String customerTier) { this.customerTier = customerTier; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}