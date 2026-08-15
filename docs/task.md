# 스포일러 방지 및 페이징 기능 구현

- `[/]` 1. **Database Update**
  - `[ ]` Provide SQL query to the user
- `[/]` 2. **Write Post Page (`app/talks/[movieId]/write/page.tsx`)**
  - `[x]` Add spoiler checkbox UI
  - `[x]` Send `is_spoiler` to Supabase
- `[x]` 3. **Talks Board Page (`app/talks/[movieId]/page.tsx`)**
  - `[x]` Implement pagination logic (URL `?page=`, `offset`/`limit`)
  - `[x]` Add pagination UI buttons
  - `[x]` Add spoiler badge `[스포일러]` to post titles
- `[x]` 4. **Post Detail Page (`app/talks/[movieId]/[postId]/page.tsx`)**
  - `[x]` Check `is_spoiler`
  - `[x]` Blur content by default if spoiler
  - `[x]` Add "보기" (Show) button
- `[x]` 5. **Talks Main Page (`app/talks/page.tsx`)**
  - `[x]` Add spoiler badge `[스포일러]` to recent posts
