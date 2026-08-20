# MovieLobby 모바일 앱 정식 런칭 플랜 (App Store & Google Play)

이 문서는 Expo React Native로 개발된 MovieLobby 모바일 앱(1차 테스트 완료 버전)을 향후 양대 앱 마켓(Apple App Store, Google Play Store)에 정식으로 배포하기 위한 전체 로드맵 및 가이드라인입니다.

---

## 1. 사전 준비 작업 (Pre-requisites)

### 1-1. 앱 마켓 개발자 계정 등록
앱을 마켓에 올리기 위해서는 각 플랫폼의 개발자 계정이 필수입니다.
- **Apple Developer Program (iOS)**: 연회비 약 99달러. [가입 링크](https://developer.apple.com/programs/)
- **Google Play Console (Android)**: 평생 1회 가입비 25달러. [가입 링크](https://play.google.com/console/signup)

### 1-2. 앱 정보 및 에셋 준비
마켓 심사 및 스토어 등록을 위해 다음 자산들이 미리 준비되어야 합니다.
- **앱 아이콘 (App Icon)**: 1024x1024 해상도의 PNG 파일 (투명도 없는 단색 배경 권장)
- **스플래시 스크린 (Splash Screen)**: 앱 로딩 시 나타나는 화면 (로고 이미지, 배경색)
- **스크린샷**: 아이폰 및 안드로이드 기기별 주요 화면 스크린샷 3~5장
- **앱 정보**: 앱 이름(MovieLobby), 짧은 설명, 긴 설명, 개인정보 처리방침(Privacy Policy) URL

---

## 2. Expo 프로젝트 설정 (app.json)

빌드 전 `mobile/app.json` 파일에 앱의 고유 정보와 버전, 에셋 경로를 세팅해야 합니다.

```json
{
  "expo": {
    "name": "MovieLobby",
    "slug": "movielobby",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0d253f"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.movielobby"
    },
    "android": {
      "package": "com.yourcompany.movielobby",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0d253f"
      }
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```
*주의: `bundleIdentifier`와 `package`는 전 세계에서 유일해야 합니다.*

---

## 3. EAS (Expo Application Services) 세팅 및 빌드

MovieLobby는 Expo 기반 앱이므로, Expo에서 제공하는 클라우드 빌드 시스템인 **EAS Build**를 사용하는 것이 가장 빠르고 안정적입니다.

### 3-1. EAS CLI 설치 및 로그인
터미널에서 EAS 도구를 설치하고 로그인합니다.
```bash
npm install -g eas-cli
eas login
```

### 3-2. EAS 프로젝트 초기화
```bash
eas build:configure
```
명령어를 실행하여 `eas.json` 파일을 생성합니다.

### 3-3. 프로덕션 빌드 실행
스토어에 올리기 위한 정식(Production) 빌드 파일을 클라우드에서 생성합니다.

**안드로이드 (AAB 파일 빌드)**:
```bash
eas build --platform android --profile production
```
- 안드로이드용 키스토어(Keystore)를 자동 생성할 것인지 묻습니다. `Y`를 눌러 Expo가 관리하도록 위임합니다.

**iOS (IPA 파일 빌드)**:
```bash
eas build --platform ios --profile production
```
- Apple ID 로그인이 요구되며, 인증서(Certificate)와 프로비저닝 프로파일을 자동 생성할 것인지 묻습니다. `Y`를 눌러 진행합니다.

---

## 4. 앱 스토어 심사 제출 (EAS Submit)

빌드가 완료되면 `.aab` (Android) 파일과 `.ipa` (iOS) 파일이 생성됩니다. 이를 각 스토어 콘솔에 업로드해야 합니다. EAS Submit을 사용하면 터미널에서 바로 업로드할 수 있습니다.

### 4-1. iOS (App Store Connect) 제출
```bash
eas submit -p ios
```
- App Store Connect 앱 레코드가 없다면 터미널 창에서 바로 자동 생성할 수 있습니다.
- 업로드 완료 후 [App Store Connect](https://appstoreconnect.apple.com/) 웹사이트에 접속하여, 스크린샷과 앱 설명을 기입한 뒤 **심사 제출(Submit for Review)** 버튼을 누릅니다.

### 4-2. Android (Google Play Console) 제출
```bash
eas submit -p android
```
- *단, 안드로이드는 최초 1회는 구글 플레이 콘솔 웹사이트에 접속해서 앱을 수동으로 생성하고 AAB 파일을 첫 업로드해야 합니다. 두 번째 업데이트부터는 위 명령어로 자동화 가능합니다.*
- 업로드 완료 후 스크린샷, 텍스트 정보를 입력하고 **프로덕션 트랙(Production Track)으로 출시** 버튼을 누릅니다.

---

## 5. 심사 통과 및 정식 출시

- **심사 기간**: iOS는 보통 24~48시간, 안드로이드는 신규 계정일 경우 2~7일 정도 소요될 수 있습니다.
- **리젝(Reject) 대응**: 심사 과정에서 튕기는 경우(리젝), 마켓에서 알려주는 사유(예: 유튜브 재생 시 백그라운드 오디오 문제, 로그인 시 계정 삭제 버튼 부재 등)를 수정하여 다시 빌드 후 제출해야 합니다.

### (참고) 심사를 위한 필수 요건 가이드
1. **소셜 로그인 기능**: 애플은 Google/Kakao 로그인이 있다면 반드시 **Apple 로그인(Sign in with Apple)**도 함께 제공해야 심사를 통과시켜 주는 깐깐한 정책이 있습니다. (현재 이메일 로그인이 있으므로 넘어갈 확률도 있으나 주의가 필요합니다.)
2. **계정 탈퇴 기능**: 앱 내에서 생성한 계정은 반드시 앱 내에서 즉시 삭제할 수 있는 '탈퇴' 버튼이 명시적으로 존재해야 심사를 통과합니다. (마이페이지에 향후 추가 필요)

---
*본 문서는 MovieLobby 모바일 앱 v1의 안정적인 배포를 위한 기초 로드맵이며, 추후 기능이 고도화됨에 따라 지속적으로 업데이트되어야 합니다.*
