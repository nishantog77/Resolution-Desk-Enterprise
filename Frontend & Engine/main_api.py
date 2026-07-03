from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
import os
import math
from collections import Counter
import requests
import threading
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print(" Booting Enterprise Service Operations Microservice with RAG Engine")

# NATIVE BM25 ENGINE 
class NativeBM25Engine:
    def __init__(self, documents, ids, metadatas):
        self.ids = ids
        self.doc_tokens = [self._tokenize(doc) if doc else [] for doc in documents]
        self.doc_lens = [len(tokens) for tokens in self.doc_tokens]
        self.avg_doc_len = sum(self.doc_lens) / len(self.doc_lens) if self.doc_lens else 1
        self.doc_freqs = [Counter(tokens) for tokens in self.doc_tokens]
        
        self.idf = {}
        N = len(ids)
        if N > 0:
            for tokens in self.doc_tokens:
                for token in set(tokens):
                    num_docs_with_token = sum(1 for freq in self.doc_freqs if token in freq)
                    self.idf[token] = math.log((N - num_docs_with_token + 0.5) / (num_docs_with_token + 0.5) + 1.0)

    def _tokenize(self, text):
        if not text: return []
        return text.lower().replace("|", " ").replace("-", " ").replace("_", " ").split()

    def search(self, query, top_n=5):
        query_tokens = self._tokenize(query)
        scores = {}
        k1, b = 1.5, 0.75 
        for idx, freqs in enumerate(self.doc_freqs):
            doc_id = self.ids[idx]
            score = 0.0
            for token in query_tokens:
                if token in freqs:
                    tf = freqs[token]
                    idf_val = self.idf.get(token, 0)
                    denom = tf + k1 * (1.0 - b + b * (self.doc_lens[idx] / self.avg_doc_len))
                    score += idf_val * (tf * (k1 + 1.0)) / denom
            if score > 0: scores[doc_id] = score
        sorted_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [item[0] for item in sorted_ids[:top_n]]

#  VECTOR DB & MODEL INIT
print("Loading Hybrid Retrieval Models (This may take a moment...)")
dense_model = SentenceTransformer('all-MiniLM-L6-v2')
neural_reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

persist_directory = os.path.join(os.getcwd(), "vector_store")
chroma_client = chromadb.PersistentClient(path=persist_directory)
collection = chroma_client.get_or_create_collection(name="telecom_cases")

all_records = collection.get()
sparse_engine = NativeBM25Engine(
    documents=all_records['documents'] if all_records['documents'] else [],
    ids=all_records['ids'],
    metadatas=all_records['metadatas']
)

app = FastAPI(title="Resolution Desk API Engine")

# --- CORS MIDDLEWARE SECURED ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows React frontend to bypass CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THE AUTONOMOUS LEARNING LOOP ---
def auto_sync_knowledge_base():
    global sparse_engine
    while True:
        time.sleep(15) #Every 15 seconds, check for new tickets
        try:
            # Python queries Java backend for resolved tickets
            response = requests.get("http://localhost:8080/api/cases?status=RESOLVED", timeout=5)
            
            if response.status_code == 200:
                resolved_cases = response.json()
                
                if not resolved_cases:
                    continue
                
                has_updates = False
                for case in resolved_cases:
                    raw_id = case.get("id")
                    if raw_id is None:
                        continue
                    
                    # Enforce strict string conversion for ChromaDB compliance
                    ticket_id = str(raw_id)
                    
                    # Flexible mapping to catch multi-variant Java entity field schemas
                    query = case.get("description") or case.get("customerQuery") or case.get("query") or "Unknown Issue"
                    resolution = case.get("resolutionNotes") or case.get("resolution") or ""
                    system_layer = case.get("category") or case.get("systemLayer") or "NETWORK"
                    severity = case.get("severity") or case.get("severityLevel") or "P2"
                    
                    if resolution:
                        doc_text = f"Category: {system_layer} | Issue: {query} | Fix: {resolution}"
                        
                        collection.upsert(
                            documents=[doc_text],
                            metadatas=[{
                                "ticket_id": ticket_id,
                                "customer_query": query,
                                "technical_resolution": resolution,
                                "system_layer": system_layer,
                                "severity_level": severity
                            }],
                            ids=[ticket_id]
                        )
                        has_updates = True
                
                # Dynamic Hot Reload of the BM25 Sparse Search Engine memory space
                if has_updates:
                    print(" New knowledge detected in central pipeline. Hot-reloading BM25 index...")
                    updated_records = collection.get()
                    sparse_engine = NativeBM25Engine(
                        documents=updated_records['documents'] if updated_records['documents'] else [],
                        ids=updated_records['ids'],
                        metadatas=updated_records['metadatas']
                    )
                    print(f"Re-indexed successfully. Active Knowledge Base Size: {len(updated_records['ids'])} tickets.")
                    
        except Exception as e:
            print(f" Autonomous Brain Sync Notification: {e}")

