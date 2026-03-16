from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

app = FastAPI(title="Sentinel AI API")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API keys from .env
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in .env file")

# Supabase Client setup
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Request models
class PromptRequest(BaseModel):
    prompt: str

# UPDATED: Added code and report fields
class LogRequest(BaseModel):
    prompt: str
    security_score: int
    generated_code: str
    audit_report: str

@app.get("/")
def home():
    return {"status": "Sentinel AI Backend Running"}

# -----------------------------
# 1. GENERATE SECURITY POLICY
# -----------------------------
@app.post("/generate")
async def generate_policy(request: PromptRequest):
    system_prompt = """
    You are a DevSecOps Architect.
    Generate secure cloud infrastructure policies.
    Output only valid JSON or Terraform code.
    Do not use markdown formatting.
    """
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt},
                ],
            },
        )
        result = response.json()
        return {"generated_code": result["choices"][0]["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------
# 2. SECURITY AUDIT (STRICT VERSION)
# -----------------------------
@app.post("/audit")
async def audit_code(request: PromptRequest):
    system_prompt = """
    You are a STRICT and ruthless Cloud Cybersecurity Auditor. 
    Analyze the provided Infrastructure-as-Code (IaC) strictly against OWASP and CIS benchmarks.

    CRITICAL GRADING RUBRIC (You MUST follow this):
    - Give SCORE: 1/10 to 4/10 if there are critical risks (e.g., public S3 buckets, '*' IAM permissions, AdministratorAccess, or Security Groups open to 0.0.0.0/0).
    - Give SCORE: 5/10 to 7/10 for missing minor best practices (e.g., missing encryption, no logging, or missing tags).
    - Give SCORE: 8/10 to 10/10 ONLY if the code is perfectly secure, encrypted, and follows the Principle of Least Privilege.

    Format your response EXACTLY like this:
    SCORE: [Your Score]/10

    Vulnerabilities:
    - [List vulnerabilities clearly]

    Fix Recommendations:
    - [List exactly how to fix the code]
    """
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt},
                ],
            },
        )
        result = response.json()
        return {"audit_report": result["choices"][0]["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------
# 3. SAVE LOG TO DATABASE (UPDATED)
# -----------------------------
@app.post("/api/save_log")
async def save_audit_log(request: LogRequest):
    if not supabase:
        return {"status": "warning", "message": "Supabase keys missing in .env"}
    try:
        data = supabase.table("audit_logs").insert({
            "prompt": request.prompt,
            "security_score": request.security_score,
            "generated_code": request.generated_code,
            "audit_report": request.audit_report
        }).execute()
        return {"status": "success", "message": "Logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------
# 4. FETCH HISTORY FOR UI
# -----------------------------
@app.get("/api/history")
async def get_history():
    if not supabase:
        return {"status": "warning", "data": []}
    try:
        response = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(10).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))