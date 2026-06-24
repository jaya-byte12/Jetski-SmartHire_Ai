import axios from 'axios';

// TypeScript Interfaces matching FastAPI Pydantic Models

export interface ResumeUploadResponse {
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  gcs_uri: string | null;
  url: string | null;
}

export interface AnalyzeRequest {
  resume_text: string;
  jd_text: string;
}

export interface AnalyzeResponse {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
  ai_summary: string;
}

export interface RoadmapRequest {
  current_skills: string[];
  target_role: string;
}

export interface Milestone {
  month: number;
  title: string;
  goals: string[];
  resources: string[];
  milestone: string;
}

export interface RoadmapResponse {
  target_role: string;
  months: Milestone[];
}

export interface BulkScreenCandidateResult {
  filename: string;
  candidate_name: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: string;
  ai_summary: string;
  timestamp: string;
}

export interface BulkScreenResponse {
  results: BulkScreenCandidateResult[];
}

export interface HistoryItem {
  id: string;
  filename: string;
  candidate_name: string;
  match_score: number;
  recommendation: string;
  ai_summary: string;
  matched_skills: string[];
  missing_skills: string[];
  timestamp: string;
}

export interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  items: HistoryItem[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  gcp_connected: boolean;
  gemini_connected: boolean;
}

// Create configured Axios client
const client = axios.create({
  baseURL: import.meta.env.PROD ? 'https://smarthire-api-production.up.railway.app' : '', // Proxy handles development, update for production deployment URL
  timeout: 60000, // 60s timeout for heavy AI calls
});

export const apiService = {
  /**
   * Uploads a resume (PDF/DOCX) and returns parsed text + metadata.
   */
  uploadResume: async (file: File): Promise<ResumeUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post<ResumeUploadResponse>('/api/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Analyzes resume text against a job description.
   */
  analyzeResume: async (resumeText: string, jdText: string): Promise<AnalyzeResponse> => {
    const response = await client.post<AnalyzeResponse>('/api/analyze', {
      resume_text: resumeText,
      jd_text: jdText,
    });
    return response.data;
  },

  /**
   * Generates a 6-month learning career roadmap.
   */
  generateRoadmap: async (currentSkills: string[], targetRole: string): Promise<RoadmapResponse> => {
    const response = await client.post<RoadmapResponse>('/api/career-roadmap', {
      current_skills: currentSkills,
      target_role: targetRole,
    });
    return response.data;
  },

  /**
   * Asynchronously screen multiple resumes in a batch.
   */
  bulkScreen: async (
    files: File[], 
    jdText: string, 
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<BulkScreenResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('jd_text', jdText);

    const response = await client.post<BulkScreenResponse>('/api/bulk-screen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Fetches paginated screening history.
   */
  getHistory: async (page = 1, limit = 10): Promise<HistoryResponse> => {
    const response = await client.get<HistoryResponse>('/api/history', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Verifies system integration health status.
   */
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await client.get<HealthResponse>('/health');
    return response.data;
  },
};
