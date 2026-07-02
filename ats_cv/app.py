import os
import sys
import requests
import urllib3
import base64
from datetime import datetime
from docx import Document
import fitz
import psycopg2
import tempfile
from io import BytesIO
from PIL import Image
import pytesseract
import cv2
import numpy as np
import time
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
from contextlib import asynccontextmanager
import logging
from pathlib import Path

# Désactiver warnings SSL
urllib3.disable_warnings()

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration Tesseract pour Windows
if sys.platform == "win32":
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info(f"Tesseract trouvé: {path}")
            break

# =========================
# CONFIGURATION
# =========================

API_KEY = "AIzaSyDMOyNkRlpvoWVKH7N2hfRKL97DBY1QyQQ"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "recruitment_db",
    "user": "user",
    "password": "password"
}

# Création des dossiers nécessaires
UPLOAD_DIR = Path("uploads")
REPORTS_DIR = Path("reports")
UPLOAD_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# =========================
# MODÈLES PYDANTIC
# =========================

class ApplicationAnalysisRequest(BaseModel):
    application_id: int

class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    application_ids: List[int]

class ScoreResponse(BaseModel):
    application_id: int
    score: Optional[int]
    candidate_name: Optional[str]
    job_title: Optional[str]
    message: str

class AnalysisResponse(BaseModel):
    success: bool
    application_id: Optional[int]
    score: Optional[int]
    report: Optional[str]
    report_file: Optional[str]
    message: str

class HealthResponse(BaseModel):
    status: str
    tesseract_available: bool
    gemini_available: bool
    database_available: bool

# =========================
# FONCTIONS BASE DE DONNÉES
# =========================

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Erreur connexion DB: {e}")
        return None