# Start the brain automatically when the Python server boots up
@app.on_event("startup")
def startup_event():
    print(" AI Autonomous Learning Module Activated. Syncing every 15 seconds...")
    thread = threading.Thread(target=auto_sync_knowledge_base, daemon=True)
    thread.start()

# --- 3. PAYLOAD MODELS ---
class QueryRequest(BaseModel):
    description: str
    category: str = ""
    device: str = ""

class ChatPayload(BaseModel):
    ticket_id: str
    ticket_context: str
    category: str
    message: str

# --- 4. ENDPOINTS ---
@app.get("/ping")
def ping():
    return {"status": "ok", "message": "Resolution Desk API is online"}

@app.post("/solve")
def solve_ticket(request: QueryRequest):
    try:
        q_text = f"{request.description} {request.device}"

        sparse_top_ids = sparse_engine.search(q_text, top_n=10)
        query_vector = dense_model.encode(q_text).tolist()
        dense_response = collection.query(query_embeddings=[query_vector], n_results=10)
        dense_top_ids = dense_response['ids'][0] if dense_response['ids'] else []

        rrf_scores = {}
        k = 60
        for rank, doc_id in enumerate(sparse_top_ids): 
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
        for rank, doc_id in enumerate(dense_top_ids): 
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

        sorted_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:5]
        candidate_ids = [item[0] for item in sorted_candidates]

        if not candidate_ids:
            return {"action": "FLAG_FOR_REVIEW", "message": "No historical matches found."}

        candidate_records = collection.get(ids=candidate_ids)
        id_to_meta = {candidate_records['ids'][i]: candidate_records['metadatas'][i] for i in range(len(candidate_records['ids']))}

        pairs = []
        for cid in candidate_ids:
            meta = id_to_meta[cid]
            full_context = f"Category: {meta.get('system_layer','')} | Issue: {meta.get('customer_query','')} | Fix: {meta.get('technical_resolution','')}"
            pairs.append([q_text, full_context])

        neural_scores = neural_reranker.predict(pairs)
        top_3_indices = neural_scores.argsort()[::-1][:3]
        
        best_idx = top_3_indices[0]
        final_score = float(neural_scores[best_idx])
        winning_metadata = id_to_meta[candidate_ids[best_idx]]

        resolutions_list = []
        histories_list = []
        for i, idx in enumerate(top_3_indices):
            meta = id_to_meta[candidate_ids[idx]]
            resolutions_list.append(f"{i+1}. {meta.get('technical_resolution', 'No resolution')}")
            histories_list.append(f"{i+1}. [{meta.get('ticket_id', 'UNKNOWN')}] {meta.get('customer_query', '')}")

        return {
            "action": "AUTO_RESOLVE" if final_score > 1.0 else "FLAG_FOR_REVIEW",
            "ml_confidence_metric": round(final_score, 4),
            "ticket_id": winning_metadata.get('ticket_id', 'UNKNOWN'),
            "environment": winning_metadata.get('environment', 'N/A'),
            "severity": winning_metadata.get('severity_level', 'N/A'),
            "system_layer": winning_metadata.get('system_layer', 'N/A'),
            "error_code": "N/A",
            "failure_log": "N/A",
            "matched_historical_ticket": "\n\n".join(histories_list),
            "verified_resolution": "\n\n".join(resolutions_list),
            "suggested_resolution": "\n\n".join(resolutions_list),
            "warning": "Confidence threshold not met. Manual review recommended." if final_score <= 0.0 else ""
        }

    except Exception as e:
        print(f"Engine Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#  CLOUD AI CO-PILOT 
# Securely pulls the key from your .env file
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY is missing! Make sure your .env file is set up correctly.")

@app.post("/chat")
def chat_with_copilot(payload: ChatPayload):
    try:
        search_query = f"{payload.category} {payload.message}"
        query_vector = dense_model.encode(search_query).tolist()
        
        db_response = collection.query(query_embeddings=[query_vector], n_results=3)
        
        rag_knowledge_base = ""
        if db_response and db_response['metadatas'] and db_response['metadatas'][0]:
            rag_knowledge_base = "\n=== VERIFIED HISTORICAL KNOWLEDGE BASE (FOUND IN VECTOR DB) ===\n"
            for i, meta in enumerate(db_response['metadatas'][0]):
                rag_knowledge_base += f"Record [{i+1}] (Ticket reference: {meta.get('ticket_id', 'N/A')}):\n"
                rag_knowledge_base += f"- Past Issue: {meta.get('customer_query', 'N/A')}\n"
                rag_knowledge_base += f"- Verified Enterprise Resolution: {meta.get('technical_resolution', 'No resolution logged.')}\n\n"
        else:
            rag_knowledge_base = "\n=== VERIFIED HISTORICAL KNOWLEDGE BASE ===\nNo exact matches found in internal company logs.\n"

        system_instruction = f"""You are an elite Enterprise IT Support AI Co-Pilot assisting a Level 3 Operations Engineer.
        
        CURRENT TICKET CONTEXT:
        - TICKET ID: {payload.ticket_id}
        - CATEGORY: {payload.category}
        - CUSTOMER REPORT: {payload.ticket_context}
        {rag_knowledge_base}
        CRITICAL DIRECTIVES (YOU MUST OBEY THESE):
        1. RAG COMPLIANCE: Prioritize matching data and steps from the VERIFIED HISTORICAL KNOWLEDGE BASE provided above. If a solution to a similar problem exists there, synthesize it for the engineer.
        2. NO HALLUCINATIONS: Never invent infrastructure commands. For managed cloud services (like AWS API Gateway, RDS, Lambda), DO NOT suggest "restarting" them. Focus on log analysis (CloudWatch), metric verification, and rollback procedures.
        3. SAFE EC2 PROTOCOL: Never suggest stopping/starting a production database or microservice instance without explicitly verifying the impact and taking a snapshot first.
        4. CUSTOMER EMAILS: If asked to draft a customer email, NEVER include internal technical runbook steps, SSH commands, or internal architecture details. Keep emails strictly focused on status, apologies, and business impact.
        5. TONE: Be ruthless, concise, highly technical, and professional. Zero emojis. 
        
        If the knowledge base does not cover the incident and you are highly uncertain of the underlying infrastructure state, instruct the engineer to: "Analyze CloudWatch logs and escalate to Core Engineering."
        """

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama-3.1-8b-instant", 
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": payload.message}
            ],
            "temperature": 0.1,  
            "max_tokens": 1024
        }

        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data)
        
        if response.status_code != 200:
            raise Exception(f"Cloud AI Provider Error: {response.text}")
            
        response_data = response.json()
        ai_reply = response_data['choices'][0]['message']['content']
        
        return {"reply": ai_reply}

    except Exception as e:
        print(f"Co-Pilot Error: {e}")
        raise HTTPException(status_code=500, detail="Inference engine unreachable or vector lookup failed.")