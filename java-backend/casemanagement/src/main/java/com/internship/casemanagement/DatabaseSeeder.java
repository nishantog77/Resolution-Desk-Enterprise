package com.internship.casemanagement;

import com.internship.casemanagement.model.Case; // <-- THIS IS THE FIX
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    // ... leave the rest of the code exactly as it is ...

    @Autowired
    private CaseRepository caseRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only seed if the Supabase table is completely empty
        if (caseRepository.count() == 0) {
            System.out.println("🗄️ Supabase is empty. Seeding historical JSON data to the cloud...");

            ObjectMapper mapper = new ObjectMapper();
            TypeReference<List<Case>> typeReference = new TypeReference<List<Case>>(){};

            // Reads from your local datasets folder
            InputStream inputStream = new ClassPathResource("historical_cases.json").getInputStream();
            List<Case> cases = mapper.readValue(inputStream, typeReference);

            caseRepository.saveAll(cases); // Mass insert into PostgreSQL
            System.out.println("✅ Data seeding complete! All records safely saved in Supabase.");
        } else {
            System.out.println("📋 Database already contains records. Skipping auto-seeding.");
        }
    }
}