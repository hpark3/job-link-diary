import requests
import os
from dotenv import load_dotenv

# .env 파일에서 설정 로드
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def push_snapshots(snapshots):
    # Supabase REST API 경로 설정 (테이블 이름: snapshots)
    endpoint = f"{SUPABASE_URL}/rest/v1/snapshots"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"  # 전송 후 전체 데이터를 다시 받지 않음 (속도 향상)
    }

    print(f"📡 Sending data directly to your Supabase: {endpoint}")
    
    # 데이터 전송
    r = requests.post(
        endpoint,
        json=snapshots,
        headers=headers,
        timeout=30
    )

    # 201(Created) 또는 200(OK)일 때 성공
    if r.status_code not in [200, 201]:
        raise Exception(f"❌ Error {r.status_code}: {r.text}")

    print(f"✅ Uploaded {len(snapshots)} jobs to your private Supabase successfully!")