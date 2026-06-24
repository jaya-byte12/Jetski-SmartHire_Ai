import os
import json
import re
import logging
import google.generativeai as genai
from typing import List, Optional

logger = logging.getLogger("smarthire.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.local_mode = True

        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Test initializing the model
                self.model = genai.GenerativeModel("gemini-1.5-pro")
                self.local_mode = False
                logger.info("Gemini API service initialized successfully (gemini-1.5-pro).")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Falling back to dynamic mock generator.")
                self.local_mode = True
        else:
            logger.info("GEMINI_API_KEY not set. Operating in dynamic mock generator mode.")

    def _clean_json_response(self, text: str) -> str:
        """
        Cleans the response from Gemini to extract pure JSON,
        handling cases where the API wraps JSON in markdown code blocks.
        """
        # Strip potential markdown code blocks
        text = text.strip()
        if text.startswith("```"):
            # Matches ```json or similar and strips it
            text = re.sub(r"^```[a-zA-Z]*\n", "", text)
            text = re.sub(r"\n```$", "", text)
        return text.strip()

    async def analyze_resume(self, resume_text: str, jd_text: str) -> dict:
        """
        Analyze resume against a job description.
        Returns a dict matching the AnalyzeResponse schema.
        """
        if not self.local_mode:
            try:
                prompt = (
                    "You are an expert HR analyst and technical recruiter. \n"
                    "Analyze the following resume against the job description.\n"
                    f"Resume: {resume_text}\n"
                    f"Job Description: {jd_text}\n"
                    "Return ONLY a valid JSON object with these exact keys:\n"
                    "match_score (integer 0-100), matched_skills (array of strings),\n"
                    "missing_skills (array of strings), strengths (array of strings),\n"
                    "weaknesses (array of strings), recommendation (string: one of \n"
                    "'Strong Hire', 'Hire', 'Maybe', 'Reject'), \n"
                    "ai_summary (string, 2-3 sentences).\n"
                    "No markdown, no explanation, only JSON."
                )
                
                # Call Gemini API
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                
                cleaned_text = self._clean_json_response(response.text)
                result = json.loads(cleaned_text)
                
                # Validate keys are present, if not fill with defaults
                required_keys = ["match_score", "matched_skills", "missing_skills", "strengths", "weaknesses", "recommendation", "ai_summary"]
                for key in required_keys:
                    if key not in result:
                        raise ValueError(f"Missing key in Gemini response: {key}")
                
                return result
            except Exception as e:
                logger.error(f"Gemini API analysis failed: {e}. Generating dynamic mock analysis.")
                # fall through to mock mode

        # Dynamic Mock Mode
        return self._generate_mock_analysis(resume_text, jd_text)

    async def generate_career_roadmap(self, current_skills: List[str], target_role: str) -> dict:
        """
        Generates a 6-month career roadmap.
        Returns a dict matching the RoadmapResponse schema.
        """
        skills_str = ", ".join(current_skills)
        if not self.local_mode:
            try:
                prompt = (
                    "You are a senior career coach specializing in tech careers.\n"
                    f"Given current skills: {skills_str} and target role: {target_role},\n"
                    "create a detailed 6-month learning roadmap.\n"
                    "Return ONLY valid JSON with key 'months' as array of 6 objects,\n"
                    "each with: month (int), title (string), goals (array of strings),\n"
                    "resources (array of strings), milestone (string).\n"
                    "No markdown, no explanation, only JSON."
                )

                # Call Gemini API
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,
                        response_mime_type="application/json"
                    )
                )
                
                cleaned_text = self._clean_json_response(response.text)
                result = json.loads(cleaned_text)
                
                if "months" not in result or not isinstance(result["months"], list) or len(result["months"]) != 6:
                    raise ValueError("Gemini response is not a valid 6-month roadmap")
                
                return {
                    "target_role": target_role,
                    "months": result["months"]
                }
            except Exception as e:
                logger.error(f"Gemini API roadmap failed: {e}. Generating dynamic mock roadmap.")
                # fall through to mock mode

        # Dynamic Mock Mode
        return self._generate_mock_roadmap(current_skills, target_role)

    def _generate_mock_analysis(self, resume_text: str, jd_text: str) -> dict:
        """
        Generates a smart, dynamic mock resume analysis using keyword parsing.
        """
        # Common tech keywords to search for
        tech_keywords = [
            "python", "javascript", "typescript", "react", "vue", "angular", "node", "express", "fastapi",
            "django", "flask", "docker", "kubernetes", "aws", "gcp", "azure", "sql", "postgresql", "mongodb",
            "redis", "java", "spring", "c++", "c#", "go", "rust", "html", "css", "tailwind", "pandas",
            "numpy", "tensorflow", "pytorch", "scikit-learn", "git", "ci/cd", "agile", "scrum", "graphql"
        ]

        resume_lower = resume_text.lower()
        jd_lower = jd_text.lower()

        # Find keywords present in Resume and JD
        matched_skills = []
        missing_skills = []

        for skill in tech_keywords:
            in_resume = skill in resume_lower or f" {skill} " in resume_lower or f" {skill}," in resume_lower
            in_jd = skill in jd_lower or f" {skill} " in jd_lower or f" {skill}," in jd_lower

            if in_jd:
                if in_resume:
                    matched_skills.append(skill.capitalize())
                else:
                    missing_skills.append(skill.capitalize())

        # If no skills matched/found, put some placeholders
        if not matched_skills and not missing_skills:
            # General keywords
            matched_skills = ["Communication", "Problem Solving"]
            missing_skills = ["Technical Stack Proficiency"]

        # Compute match score based on Jaccard/Overlap index
        total_skills_needed = len(matched_skills) + len(missing_skills)
        if total_skills_needed > 0:
            match_score = int((len(matched_skills) / total_skills_needed) * 100)
        else:
            match_score = 50

        # Adjust score slightly if resume text is very short or long
        word_count = len(resume_text.split())
        if word_count < 100:
            match_score = max(10, match_score - 20)  # penalize very thin resume
        elif word_count > 1000:
            match_score = min(98, match_score + 5)

        # Recommendation logic
        if match_score >= 80:
            recommendation = "Strong Hire"
        elif match_score >= 60:
            recommendation = "Hire"
        elif match_score >= 40:
            recommendation = "Maybe"
        else:
            recommendation = "Reject"

        # Strengths & Weaknesses
        strengths = [f"Demonstrated experience in {', '.join(matched_skills[:3])}"]
        if word_count > 300:
            strengths.append("Detailed document outlining project achievements")
        else:
            strengths.append("Clear and concise presentation format")

        weaknesses = []
        if missing_skills:
            weaknesses.append(f"Lacks proven background in {', '.join(missing_skills[:3])}")
        else:
            weaknesses.append("Profile could benefit from more specific business metrics")
        if word_count < 150:
            weaknesses.append("Content is extremely brief; details of past jobs are missing")

        # Dynamic AI Summary
        ai_summary = (
            f"The candidate displays a {match_score}% skillset match for the requested position, with core strength in {', '.join(matched_skills[:2]) or 'general software development'}. "
            f"However, key requirements like {', '.join(missing_skills[:2]) or 'specific deployment frameworks'} were not explicitly highlighted in their resume. "
            f"Overall, they are categorized as a '{recommendation}' based on their current experience level."
        )

        return {
            "match_score": match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendation": recommendation,
            "ai_summary": ai_summary
        }

    def _generate_mock_roadmap(self, current_skills: List[str], target_role: str) -> dict:
        """
        Generates a highly contextual 6-month roadmap dynamically using inputs.
        """
        role_skills = {
            "Frontend Engineer": ["JavaScript/TypeScript", "React & Redux", "Tailwind CSS & CSS Grid", "Next.js/Vite", "Web Performance & SEO", "Testing (Jest/Cypress)"],
            "Backend Engineer": ["Python/FastAPI", "Database Indexing & SQL", "Docker & Containers", "System Design & Caching", "Cloud Services (GCP/AWS)", "CI/CD & Testing"],
            "Full Stack Developer": ["React & TypeScript", "FastAPI/Node.js", "Docker & Cloud Deployments", "Database Systems (SQL & NoSQL)", "CI/CD Pipelines", "System Architecture & Security"],
            "Data Scientist": ["Python (Pandas, Numpy)", "Machine Learning (Scikit-Learn)", "Deep Learning (PyTorch/Tensorflow)", "Statistics & A/B Testing", "SQL & BigQuery", "MLOps & Model Deployment"],
            "AI Engineer": ["LLM Fine-tuning & Prompt Engineering", "Vector Databases (Pinecone/Chroma)", "RAG Architectures", "Gemini & OpenAI API Integration", "Agentic Workflows", "PyTorch & Deep Learning"],
            "DevOps Engineer": ["Linux & Shell Scripting", "Docker & Kubernetes", "Infrastructure as Code (Terraform)", "CI/CD (GitHub Actions)", "Cloud Infrastructure (AWS/GCP)", "Monitoring & Logging (ELK/Prometheus)"]
        }

        # Default fallback skills if role not explicitly matched
        needed_skills = role_skills.get(target_role, ["Advanced System Architecture", "Production Deployment", "Automated Testing", "API Design", "Performance Optimization", "Security Best Practices"])
        
        # Remove current skills that the user already has
        current_lower = [s.lower() for s in current_skills]
        roadmap_skills = [s for s in needed_skills if s.lower() not in current_lower]
        
        # If they already have all the skills, add advanced topics
        while len(roadmap_skills) < 6:
            roadmap_skills.append(f"Advanced {target_role} Architecture & Scale")
            roadmap_skills.append("System Refactoring & Technical Leadership")

        months_data = []
        for i in range(1, 7):
            skill_focus = roadmap_skills[i - 1]
            months_data.append({
                "month": i,
                "title": f"Mastering {skill_focus}",
                "goals": [
                    f"Understand core concepts and advanced features of {skill_focus}.",
                    f"Build 2 small-scale prototypes focusing purely on {skill_focus}.",
                    f"Write unit tests and optimize performance for the built prototypes."
                ],
                "resources": [
                    f"Official {skill_focus} Documentation",
                    f"Udemy/Coursera Complete Guide to {skill_focus}",
                    f"GitHub Awesome-{skill_focus.lower().replace(' ', '-')} curated lists"
                ],
                "milestone": f"Launch a public GitHub repo demonstrating comprehensive implementation of {skill_focus} with 90%+ test coverage."
            })

        return {
            "target_role": target_role,
            "months": months_data
        }

# Singleton instance
gemini_service = GeminiService()