def get_job_application(application_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, candidate_id, job_id, cv_content, cv_file_name, 
                   cover_letter, portfolio_url, linkedin_profile, 
                   additional_info, expected_salary, availability_date, match_score
            FROM job_application
            WHERE id = %s
        """
        cursor.execute(query, (application_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                "id": row[0],
                "candidate_id": row[1],
                "job_id": row[2],
                "cv_content": row[3],
                "cv_file_name": row[4],
                "cover_letter": row[5],
                "portfolio_url": row[6],
                "linkedin_profile": row[7],
                "additional_info": row[8],
                "expected_salary": row[9],
                "availability_date": row[10],
                "match_score": row[11]
            }
        return None
    except Exception as e:
        logger.error(f"Erreur récupération candidature: {e}")
        return None
    finally:
        conn.close()

def get_job_offer(job_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, title, company, description, requirements, required_skills,
                   salary, location, type, competition_date, 
                   competition_time, competition_status
            FROM job_offer
            WHERE id = %s
        """
        cursor.execute(query, (job_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                "id": row[0],
                "title": row[1],
                "company": row[2],
                "description": row[3],
                "requirements": row[4],
                "required_skills": row[5],
                "salary": row[6],
                "location": row[7],
                "type": row[8],
                "competition_date": row[9],
                "competition_time": row[10],
                "competition_status": row[11]
            }
        return None
    except Exception as e:
        logger.error(f"Erreur récupération offre: {e}")
        return None
    finally:
        conn.close()

def get_candidate(candidate_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT id, email, experience, full_name, phone, skills, user_id
            FROM candidate
            WHERE id = %s
        """
        cursor.execute(query, (candidate_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "experience": row[2],
                "full_name": row[3],
                "phone": row[4],
                "skills": row[5],
                "user_id": row[6]
            }
        return None
    except Exception as e:
        logger.error(f"Erreur récupération candidat: {e}")
        return None
    finally:
        conn.close()

def update_match_score(application_id, match_score):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        query = """
            UPDATE job_application
            SET match_score = %s
            WHERE id = %s
        """
        cursor.execute(query, (match_score, application_id))
        conn.commit()
        logger.info(f"Match score {match_score} mis à jour pour candidature #{application_id}")
        return True
    except Exception as e:
        logger.error(f"Erreur mise à jour match score: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_match_score(application_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT match_score
            FROM job_application
            WHERE id = %s
        """
        cursor.execute(query, (application_id,))
        row = cursor.fetchone()
        
        if row and row[0] is not None:
            return row[0]
        return None
    except Exception as e:
        logger.error(f"Erreur récupération match score: {e}")
        return None
    finally:
        conn.close()

def list_all_applications(limit=100, offset=0):
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT ja.id, ja.candidate_id, ja.job_id, ja.cv_file_name, ja.match_score,
                   c.full_name as candidate_name, jo.title as job_title
            FROM job_application ja
            LEFT JOIN candidate c ON ja.candidate_id = c.id
            LEFT JOIN job_offer jo ON ja.job_id = jo.id
            ORDER BY ja.id DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        rows = cursor.fetchall()
        
        applications = []
        for row in rows:
            applications.append({
                "id": row[0],
                "candidate_id": row[1],
                "job_id": row[2],
                "cv_file_name": row[3],
                "match_score": row[4],
                "candidate_name": row[5],
                "job_title": row[6]
            })
        return applications
    except Exception as e:
        logger.error(f"Erreur liste candidatures: {e}")
        return []
    finally:
        conn.close()

# =========================
# FONCTIONS EXTRACTION CV
# =========================

def safe_remove_file(filepath, max_retries=3):
    for i in range(max_retries):
        try:
            if os.path.exists(filepath):
                os.unlink(filepath)
            return True
        except PermissionError:
            if i < max_retries - 1:
                time.sleep(0.5)
            else:
                logger.warning(f"Impossible de supprimer: {filepath}")
    return False

def extract_pdf_with_ocr(file_bytes):
    temp_pdf_path = None
    temp_files = []
    
    try:
        temp_dir = tempfile.mkdtemp()
        temp_pdf_path = os.path.join(temp_dir, "temp_cv.pdf")
        
        with open(temp_pdf_path, 'wb') as f:
            f.write(file_bytes)
        
        logger.info("Tentative d'extraction de texte standard...")
        
        doc = fitz.open(temp_pdf_path)
        text = ""
        has_text = False
        
        for page in doc:
            page_text = page.get_text()
            if page_text.strip():
                text += page_text + "\n"
                has_text = True
        
        doc.close()
        
        if has_text and len(text.strip()) > 100:
            logger.info(f"Texte extrait standardement ({len(text)} caractères)")
            safe_remove_file(temp_pdf_path)
            try:
                os.rmdir(temp_dir)
            except:
                pass
            return text.strip()
        
        logger.info("Peu ou pas de texte détecté, utilisation de l'OCR...")
        
        doc = fitz.open(temp_pdf_path)
        all_text = []
        
        for page_num in range(len(doc)):
            logger.info(f"OCR Traitement page {page_num + 1}/{len(doc)}")
            
            page = doc[page_num]
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            img_path = os.path.join(temp_dir, f"page_{page_num + 1}.png")
            pix.save(img_path)
            temp_files.append(img_path)
            
            try:
                img = cv2.imread(img_path)
                if img is not None:
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    
                    custom_config = r'--oem 3 --psm 6 -l fra+eng'
                    page_text = pytesseract.image_to_string(thresh, config=custom_config)
                    
                    if page_text.strip():
                        all_text.append(page_text)
                        logger.info(f"OCR Page {page_num + 1}: {len(page_text)} caractères")
            except Exception as e:
                logger.error(f"Erreur OCR page {page_num + 1}: {e}")
        
        doc.close()
        
        for filepath in temp_files:
            safe_remove_file(filepath)
        safe_remove_file(temp_pdf_path)
        
        try:
            os.rmdir(temp_dir)
        except:
            pass
        
        final_text = "\n".join(all_text).strip()
        
        if final_text:
            logger.info(f"OCR terminé: {len(final_text)} caractères")
            return final_text
        else:
            logger.error("Aucun texte extrait par OCR")
            return None
            
    except Exception as e:
        logger.error(f"Erreur extraction PDF avec OCR: {e}")
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            safe_remove_file(temp_pdf_path)
        try:
            if temp_dir and os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        except:
            pass
        return None

def extract_docx_from_bytes(file_bytes):
    try:
        doc_stream = BytesIO(file_bytes)
        doc = Document(doc_stream)
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return text.strip() if text else None
    except Exception as e:
        logger.error(f"Erreur extraction DOCX: {e}")
        return None

def decode_base64_cv(cv_content, file_name):
    try:
        if cv_content and isinstance(cv_content, str):
            try:
                cv_bytes = base64.b64decode(cv_content)
                logger.info(f"Base64 décodé: {len(cv_bytes)} bytes")
                
                file_type = detect_file_type(cv_bytes)
                logger.info(f"Type fichier détecté: {file_type}")
                
                if file_type == 'pdf':
                    return extract_pdf_with_ocr(cv_bytes)
                elif file_type == 'docx':
                    return extract_docx_from_bytes(cv_bytes)
                elif file_type == 'txt':
                    return cv_bytes.decode('utf-8', errors='ignore')
                else:
                    logger.error(f"Type fichier non supporté: {file_type}")
                    return None
                    
            except Exception as e:
                logger.info(f"Pas un base64 valide: {e}")
                return cv_content.strip()
        else:
            logger.error("Contenu CV invalide")
            return None
            
    except Exception as e:
        logger.error(f"Erreur décodage CV: {e}")
        return None

def detect_file_type(file_bytes):
    if len(file_bytes) < 4:
        return 'txt'
    
    if file_bytes[0:4] == b'%PDF':
        return 'pdf'
    
    if file_bytes[0:2] == b'PK':
        return 'docx'
    
    try:
        file_bytes[:100].decode('utf-8')
        return 'txt'
    except:
        return 'unknown'

def extract_resume_from_file(file: UploadFile):
    """Extrait le texte d'un fichier CV uploadé"""
    try:
        content = file.file.read()
        
        if file.filename.endswith('.pdf'):
            return extract_pdf_with_ocr(content)
        elif file.filename.endswith('.docx'):
            return extract_docx_from_bytes(content)
        elif file.filename.endswith('.txt'):
            return content.decode('utf-8', errors='ignore')
        else:
            return None
    except Exception as e:
        logger.error(f"Erreur extraction fichier: {e}")
        return None

# =========================
# FONCTIONS ANALYSE GEMINI
# =========================

def build_prompt(job_description, resume_text):
    return f"""
Tu es un expert ATS et recruteur professionnel.

⚠️ **RÈGLES STRICTES D'ANALYSE** :
1. Ne note PAS un CV simplement parce qu'il a des mots-clés comme "Systèmes d'Information" si le métier est différent
2. Détecte le DOMAINE MÉTIER principal du CV (ex: IT, Finance, Marketing, RH, etc.)
3. Compare le DOMAINE du CV avec le DOMAINE de l'offre
4. Si les domaines sont différents → Score ATS = 0/100 et recommandation "NE PAS RECRUTER"
5. Si les domaines sont similaires → Analyse détaillée des compétences (score entre 0 et 100)

========================
OFFRE D'EMPLOI
========================

{job_description}

========================
CV DU CANDIDAT
========================

{resume_text[:10000]}

========================
ANALYSE À FOURNIR
========================

**1. DIAGNOSTIC RAPIDE** (obligatoire)
- Domaine métier du CV : [...]
- Domaine métier de l'offre : [...]
- Sont-ils compatibles ? OUI/NON
- Si NON → Arrêtez ici et donnez Score ATS = 0/100

**2. Si compatible UNIQUEMENT, analysez :**
- Résumé du CV
- Score ATS (/100) - basé sur compétences, expérience, formation
- Points forts
- Points faibles
- Recommandation finale

**3. Si NON compatible, répondez :**
❌ INCOMPATIBILITÉ DE DOMAINE : Ce CV est dans le domaine [X] alors que l'offre est dans [Y].
Score ATS = 0/100
Recommandation: NE PAS RECRUTER

**IMPORTANT**: Vous DEVEZ inclure explicitement le score ATS dans votre réponse au format "Score ATS: XX/100" ou "[SCORE] XX".

Réponds uniquement en français, sois STRICT sur la compatibilité métier.
"""

def analyze_with_gemini(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, verify=False, timeout=120)
        
        # Check response status
        if response.status_code != 200:
            logger.error(f"Erreur Gemini API - Status: {response.status_code}, Response: {response.text}")
            return None
        
        # Check if response is empty
        if not response.text or len(response.text.strip()) == 0:
            logger.error("Erreur Gemini: Response vide")
            return None
        
        # Parse JSON
        try:
            result = response.json()
        except ValueError as e:
            logger.error(f"Erreur Gemini parsing JSON: {e}, Response text: {response.text[:500]}")
            return None
        
        if "candidates" not in result:
            logger.error(f"Erreur Gemini: Pas de 'candidates' dans la réponse - {result}")
            return None
        
        return result["candidates"][0]["content"]["parts"][0]["text"]
        
    except Exception as e:
        logger.error(f"Erreur Gemini: {e}")
        return None

def extract_score_from_result(result):
    if not result:
        return None
    
    if "INCOMPATIBILITÉ" in result or "NE PAS RECRUTER" in result or "incompatible" in result.lower():
        logger.info("Incompatibilité détectée, score = 0")
        return 0
    
    patterns = [
        r'Score\s+ATS\s*[:/]?\s*(\d+)',
        r'score\s*ATS\s*[:/]?\s*(\d+)',
        r'score\s*[:/]?\s*(\d+)',
        r'(\d+)\s*/\s*100',
        r'(\d+)%',
        r'\[SCORE\]\s*(\d+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, result, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            return min(max(score, 0), 100)
    
    if any(phrase in result.lower() for phrase in [
        "ne correspond pas au domaine",
        "cv non compatible",
        "domaine différent"
    ]):
        return 0
    
    return None

def analyze_resume(job_description, resume_text, candidate_name=None, job_title=None):
    """Analyse un CV et retourne le résultat et le score"""
    prompt = build_prompt(job_description, resume_text)
    result = analyze_with_gemini(prompt)
    
    if result:
        score = extract_score_from_result(result)
        return result, score
    return None, None

# =========================
# INITIALISATION FASTAPI
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage
    logger.info("Démarrage de l'API ATS Analyzer")
    yield
    # Arrêt
    logger.info("Arrêt de l'API ATS Analyzer")

app = FastAPI(
    title="ATS Resume Analyzer API",
    description="API pour l'analyse automatique de CV avec ATS et Gemini",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ENDPOINTS API
# =========================

@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "message": "ATS Resume Analyzer API",
        "version": "1.0.0",
        "endpoints": "/docs pour la documentation"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Vérifie l'état des services"""
    # Vérifier Tesseract
    tesseract_ok = False
    try:
        pytesseract.get_tesseract_version()
        tesseract_ok = True
    except:
        pass
    
    # Vérifier Gemini
    gemini_ok = False
    test_result = analyze_with_gemini("Bonjour, réponds 'OK'")
    if test_result:
        gemini_ok = True
    
    # Vérifier Base de données
    db_ok = False
    conn = get_db_connection()
    if conn:
        db_ok = True
        conn.close()
    
    return HealthResponse(
        status="healthy" if (tesseract_ok and gemini_ok) else "degraded",
        tesseract_available=tesseract_ok,
        gemini_available=gemini_ok,
        database_available=db_ok
    )

@app.post("/analyze/application", response_model=AnalysisResponse)
async def analyze_application(request: ApplicationAnalysisRequest):
    """
    Analyse une candidature existante dans la base de données
    """
    try:
        # Récupérer la candidature
        application = get_job_application(request.application_id)
        if not application:
            raise HTTPException(status_code=404, detail=f"Candidature #{request.application_id} non trouvée")
        
        # Récupérer l'offre
        job_offer = get_job_offer(application['job_id'])
        if not job_offer:
            raise HTTPException(status_code=404, detail=f"Offre #{application['job_id']} non trouvée")
        
        # Récupérer le candidat
        candidate = get_candidate(application['candidate_id'])
        
        # Préparer la description de l'offre
        job_description = f"""
Titre: {job_offer['title']}
Entreprise: {job_offer['company']}
Description: {job_offer['description']}
Exigences: {job_offer['requirements']}
Compétences requises: {job_offer['required_skills']}
Salaire proposé: {job_offer['salary']}
Lieu: {job_offer['location']}
Type de contrat: {job_offer['type']}
"""
        
        # Extraire le texte du CV
        resume_text = decode_base64_cv(application['cv_content'], application['cv_file_name'])
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Impossible d'extraire le texte du CV")
        
        # Analyser
        result, score = analyze_resume(
            job_description, 
            resume_text,
            candidate['full_name'] if candidate else None,
            job_offer['title'] if job_offer else None
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Erreur lors de l'analyse")
        
        # Sauvegarder le score
        if score is not None:
            update_match_score(request.application_id, score)
        
        # Sauvegarder le rapport
        report_filename = f"report_{request.application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        report_path = REPORTS_DIR / report_filename
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(f"Candidature #{request.application_id}\n")
            f.write(f"Candidat: {candidate['full_name'] if candidate else 'Inconnu'}\n")
            f.write(f"Poste: {job_offer['title']} - {job_offer['company']}\n")
            f.write(f"Date: {datetime.now()}\n")
            f.write(f"Score ATS: {score}/100\n")
            f.write("="*50 + "\n\n")
            f.write(result)
        
        return AnalysisResponse(
            success=True,
            application_id=request.application_id,
            score=score,
            report=result,
            report_file=str(report_path),
            message=f"Analyse terminée. Score: {score}/100"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur analyse candidature: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/upload")
async def analyze_upload(
    cv_file: UploadFile = File(...),
    job_description: str = Form(...),
    candidate_name: Optional[str] = Form(None),
    job_title: Optional[str] = Form(None)
):
    """
    Analyse un CV uploadé avec une description de poste
    """
    try:
        # Vérifier le type de fichier
        if not cv_file.filename.endswith(('.pdf', '.docx', '.txt')):
            raise HTTPException(status_code=400, detail="Format non supporté. Utilisez PDF, DOCX ou TXT")
        
        # Extraire le texte du CV
        resume_text = extract_resume_from_file(cv_file)
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Impossible d'extraire le texte du CV")
        
        # Analyser
        result, score = analyze_resume(job_description, resume_text, candidate_name, job_title)
        
        if not result:
            raise HTTPException(status_code=500, detail="Erreur lors de l'analyse")
        
        # Sauvegarder le rapport
        report_filename = f"report_upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        report_path = REPORTS_DIR / report_filename
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(f"Fichier: {cv_file.filename}\n")
            if candidate_name:
                f.write(f"Candidat: {candidate_name}\n")
            if job_title:
                f.write(f"Poste: {job_title}\n")
            f.write(f"Date: {datetime.now()}\n")
            f.write(f"Score ATS: {score}/100\n")
            f.write("="*50 + "\n\n")
            f.write(result)
        
        return JSONResponse(content={
            "success": True,
            "score": score,
            "report": result,
            "report_file": str(report_path),
            "message": f"Analyse terminée. Score: {score}/100"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur analyse upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/batch", response_model=List[AnalysisResponse])
async def analyze_batch(request: BatchAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyse plusieurs candidatures en lot
    """
    results = []
    
    for app_id in request.application_ids:
        try:
            application = get_job_application(app_id)
            if not application:
                results.append(AnalysisResponse(
                    success=False,
                    application_id=app_id,
                    score=None,
                    report=None,
                    report_file=None,
                    message=f"Candidature #{app_id} non trouvée"
                ))
                continue
            
            job_offer = get_job_offer(application['job_id'])
            if not job_offer:
                results.append(AnalysisResponse(
                    success=False,
                    application_id=app_id,
                    score=None,
                    report=None,
                    report_file=None,
                    message=f"Offre #{application['job_id']} non trouvée"
                ))
                continue
            
            candidate = get_candidate(application['candidate_id'])
            
            job_description = f"""
Titre: {job_offer['title']}
Entreprise: {job_offer['company']}
Description: {job_offer['description']}
Exigences: {job_offer['requirements']}
Compétences: {job_offer['required_skills']}
"""
            
            resume_text = decode_base64_cv(application['cv_content'], application['cv_file_name'])
            
            if not resume_text:
                results.append(AnalysisResponse(
                    success=False,
                    application_id=app_id,
                    score=None,
                    report=None,
                    report_file=None,
                    message="Impossible d'extraire le texte du CV"
                ))
                continue
            
            result, score = analyze_resume(job_description, resume_text)
            
            if score is not None:
                update_match_score(app_id, score)
            
            results.append(AnalysisResponse(
                success=True,
                application_id=app_id,
                score=score,
                report=result,
                report_file=None,
                message=f"Score: {score}/100"
            ))
            
        except Exception as e:
            results.append(AnalysisResponse(
                success=False,
                application_id=app_id,
                score=None,
                report=None,
                report_file=None,
                message=str(e)
            ))
    
    return results

@app.get("/score/{application_id}", response_model=ScoreResponse)
async def get_score(application_id: int):
    """
    Récupère le score d'une candidature
    """
    try:
        application = get_job_application(application_id)
        if not application:
            raise HTTPException(status_code=404, detail=f"Candidature #{application_id} non trouvée")
        
        candidate = get_candidate(application['candidate_id'])
        job_offer = get_job_offer(application['job_id'])
        
        score = application.get('match_score')
        
        return ScoreResponse(
            application_id=application_id,
            score=score,
            candidate_name=candidate['full_name'] if candidate else None,
            job_title=job_offer['title'] if job_offer else None,
            message=f"Score: {score}/100" if score is not None else "Non analysé"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/applications")
async def list_applications(limit: int = 100, offset: int = 0):
    """
    Liste toutes les candidatures
    """
    try:
        applications = list_all_applications(limit, offset)
        return {
            "success": True,
            "count": len(applications),
            "applications": applications
        }
    except Exception as e:
        logger.error(f"Erreur liste candidatures: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report/{application_id}")
async def download_report(application_id: int):
    """
    Télécharge le rapport d'analyse d'une candidature
    """
    try:
        # Chercher le rapport le plus récent
        reports = list(REPORTS_DIR.glob(f"report_{application_id}_*.txt"))
        
        if not reports:
            raise HTTPException(status_code=404, detail=f"Aucun rapport trouvé pour la candidature #{application_id}")
        
        # Prendre le rapport le plus récent
        latest_report = max(reports, key=lambda p: p.stat().st_mtime)
        
        return FileResponse(
            path=latest_report,
            filename=latest_report.name,
            media_type="text/plain"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur téléchargement rapport: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/text")
async def analyze_text(request: ResumeAnalysisRequest):
    """
    Analyse directe à partir de texte (sans base de données)
    """
    try:
        result, score = analyze_resume(
            request.job_description,
            request.resume_text,
            request.candidate_name,
            request.job_title
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Erreur lors de l'analyse")
        
        return JSONResponse(content={
            "success": True,
            "score": score,
            "report": result,
            "message": f"Analyse terminée. Score: {score}/100"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur analyse texte: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# POINT D'ENTRÉE
# =========================

def main():
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()