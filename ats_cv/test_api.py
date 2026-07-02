import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test l'endpoint health"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health check:", response.json())

def test_analyze_text():
    """Test l'analyse directe par texte"""
    data = {
        "resume_text": """
        Ingénieur logiciel avec 5 ans d'expérience en Python et Java.
        Diplômé de l'École Polytechnique.
        Expert en développement web et bases de données.
        """,
        "job_description": """
        Développeur Full Stack
        Compétences: Python, JavaScript, React, Node.js
        Expérience requise: 3-5 ans
        """,
        "candidate_name": "Jean Dupont",
        "job_title": "Développeur Full Stack"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/text", json=data)
    print("Analyse texte:", response.json())

def test_get_applications():
    """Test la liste des candidatures"""
    response = requests.get(f"{BASE_URL}/applications?limit=10")
    print("Applications:", response.json())

def test_get_score(application_id):
    """Test la récupération d'un score"""
    response = requests.get(f"{BASE_URL}/score/{application_id}")
    print(f"Score candidature {application_id}:", response.json())

def test_analyze_application(application_id):
    """Test l'analyse d'une candidature existante"""
    data = {"application_id": application_id}
    response = requests.post(f"{BASE_URL}/analyze/application", json=data)
    print("Analyse candidature:", response.json())

if __name__ == "__main__":
    print("=== Test API ATS Analyzer ===\n")
    
    test_health()
    print("\n" + "="*50 + "\n")
    
    test_analyze_text()
    print("\n" + "="*50 + "\n")
    
    test_get_applications()
    print("\n" + "="*50 + "\n")
    
    # Remplacer par un ID réel
    # test_get_score(1)
    # test_analyze_application(1)