import logging
from fastapi import APIRouter, Query, HTTPException, status
from models.schemas import RoadmapRequest, RoadmapResponse, HistoryResponse, HistoryItem
from services.gemini_service import gemini_service
from services.firestore_service import firestore_service

logger = logging.getLogger("smarthire.career")
router = APIRouter(prefix="/api", tags=["career_and_history"])

@router.post(
    "/career-roadmap",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a 6-month career roadmap",
    description="Based on current skills and target role, invokes Gemini API to generate a detailed 6-month roadmap."
)
async def generate_career_roadmap(request: RoadmapRequest):
    """
    Accept current_skills (array of strings) and target_role (string) as input.
    Call Gemini API to generate a 6-month career roadmap.
    Return structured JSON with monthly milestones.
    """
    if not request.target_role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target role must be specified."
        )
    if not request.current_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current skills list cannot be empty."
        )

    logger.info(f"Generating 6-month career roadmap for target role: '{request.target_role}'")
    roadmap_result = await gemini_service.generate_career_roadmap(
        current_skills=request.current_skills,
        target_role=request.target_role
    )
    return RoadmapResponse(**roadmap_result)


@router.get(
    "/history",
    response_model=HistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch paginated screening history",
    description="Retrieve all past resume analyses and bulk screenings saved in Firestore/Mock DB with page and limit."
)
async def get_screening_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=10, ge=1, le=100, description="Items per page")
):
    """
    Fetch all past screening results from Firestore / Local JSON database.
    Supports pagination using page and limit query params.
    """
    logger.info(f"Fetching history page {page} with limit {limit}")
    total_count, records = await firestore_service.get_screenings(page=page, limit=limit)
    
    # Map items safely to list of HistoryItem
    items = []
    for record in records:
        try:
            # Firestore documents return custom datetime-like objects or strings from JSON
            items.append(HistoryItem(
                id=record.get("id") or record.get("_id") or "unknown",
                filename=record.get("filename") or "DirectInput.txt",
                candidate_name=record.get("candidate_name") or "Candidate",
                match_score=record.get("match_score", 0),
                recommendation=record.get("recommendation") or "Maybe",
                ai_summary=record.get("ai_summary") or "",
                matched_skills=record.get("matched_skills") or [],
                missing_skills=record.get("missing_skills") or [],
                timestamp=record.get("timestamp")
            ))
        except Exception as e:
            logger.error(f"Error parsing history record {record.get('id')}: {e}")
            continue

    return HistoryResponse(
        total=total_count,
        page=page,
        limit=limit,
        items=items
    )
