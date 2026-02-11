import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# 데이터가 전송될 Supabase Edge Function 주소
INGEST_ENDPOINT = f"{SUPABASE_URL}/functions/v1/ingest-jobs"

# 분석용 기준 위치 (Crystal Palace)
HOME_LAT = 51.4184
HOME_LNG = -0.0721