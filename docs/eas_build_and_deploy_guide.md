# 🚀 PC 이동 및 구글 스토어 배포 (EAS Build) 가이드

이 문서는 다른 PC에서 프로젝트를 이어서 작업할 때 필요한 **환경 복원 방법**과, 최근 추가된 네이티브 패키지(GPS, Map)를 반영하기 위해 **구글 플레이 콘솔에 새로운 빌드(.aab)를 업로드하는 절차**를 기록한 가이드입니다. 
(AI 에이전트가 이 문서를 읽고 즉시 후속 작업을 진행할 수 있도록 작성되었습니다.)

---

## 1부: 다른 PC에서 환경 복원하기 (Environment Restoration)

새로운 PC에서 프로젝트를 클론(Clone)한 직후, 아래 절차를 통해 개발 환경을 완벽하게 복원해야 합니다.

1. **프로젝트 클론 및 패키지 설치**
   ```bash
   git clone https://github.com/jinsoo1231/movielobby.git
   cd movielobby
   npm install          # 웹 루트 패키지 설치
   cd mobile
   npm install          # 모바일 패키지 설치
   ```

2. **환경 변수(`.env.local`) 복구 (중요 ⭐️)**
   깃허브에는 보안상 `.env.local` 파일이 업로드되지 않습니다. 기존 PC에 있던 키 값들을 메모장에 백업해 두었다가, 새 PC의 **루트 폴더(`\`)**와 **모바일 폴더(`\mobile`)**에 각각 `.env.local` 파일을 만들고 아래 양식에 맞게 키를 채워 넣어야 합니다.

   **[루트 폴더(`.env.local`)]**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=당신의_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=당신의_SUPABASE_ANON_KEY
   NEXT_PUBLIC_TMDB_TOKEN=당신의_TMDB_토큰
   ```

   **[모바일 폴더(`mobile/.env.local`)]**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=당신의_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY=당신의_SUPABASE_ANON_KEY
   EXPO_PUBLIC_TMDB_TOKEN=당신의_TMDB_토큰
   EXPO_PUBLIC_KAKAO_REST_API_KEY=당신의_카카오_REST_API_키
   ```

---

## 2부: EAS 빌드 및 구글 플레이 콘솔 업데이트 (Next Step)

`expo-location` 등 모바일 기기의 네이티브(Native) 권한을 직접 건드리는 패키지가 추가되었으므로, 새 `.aab` 파일을 뽑아서 구글 콘솔에 재업로드해야 합니다. AI 에이전트는 다음 세션에서 이 과정을 주도하여 진행해야 합니다.

### 단계 1. 앱 버전 올리기 (Version Bump)
`mobile/app.json` 파일에서 기존 구글 콘솔에 올라가 있는 버전보다 높게 숫자를 올립니다.
- `version`을 "1.0.1" 등으로 수정
- `android.versionCode`를 기존(아마 1)에서 **2**로 수정

### 단계 2. 안드로이드 릴리스 빌드 추출 (EAS Build)
터미널(`cd mobile`)에서 아래 명령어를 실행하여 새로운 `.aab` 파일을 추출합니다.
```bash
eas build -p android --profile production
```
(빌드가 완료되면 링크를 통해 `.aab` 파일을 PC로 다운로드 받습니다.)

### 단계 3. 구글 플레이 콘솔 업로드 (Play Console)
1. 구글 플레이 콘솔 접속 -> [비공개 테스트] -> [새 버전 만들기]
2. 다운받은 `.aab` 파일을 업로드.
3. 출시 노트에 **"내 주변 영화관 검색 기능 추가 (GPS 연동)"** 작성 후 저장.

### 단계 4. 데이터 보안 (Data Safety) 설문 갱신 (중요 ⭐️)
이번 업데이트로 앱에 **GPS 위치 정보(LOCATION)** 권한이 추가되었습니다. 따라서 구글 심사를 통과하려면 설문을 갱신해야 합니다.
1. 좌측 메뉴 제일 하단 **[앱 콘텐츠]** -> **[데이터 보안]** 클릭.
2. 수집하는 데이터 유형에서 **[위치] -> [대략적인 위치] & [정확한 위치]** 체크.
3. 사용 목적을 **"앱 기능 (주변 상영관 검색)"**으로 체크 후 저장 및 최종 심사 제출.

---

**🤖 AI 에이전트 행동 지침 (Action Item):**
> 사용자가 다음 세션에서 *"문서 확인하고 스토어 업로드 진행해 줘"* 라고 요청하면, 즉시 이 문서의 **[2부: 단계 1]**부터 순차적으로 실행 및 가이드할 것.
