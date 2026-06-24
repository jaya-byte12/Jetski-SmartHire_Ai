import asyncio
import logging
from typing import List
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from datetime import datetime

from models.schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    BulkScreenResponse, 
    BulkScreenCandidateResult
)
from services.gemini_service import gemini_service
from services.storage_service import storage_service
from services.firestore_service import firestore_service
from routers.resume import extract_text_from_pdf, extract_text_from_docx

logger = logging.getLogger("smarthire.analyze")
router = APIRouter(prefix="/api", tags=["analysis"])

def infer_candidate_name(filename: str, resume_text: str) -> str:
    """Helper to infer candidate name from filename or first line of resume."""
    # Try parsing filename (e.g. "John_Doe_Resume.pdf" -> "John Doe")
    clean_name = filename.split(".")[0]
    clean_name = clean_name.replace("_", " ").replace("-", " ")
    clean_name = re_sub = "".join([c for c in clean_name if c.isalnum() or c.isspace()])
    # Strip keywords like resume, CV
    for kw in ["resume", "cv", "pdf", "docx", "2026", "2025"]:
        clean_name = clean_name.lower().replace(kw, "").strip()
    
    if clean_name and len(clean_name) > 2:
        return clean_name.title()
    
    # Fallback to first line of text (first few words)
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]
    if lines:
        first_line = lines[0]
        words = first_line.split()
        if len(words) <= 4:
            return first_line
            
    return "Candidate"

@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a single resume against a job description",
    description="Invokes the Gemini API with a structured prompt, performs matching, saves results, and returns analysis."
)
async def analyze_resume(request: AnalyzeRequest):
    """
    Accept resume text + job description text.
    Call Gemini API (gemini-1.5-pro) with structured prompt.
    Save screening results in Firestore.
    Return match score, matched/missing skills, strengths/weaknesses, recommendation, and AI summary.
    """
    if not request.resume_text.strip() or not request.jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both resume text and job description must be provided."
        )

    logger.info("Triggering AI resume analysis.")
    # Perform analysis via Gemini service
    analysis_result = await gemini_service.analyze_resume(request.resume_text, request.jd_text)

    # Prepare database saving structure
    candidate_name = infer_candidate_name("Candidate_Resume.pdf", request.resume_text)
    
    db_record = {
        "filename": "DirectInput.txt",
        "candidate_name": candidate_name,
        "match_score": analysis_result["match_score"],
        "matched_skills": analysis_result["matched_skills"],
        "missing_skills": analysis_result["missing_skills"],
        "recommendation": analysis_result["recommendation"],
        "ai_summary": analysis_result["ai_summary"],
        "timestamp": datetime.utcnow()
    }
    
    # Store history record asynchronously in Firestore
    await firestore_service.save_screening(db_record)

    return AnalyzeResponse(**analysis_result)


async def process_single_bulk_resume(file: UploadFile, jd_text: str) -> BulkScreenCandidateResult:
    """Asynchronous worker to process, parse, upload, analyze, and save a single candidate resume."""
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in ["pdf", "docx"]:
        raise ValueError(f"Unsupported file format: {filename}")
        
    file_bytes = await file.read()
    content_type = file.content_type
    
    # Run parsing in thread pool because it's CPU-bound
    if ext == "pdf":
        text = await asyncio.to_thread(extract_text_from_pdf, file_bytes)
    else:
        text = await asyncio.to_thread(extract_text_from_docx, file_bytes)

    if not text:
        raise ValueError(f"Could not extract text from {filename}")

    # Start storage upload and Gemini analysis concurrently
    upload_task = storage_service.upload_file(file_bytes, filename, content_type)
    analysis_task = gemini_service.analyze_resume(text, jd_text)
    
    # Wait for both tasks to complete
    upload_result, analysis = await asyncio.gather(upload_task, analysis_task)
    
    candidate_name = infer_candidate_name(filename, text)
    
    # Prepare firestore record
    db_record = {
        "filename": filename,
        "candidate_name": candidate_name,
        "match_score": analysis["match_score"],
        "matched_skills": analysis["matched_skills"],
        "missing_skills": analysis["missing_skills"],
        "recommendation": analysis["recommendation"],
        "ai_summary": analysis["ai_summary"],
        "timestamp": datetime.utcnow()
    }
    
    # Save screening in firestore
    await firestore_service.save_screening(db_record)
    
    return BulkScreenCandidateResult(
        filename=filename,
        candidate_name=candidate_name,
        match_score=analysis["match_score"],
        matched_skills=analysis["matched_skills"],
        missing_skills=analysis["missing_skills"],
        recommendation=analysis["recommendation"],
        ai_summary=analysis["ai_summary"],
        timestamp=db_record["timestamp"]
    )

@router.post(
    "/bulk-screen",
    response_model=BulkScreenResponse,
    status_code=status.HTTP_200_OK,
    summary="Asynchronously screen multiple resumes against a job description",
    description="Processes uploads concurrently, parses, runs Gemini on each, saves history, and ranks candidates."
)
async def bulk_screen(files: List[UploadFile] = File(...), jd_text: str = Form(...)):
    """
    Accept multiple resumes (PDF/DOCX) + one job description.
    Process all resumes asynchronously using asyncio.gather.
    Return ranked list of candidates with scores, sorted by match_score descending.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one resume file must be uploaded."
        )
    if not jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text must be provided."
        )

    logger.info(f"Triggering bulk screening for {len(files)} files.")
    
    tasks = []
    for file in files:
        tasks.append(process_single_bulk_resume(file, jd_text))

    # Process all resumes concurrently
    results = []
    errors = []
    
    # We use return_exceptions=True to make sure one bad file doesn't crash the whole batch
    batch_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for i, res in enumerate(batch_results):
        if isinstance(res, Exception):
            logger.error(f"Error processing file {files[i].filename}: {res}")
            errors.append(f"{files[i].filename}: {str(res)}")
        else:
            results.append(res)
            
    if not results and errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"All files failed processing. Errors: {'; '.join(errors)}"
        )

    # Sort results by match_score in descending order (ranking candidates)
    results.sort(key=lambda x: x.match_score, reverse=True)

    return BulkScreenResponse(results=results)
