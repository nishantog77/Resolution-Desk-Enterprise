import os
import json
import time
from openai import OpenAI
import re

print("🚀 Booting Local Dataset Generator (Telecom Consumer Rubric)...")

# Connect to Local Ollama Server
client = OpenAI(
    base_url='http://localhost:11434/v1',
    api_key='local-ollama-key'
)

# U can generate as much cases as you want 
TOTAL_CASES = 360 
BATCH_SIZE = 10
TOTAL_BATCHES = TOTAL_CASES // BATCH_SIZE
OUTPUT_DIR = "datasets"
JSON_FILE = f"{OUTPUT_DIR}/historical_cases.json"
MAX_RETRIES = 3

# Setup directories and clean slate
os.makedirs(OUTPUT_DIR, exist_ok=True)
if os.path.exists(JSON_FILE):
    os.remove(JSON_FILE)

all_cases = []
global_id_counter = 1

def generate_batch(batch_num, current_id):
    
    prompt = f"""
    Generate exactly {BATCH_SIZE} realistic telecom customer support cases in JSON format.
    
    Each case must strictly follow this exact JSON schema:
    {{
        "tickets": [
            {{
                "caseId": "CASE-2024-XXXXX",
                "title": "Short summary of the issue",
                "description": "Realistic 1-3 sentences from a real agent's perspective.",
                "category": "NETWORK | BILLING | DEVICE | SERVICE_OUTAGE | ACCOUNT",
                "subCategory": "Specific issue type",
                "device": "Mix of Samsung/iPhone/Xiaomi/OnePlus models",
                "severity": "P1 | P2 | P3 | P4",
                "status": "RESOLVED",
                "customerTier": "CONSUMER | BUSINESS | VIP",
                "resolution": {{
                    "rootCause": "What caused the issue",
                    "actionTaken": "How it was fixed",
                    "effectivenessScore": 4.5
                }},
                "tags": ["tag1", "tag2", "tag3"],
                "createdAt": "2024-03-15T09:00:00Z",
                "resolvedAt": "2024-03-15T14:30:00Z"
            }}
        ]
    }}
    
    Ensure a diverse mix of categories (NETWORK, BILLING, DEVICE, SERVICE_OUTAGE, ACCOUNT).
    Output ONLY valid JSON. No markdown, no introductory text.
    """

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="llama3:8b", 
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                response_format={"type": "json_object"}
            )

            raw_content = response.choices[0].message.content
            clean_content = re.sub(r'```json\s*|\s*```', '', raw_content).strip()
            
            data = json.loads(clean_content)
            raw_tickets = data.get("tickets", [])
            
            if not raw_tickets:
                raise ValueError("Empty tickets array.")
            
            # Ensure correct case IDs
            processed_cases = []
            for idx, case in enumerate(raw_tickets):
                case["caseId"] = f"CASE-2024-{current_id + idx:05d}"
                # Ensure effectivenessScore is a float to prevent Java parsing errors later
                if "resolution" in case and "effectivenessScore" in case["resolution"]:
                    case["resolution"]["effectivenessScore"] = float(case["resolution"]["effectivenessScore"])
                processed_cases.append(case)
                
            return processed_cases

        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}. Retrying...")
            time.sleep(1)
            
    return []

print(f"⚙️ Target: {TOTAL_CASES} Telecom cases. Starting generation...")

# Generation Loop
for i in range(1, TOTAL_BATCHES + 1):
    print(f"🔄 Processing Batch {i}/{TOTAL_BATCHES}...")
    
    batch_cases = generate_batch(i, global_id_counter)
    
    if batch_cases:
        all_cases.extend(batch_cases)
        global_id_counter += len(batch_cases)
        print(f"✅ Saved {len(batch_cases)} cases. Total: {len(all_cases)}/{TOTAL_CASES}")
    else:
        print("⏭️ Skipping batch due to errors.")
        
    time.sleep(0.5)

# Final Save to JSON Array 
with open(JSON_FILE, 'w') as f:
    json.dump(all_cases, f, indent=4)

print(f"\n🎉 BOOM. Successfully generated {len(all_cases)} cases and saved to {JSON_FILE}!")
print("PRO TIP: Open the file in VS Code and verify there are no red squiggly lines.")