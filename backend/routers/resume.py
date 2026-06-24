import io
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from PyPDF2 import PdfReader
from docx import Document

from models.schemas import ResumeUploadResponse
from services.storage_service import storage_service

logger = logging.getLogger("smarthire.resume")
router = APIRouter(prefix="/api", tags=["resume"])

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text content from PDF file bytes."""
    try:
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse PDF document: {str(e)}"
        )

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text content from DOCX file bytes."""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse Word document (DOCX): {str(e)}"
        )

@router.post(
    "/upload-resume",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and parse a single resume file (PDF/DOCX)",
    description="Accepts PDF/DOCX files, extracts plain text using PyPDF2/python-docx, uploads to GCS, and returns details."
)
async def upload_resume(file: UploadFile = File(...)):
    """
    Accept PDF/DOCX resume uploads.
    Parse text using PyPDF2 and python-docx.
    Store file in Google Cloud Storage or fallback local storage.
    Return extracted resume text, GCS URI, public URL, and metadata.
    """
    filename = file.filename
    content_type = file.content_type
    
    # Simple validation on file extension
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX resume formats are supported."
        )

    # Read file content
    try:
        file_content = await file.read()
        file_size = len(file_content)
    except Exception as e:
        logger.error(f"Failed to read file upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # Parse text
    logger.info(f"Parsing uploaded file '{filename}' (size: {file_size} bytes)")
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(file_content)
    else:  # docx
        extracted_text = extract_text_from_docx(file_content)

    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any readable text from the uploaded document."
        )

    # Upload file content to storage
    upload_result = await storage_service.upload_file(file_content, filename, content_type)

    return ResumeUploadResponse(
        filename=filename,
        file_type=content_type or f"application/{ext}",
        file_size=file_size,
        extracted_text=extracted_text,
        gcs_uri=upload_result.get("gcs_uri"),
        url=upload_result.get("url")
    )
