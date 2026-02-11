import os
import requests
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
API_KEY = os.getenv("ADZUNA_API_KEY")

# 추출할 핵심 기술 스택 리스트 (Analyst & Operations 타겟)
SKILL_KEYWORDS = [
    "Python", "SQL", "Excel", "Tableau", "Power BI", "R", "SAS", 
    "VBA", "TypeScript", "React", "Node.js", "AWS", "Azure", 
    "Project Management", "Agile", "Scrum", "Stakeholder Management", 
    "Data Visualisation", "Reporting", "FinTech", "CRM", "Salesforce", 
    "Compliance", "Risk Management", "Operations", "Strategy"
]

def extract_skills(title, description):
    """제목과 본문에서 키워드를 매칭하여 리스트로 반환"""
    combined_text = (title + " " + (description or "")).lower()
    found_skills = []
    
    for skill in SKILL_KEYWORDS:
        # 키워드가 텍스트에 포함되어 있는지 확인 (소문자로 비교)
        if skill.lower() in combined_text:
            found_skills.append(skill)
            
    # 중복 제거 및 반환
    return list(set(found_skills))

def fetch_uk_jobs():
    # 검색할 핵심 키워드
    keywords = ["Analyst", "Operation"] 
    # 주요 도시 3곳 타겟팅
    target_locations = ["London", "Manchester", "Remote"]
    
    all_jobs = []

    for keyword in keywords:
        for loc in target_locations:
            print(f"📡 수집 중: {keyword} in {loc}...")
            url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
            params = {
                'app_id': APP_ID,
                'app_key': API_KEY,
                'results_per_page': 20,
                'what': keyword,
                'where': loc,
                'content-type': 'application/json'
            }
            
            try:
                r = requests.get(url, params=params)
                r.raise_for_status()
                jobs = r.json().get('results', [])
                
                for j in jobs:
                    title = j.get('title', '')
                    description = j.get('description', '')
                    
                    # UI 필터 그룹화
                    category = "Analyst" if "analyst" in title.lower() else "Operations"
                    
                    # [핵심] 키워드 추출 실행
                    skills = extract_skills(title, description)
                    
                    all_jobs.append({
                        "id": str(uuid.uuid4()),
                        "date": j.get('created')[:10],
                        "role": title,
                        "region": loc,
                        "platform": "Adzuna",
                        "job_title": title,
                        "description": description,
                        "company_name": j.get('company', {}).get('display_name'),
                        "location_detail": j.get('location', {}).get('display_name'),
                        "salary_min": j.get('salary_min'),
                        "salary_max": j.get('salary_max'),
                        "contract_type": j.get('contract_type'),
                        "category": category,
                        "skills": skills,             # ⬅️ 추출된 스킬 추가
                        "keyword_hits": skills,       # ⬅️ UI 호환성을 위해 추가
                        "redirect_url": j.get('redirect_url'),
                        "captured_at": datetime.now().isoformat(),
                        "latitude": j.get('latitude'),
                        "longitude": j.get('longitude')
                    })
            except Exception as e:
                print(f"❌ {keyword}/{loc} 실패: {e}")

    return all_jobs