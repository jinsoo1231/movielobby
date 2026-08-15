# Talks 게시판 데이터베이스 셋업 가이드

Supabase 대시보드에 접속하셔서 **SQL Editor** 메뉴로 들어간 뒤, 새로운 쿼리(+ New query)를 열고 아래 코드를 전체 복사해서 붙여넣고 실행(RUN)해 주세요!

```sql
-- 1. talk_posts (게시글) 테이블 생성
CREATE TABLE talk_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id INT NOT NULL,
    movie_title TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. talk_comments (댓글) 테이블 생성
CREATE TABLE talk_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES talk_posts(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 테이블 및 권한 설정 (로그인 없이 누구나 읽고 쓸 수 있도록 RLS 비활성화)
ALTER TABLE talk_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE talk_comments DISABLE ROW LEVEL SECURITY;
```

> [!TIP]
> 코드를 실행하신 후 좌측 `Table Editor` 메뉴로 가셔서 `talk_posts`와 `talk_comments` 테이블이 정상적으로 만들어졌는지 확인해 주세요!
