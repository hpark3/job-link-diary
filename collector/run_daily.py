# collector/run_daily.py 수정본
from adzuna_fetcher import fetch_uk_jobs
from supabase_push import push_snapshots

def main():
    # 1. Adzuna에서 진짜 영국 데이터 가져오기
    # 이제 인자(키워드, 지역)를 넣지 않고 그냥 호출합니다. 
    # (이미 adzuna_fetcher 내부에서 알아서 다 돌게 짜여 있습니다.)
    real_jobs = fetch_uk_jobs()
        
    if real_jobs:
        # 2. Supabase로 전송
        push_snapshots(real_jobs)
    else:
        print("공고가 없어 전송을 취소합니다.")

if __name__ == "__main__":
    main()