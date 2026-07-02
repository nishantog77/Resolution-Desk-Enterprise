<div align="center">

# Resolution Desk
### Enterprise AI Case Management & Autonomous Triage System

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3_8B-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)

*An autonomous, self-learning IT support platform featuring Hybrid RAG, real-time vector synchronization, and a decoupled microservice architecture.*

**Watch the System Demo:** *(Insert a link to your demo video or GIF here)*

---
</div>

## Table of Contents
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Project Structure](#project-structure)
- [Deployment Modes](#deployment-modes)
- [API Reference](#api-reference)
- [Local Installation & Boot Sequence](#local-installation--boot-sequence)
- [Troubleshooting](#troubleshooting)

---

## Core Features

- **Zero-Hallucination AI Triage:** Automatically solves incoming tickets based exclusively on historically verified company data.
- **Autonomous Database Synchronization:** The AI dynamically learns new resolutions logged by human engineers in real-time without requiring server restarts.
- **Enterprise Dashboard:** Real-time analytics tracking system layer outages, hardware faults, and team resolution metrics.
- **Context-Aware Cloud Co-Pilot:** A chat assistant for Level 3 engineers, strictly bound to verified infrastructure runbooks.

---

## System Architecture

Resolution Desk operates on a fully decoupled 3-tier microservice architecture.

The most critical component is the **Autonomous Background Worker**. To prevent vector database corruption in distributed environments, the local ChromaDB instance is intentionally excluded from version control. Instead, a lightweight Python daemon wakes up every 15 seconds, queries the Java backend for newly resolved tickets in the Supabase cloud, and dynamically hot-reloads the local neural embeddings.

```mermaid
graph TD
    subgraph Frontend
        React[React UI Client]
    end

    subgraph Core Backend
        Java[Spring Boot API :8080]
        DB[(Supabase PostgreSQL)]
    end

    subgraph AI Microservice
        Python[FastAPI RAG Engine :8000]
        Worker((Background Sync Thread))
        Chroma[(Local ChromaDB)]
        BM25[Native BM25 Index]
    end
    
    subgraph Cloud Inference
        Groq[Groq Llama-3-8b API]
    end

    React -->|REST /api/cases| Java
    Java <-->|JPA / Hibernate| DB
    React -->|POST /solve| Python
    
    Worker -->|Fetch RESOLVED tickets every 15s| Java
    Worker -->|Upsert Vectors| Chroma
    Worker -->|Hot-Reload| BM25
    
    Python <-->|Semantic Search| Chroma
    Python <-->|Prompt Injection| Groq
