# collector/adzuna_fetcher.py
import os
import requests
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
API_KEY = os.getenv("ADZUNA_API_KEY")

def fetch_uk_jobs():
    # 검색할 핵심 키워드 (Operation으로 검색하면 Operations도 포함됨)
    keywords = ["Analyst", "Operation"] 
    # 필터를 깔끔하게 유지하기 위해 주요 도시 3곳만 타겟팅
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
                    # UI 필터 그룹화: 제목에 Analyst가 있으면 Analyst, 아니면 Operations
                    category = "Analyst" if "analyst" in title.lower() else "Operations"
                    
                    all_jobs.append({
                        "id": str(uuid.uuid4()),
                        "date": j.get('created')[:10], # "2026-02-11" 형식으로 잘라서 날짜 중복 방지
                        "role": title,
                        "region": loc,                # UI 필터를 위해 입력값(London 등)으로 고정
                        "platform": "Adzuna",
                        "job_title": title,
                        "description": j.get('description'),
                        "company_name": j.get('company', {}).get('display_name'),
                        "location_detail": j.get('location', {}).get('display_name'),
                        "salary_min": j.get('salary_min'),
                        "salary_max": j.get('salary_max'),
                        "contract_type": j.get('contract_type'),
                        "category": category,
                        "redirect_url": j.get('redirect_url'),
                        "captured_at": datetime.now().isoformat(),
                        "latitude": j.get('latitude'),
                        "longitude": j.get('longitude')
                    })
            except Exception as e:
                print(f"❌ {keyword}/{loc} 실패: {e}")

    return all_jobs