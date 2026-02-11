import os
import requests
import uuid
import time
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
API_KEY = os.getenv("ADZUNA_API_KEY")

# 추출할 핵심 기술 스택 리스트
SKILL_KEYWORDS = [
    "Python", "SQL", "Excel", "Tableau", "Power BI", "R", "SAS", 
    "VBA", "TypeScript", "React", "Node.js", "AWS", "Azure", 
    "Project Management", "Agile", "Scrum", "Stakeholder Management", 
    "Data Visualisation", "Reporting", "FinTech", "CRM", "Salesforce", 
    "Compliance", "Risk Management", "Operations", "Strategy"
]

def extract_skills(title, description):
    combined_text = (title + " " + (description or "")).lower()
    found_skills = []
    for skill in SKILL_KEYWORDS:
        if skill.lower() in combined_text:
            found_skills.append(skill)
    return list(set(found_skills))

def fetch_uk_jobs():
    search_queries = [
        "Business Analyst", "Data Analyst", "Product Analyst", 
        "Systems Analyst", "Business Intelligence", "Operations Manager",
        "Business Operations", "Product Operations", "Business Process Analyst"
    ]
    
    target_locations = ["London", "Manchester", "Remote"]
    all_jobs = []

    for query in search_queries:
        for loc in target_locations:
            print(f"📡 수집 중: '{query}' in {loc}...")
            url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
            
            # Adzuna API 규칙 대응: Remote일 땐 what 쿼리에 포함하여 검색 (가장 안정적)
            if loc == "Remote":
                params = {
                    'app_id': APP_ID,
                    'app_key': API_KEY,
                    'what': f"{query} remote", 
                    'results_per_page': 30
                }
            else:
                params = {
                    'app_id': APP_ID,
                    'app_key': API_KEY,
                    'what': query,
                    'where': loc,
                    'results_per_page': 30
                }
            
            try:
                # Rate Limit 방지를 위해 1초 대기
                time.sleep(1) 
                
                r = requests.get(url, params=params)
                
                if r.status_code != 200:
                    print(f"⚠️ {query}/{loc} 건너뜀 (상태코드: {r.status_code})")
                    continue
                    
                jobs = r.json().get('results', [])
                
                for j in jobs:
                    full_title = j.get('title', '')
                    title_lower = full_title.lower()
                    description = j.get('description', '')
                    
                    # 러버블 스타일 정밀 카테고리 분류
                    if "business process" in title_lower:
                        category = "Business Process Analyst"
                    elif "system" in title_lower and "analyst" in title_lower:
                        category = "System Analyst"
                    elif "product" in title_lower and "analyst" in title_lower:
                        category = "Product Analyst"
                    elif "data" in title_lower and "analyst" in title_lower:
                        category = "Product Analyst"
                    elif "it" in title_lower and "operat" in title_lower:
                        category = "IT Operations"
                    elif "product" in title_lower and "operat" in title_lower:
                        category = "Business Operations"
                    elif "business" in title_lower and "operat" in title_lower:
                        category = "Business Operations"
                    elif "business analyst" in title_lower or "bi " in title_lower or "intelligence" in title_lower:
                        category = "Business Analyst"
                    else:
                        category = "Others"
                    
                    skills = extract_skills(full_title, description)
                    raw_location = j.get('location', {}).get('display_name', '')
                    location_detail = "Remote" if loc == "Remote" else raw_location
                    
                    all_jobs.append({
                        "id": str(uuid.uuid4()),
                        "date": j.get('created')[:10],
                        "role": full_title,
                        "region": "United Kingdom" if loc == "Remote" else loc,
                        "platform": "Adzuna",
                        "job_title": full_title,
                        "description": description,
                        "company_name": j.get('company', {}).get('display_name'),
                        "location_detail": location_detail,
                        "salary_min": j.get('salary_min'),
                        "salary_max": j.get('salary_max'),
                        "contract_type": j.get('contract_type'),
                        "category": category,
                        "skills": skills,
                        "keyword_hits": skills,
                        "redirect_url": j.get('redirect_url'),
                        "captured_at": datetime.now().isoformat(),
                        "latitude": j.get('latitude'),
                        "longitude": j.get('longitude')
                    })
            except Exception as e:
                print(f"❌ {query}/{loc} 오류 발생: {e}")

    return all_jobs

if __name__ == "__main__":
    # 1. 공고 수집 시작
    jobs = fetch_uk_jobs()
    print(f"✅ 총 {len(jobs)}개의 공고를 수집했습니다.")

    if jobs:
        # 2. .env에서 필요한 정보 가져오기
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") 
        
        # REST API 주소 설정
        TABLE_URL = f"{url}/rest/v1/snapshots"
        
        print("🚀 Supabase REST API로 데이터를 직접 전송합니다...")
        
        try:
            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal" 
            }
            
            # 수집한 공고 목록을 전송
            response = requests.post(TABLE_URL, headers=headers, data=json.dumps(jobs))
            
            if response.status_code in [200, 201]:
                print(f"🎉 전송 성공! {len(jobs)}개의 데이터가 DB에 직접 저장되었습니다.")
            else:
                print(f"❌ 전송 실패: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ 전송 오류 발생: {e}")
    else:
        print("⚠️ 수집된 공고가 없어 작업을 중단합니다.")