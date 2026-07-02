import json
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import os
import shutil

print("🚀 Initializing Telecom AI Vector Engine...")

persist_directory = os.path.join(os.getcwd(), "vector_store")
if os.path.exists(persist_directory):
    print("🧹 Wiping legacy database...")
    shutil.rmtree(persist_directory)

chroma_client = chromadb.PersistentClient(path=persist_directory)
collection = chroma_client.create_collection(name="telecom_cases")

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def build_database():
    json_path = "datasets/historical_cases.json"
    
    with open(json_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"📖 Loaded {len(cases)} telecom cases. Vectorizing into high-dimensional space...")

    ids = []
    documents = []
    metadatas = []

    for case in tqdm(cases, desc="Embedding Cases"):
        # STRICT CASTING: Forcing everything to be a string so ChromaDB doesn't crash on 'None'
        case_id = str(case.get("caseId") or f"UNKNOWN-{len(ids)}")
        title = str(case.get("title") or "")
        desc = str(case.get("description") or "")
        category = str(case.get("category") or "UNKNOWN")
        device = str(case.get("device") or "UNKNOWN")
        
        # Safely grab the resolution text even if the AI generated a null object
        resolution = case.get("resolution")
        if not isinstance(resolution, dict):
            resolution = {}
        action_taken = str(resolution.get("actionTaken") or "No resolution provided.")

        # Build the rich text string the AI will actually read and understand
        search_context = f"Title: {title} | Issue: {desc} | Category: {category} | Device: {device}"

        ids.append(case_id)
        documents.append(search_context)
        
        # CHROMA DB FIX: Every single value is now guaranteed to be a string
        metadatas.append({
            "ticket_id": case_id,
            "system_layer": category,
            "environment": device,
            "severity_level": str(case.get("severity") or "P3"),
            "customer_query": desc,
            "technical_resolution": action_taken
        })

    embeddings = embedding_model.encode(documents).tolist()

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )

    print("\n🎉 BOOM. Telecom Vector Database compiled and synced to disk.")

if __name__ == "__main__":
    build_database()