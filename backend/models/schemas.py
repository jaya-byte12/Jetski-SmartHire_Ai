from pydantic import BaseModel, Field, conint
from typing import List, Optional
from datetime import datetime

# ==================== RESUME UPLOAD ====================
class ResumeUploadResponse(BaseModel):
    filename: str = Field(..., description="Name of the uploaded file")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="Size of the file in bytes")
    extracted_text: str = Field(..., description="Extracted plain text content")
    gcs_uri: Optional[str] = Field(None, description="Google Cloud Storage URI of the saved file")
    url: Optional[str] = Field(None, description="Publicly accessible URL of the file (or local path)")

# ==================== SINGLE ANALYSIS ====================
class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Plain text content of the resume")
    jd_text: str = Field(..., description="Plain text content of the job description")

class AnalyzeResponse(BaseModel):
    match_score: int = Field(..., ge=0, le=100, description="Match percentage score")
    matched_skills: List[str] = Field(..., description="Skills matching the job description")
    missing_skills: List[str] = Field(..., description="Skills missing in the resume but in the JD")
    strengths: List[str] = Field(..., description="Candidate strengths")
    weaknesses: List[str] = Field(..., description="Candidate areas of improvement")
    recommendation: str = Field(..., description="One of 'Strong Hire', 'Hire', 'Maybe', 'Reject'")
    ai_summary: str = Field(..., description="2-3 sentence overview summary of candidate fit")

# ==================== CAREER ROADMAP ====================
class RoadmapRequest(BaseModel):
    current_skills: List[str] = Field(..., description="List of user's current skills")
    target_role: str = Field(..., description="The role the user is aiming for")

class Milestone(BaseModel):
    month: int = Field(..., description="Month number (1-6)")
    title: str = Field(..., description="Focus area title for the month")
    goals: List[str] = Field(..., description="Learning goals for this month")
    resources: List[str] = Field(..., description="Free or paid resources recommended")
    milestone: str = Field(..., description="Demonstrable milestone/project for the month")

class RoadmapResponse(BaseModel):
    target_role: str = Field(..., description="Target role name")
    months: List[Milestone] = Field(..., description="6-month timeline structure")

# ==================== BULK SCREENING ====================
class BulkScreenCandidateResult(BaseModel):
    filename: str = Field(..., description="Source filename of the resume")
    candidate_name: str = Field(..., description="Parsed or generated candidate name")
    match_score: int = Field(..., ge=0, le=100)
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    ai_summary: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class BulkScreenResponse(BaseModel):
    results: List[BulkScreenCandidateResult] = Field(..., description="Ranked list of candidates")

# ==================== HISTORY ====================
class HistoryItem(BaseModel):
    id: str = Field(..., description="Firestore document identifier")
    filename: str
    candidate_name: str
    match_score: int
    recommendation: str
    ai_summary: str
    matched_skills: List[str]
    missing_skills: List[str]
    timestamp: datetime

class HistoryResponse(BaseModel):
    total: int = Field(..., description="Total items matching query")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    items: List[HistoryItem] = Field(..., description="List of records")

# ==================== HEALTH ====================
class HealthResponse(BaseModel):
    status: str = Field("healthy")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    gcp_connected: bool = Field(..., description="True if GCP GCS/Firestore connections are active, False if falling back to local mocks")
    gemini_connected: bool = Field(..., description="True if real Gemini API key is configured")
