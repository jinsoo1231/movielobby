# 스포일러 방지 및 페이징 기능 구현 계획

스포일러 방지 기능(데이터베이스 추가 포함)과 게시판 페이징 처리를 위한 설계도입니다. 두 기능 모두 주요 기능이므로 꼼꼼하게 적용하겠습니다.

## 🚨 User Review Required
이 작업은 **데이터베이스 구조 변경**을 수반합니다. Supabase의 `talk_posts` 테이블에 `is_spoiler`라는 컬럼을 새로 추가해야 합니다.
제가 제공해 드리는 SQL 명령어를 Supabase SQL Editor에서 실행해주셔야 스포일러 기능이 정상 작동합니다.

## Proposed Changes

### 1. Database
- **Supabase SQL 스크립트 작성**: `talk_posts` 테이블에 `is_spoiler BOOLEAN DEFAULT FALSE` 컬럼을 추가하는 쿼리를 제공해 드립니다.

---

### 2. UI Components & Pages

#### [MODIFY] [app/talks/[movieId]/write/page.tsx](file:///c:/movielobby/app/talks/%5BmovieId%5D/write/page.tsx)
- 스포일러 여부를 체크할 수 있는 체크박스 UI 추가.
- `insert` 시 `is_spoiler` 값을 함께 저장하도록 로직 수정.

#### [MODIFY] [app/talks/[movieId]/page.tsx](file:///c:/movielobby/app/talks/%5BmovieId%5D/page.tsx)
- URL의 `page` 파라미터를 읽어와서 Supabase `.range()`를 사용한 페이징 처리 로직 구현 (한 페이지당 15개).
- 게시판 하단에 페이지 번호(1, 2, 3...) 및 이전/다음 이동 버튼 UI 추가.
- 게시글 목록 렌더링 시, 스포일러 글이면 제목 옆에 🚨 `[스포일러]` 뱃지 추가.

#### [MODIFY] [app/talks/[movieId]/[postId]/page.tsx](file:///c:/movielobby/app/talks/%5BmovieId%5D/%5BpostId%5D/page.tsx)
- 게시글 상세 화면 진입 시, `is_spoiler`가 `true`일 경우 본문을 블러(Blur) 처리.
- "스포일러 보기" 버튼을 눌러야만 내용을 확인할 수 있도록 인터랙티브 클라이언트 상태(`useState`) 추가.

#### [MODIFY] [app/talks/page.tsx](file:///c:/movielobby/app/talks/page.tsx)
- 실시간 최신 글 목록에서도 스포일러 글일 경우 제목 옆에 🚨 `[스포일러]` 뱃지가 보이도록 수정.

## Verification Plan

### Manual Verification
1. 데이터베이스 쿼리를 성공적으로 실행했는지 확인합니다.
2. 새 글 쓰기 화면에서 스포일러 체크박스를 누르고 글을 작성해 봅니다.
3. 게시판 목록에서 해당 글에 `[스포일러]` 뱃지가 제대로 뜨는지 확인합니다.
4. 해당 글을 클릭했을 때 내용이 가려져 있고 버튼을 눌러야 보이는지 테스트합니다.
5. 게시글 개수를 늘려 페이징 1, 2, 3 버튼이 정상 작동하는지 확인합니다.
