# 추천/비추천 중복 방지 시스템 데이터베이스 셋업 가이드

사용자 1명당 게시글, 리뷰, 댓글에 1번씩만 추천/비추천을 누를 수 있도록 기록하는 `vote_logs` 테이블을 생성합니다.

Supabase 대시보드 ➔ **SQL Editor** 메뉴로 들어간 뒤, 새로운 쿼리(+ New query)에 아래 코드를 복사하여 붙여넣고 **RUN** 버튼을 눌러 실행해 주세요!

```sql
-- 1. vote_logs (중복 투표 방지 기록 테이블) 생성
CREATE TABLE IF NOT EXISTS vote_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,               -- 로그인 유저의 고유 ID (auth.users)
    target_type TEXT NOT NULL,           -- 대상 유형 ('post' | 'review' | 'comment')
    target_id TEXT NOT NULL,             -- 대상의 고유 ID (게시글 ID, 리뷰 ID 등)
    vote_type TEXT NOT NULL,             -- 'like' (추천) 또는 'dislike' (비추천)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, target_type, target_id) -- 유저 1명당 대상 1개에 대해 단 1번만 기록 가능하도록 제약
);

-- 2. RLS 비활성화 (누구나 안전하게 API를 통해 읽고 쓸 수 있도록 설정)
ALTER TABLE vote_logs DISABLE ROW LEVEL SECURITY;
```

> [!TIP]
> 코드를 실행하신 후 좌측 `Table Editor` 메뉴에 `vote_logs` 테이블이 잘 생성되었는지 확인해 주세요!
