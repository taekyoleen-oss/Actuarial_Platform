# Microsoft Graph 연동 설정 — /datalab "내 OneDrive에서 Web-Excel 열기"

방문자가 게시된 엑셀 워크북의 **사본을 본인 OneDrive에 저장한 뒤 Excel 웹(Web-Excel)에서 바로 여는** 기능의 1회성 설정 가이드입니다. 코드는 이미 배포되어 있으며, 아래 클라이언트 ID만 등록하면 버튼이 활성화됩니다(미설정 시 버튼 비활성 + 다운로드 안내 폴백).

## 아키텍처 요약

- 브라우저(SPA)에서 MSAL PKCE 로그인 → `Files.ReadWrite` 위임 권한 토큰 획득
  - **PC: 팝업**(loginPopup + redirect-bridge)
  - **모바일: 전체 페이지 리디렉션**(loginRedirect) — 모바일 브라우저는 팝업을 차단하거나 새 탭으로 분리해 팝업 흐름이 구조적으로 실패하므로(2026-07-14 수정), UA 기반 `isMobileBrowser()`로 분기
- 게시 파일(Supabase Storage 공개 URL)을 브라우저가 fetch → Graph API로 **방문자 본인 OneDrive**의 `DataLab/` 폴더에 업로드(동일 이름은 자동 개명, 4MB 초과는 업로드 세션 청크)
- 반환된 `webUrl`을 새 탭으로 열면 Excel 웹에서 편집 시작(모바일·리디렉션 복귀 직후는 사용자 제스처가 없어 자동 새 창이 차단되므로 "지금 열기" 링크로 안내)
- **서버·시크릿 없음**: 클라이언트 ID는 공개값(SPA PKCE), 게시본은 절대 변경되지 않음

### 모바일 리디렉션 흐름 (2026-07-14)

1. 버튼 탭 → 기존 세션 silent 갱신 시도, 실패 시 `sessionStorage`에 보류 컨텍스트(`datalab:webexcel:pending` = 게시물 fileUrl, TTL 10분) 저장 후 `loginRedirect` — 페이지 전체가 Microsoft 로그인으로 이동
2. 로그인 완료 → Entra가 `{origin}/msal-redirect.html`(기존 등록 URI 그대로 — **추가 Entra 등록 불필요**)로 복귀
3. 리디렉션 페이지가 톱레벨 방문임을 감지(`window.opener`/`parent` 부재) → 본창과 동일 설정(`buildMsalConfig`)의 PCA로 `handleRedirectPromise()` 실행 → msal이 응답 해시를 임시 캐시에 저장하고 로그인을 시작한 게시물 페이지로 자동 복귀(navigateToLoginRequestUrl 기본값)
4. 게시물 페이지의 ExcelLaunchPanel이 보류 컨텍스트를 발견 → `completeRedirectLogin()`으로 토큰 회수 → 업로드 자동 재개 → 완료 후 "Excel 웹에서 지금 열기" 링크 표시
- 같은 리디렉션 페이지가 팝업(PC)일 때는 기존처럼 redirect-bridge(`broadcastResponseToMainFrame`)를 실행 — 두 흐름 공존

## 설정 절차 (약 5분, 무료)

1. https://entra.microsoft.com 접속 → Microsoft 계정(taekyoleen@gmail.com 등)으로 로그인
   - 개인 계정이면 "Microsoft Entra ID 무료 테넌트"가 자동 생성됩니다.
2. **App registrations → New registration**
   - Name: `AI4Insurance DataLab Excel`
   - Supported account types: **"Accounts in any organizational directory and personal Microsoft accounts"** (개인+조직 모두 — 필수)
   - Redirect URI: 플랫폼 **SPA(Single-page application)** 선택 후 `https://www.ai4insurance.com/msal-redirect.html` 입력
3. 등록 후 **Authentication → Single-page application**에 리디렉션 URI 추가:
   - `http://localhost:3000/msal-redirect.html` (로컬 개발용)
   - (프리뷰 도메인에서도 쓰려면 해당 Vercel 도메인 + `/msal-redirect.html` 추가)
   - `/msal-redirect.html`은 팝업 전용 리디렉션 페이지(app/msal-redirect 라우트를 rewrite로 서빙) — msal-browser v5의 `broadcastResponseToMainFrame()`(redirect-bridge)를 실행해 인증 응답을 본창에 송신하고 팝업을 자동으로 닫는다. 이 코드가 실행되지 않는 페이지(정적 빈 HTML 등)를 리디렉션 URI로 쓰면 본창이 `timed_out`으로 실패한다. **경로까지 정확히 일치**해야 하며, 도메인 루트만 등록하면 AADSTS50011(redirect mismatch)이 발생한다.
4. **API permissions** 확인: `Microsoft Graph → Delegated → Files.ReadWrite`가 없으면 추가 (User.Read는 기본 포함). **Admin consent 불필요** — 사용자 본인 동의 흐름.
5. **Overview → Application (client) ID** 복사
6. 환경변수 등록:
   - 로컬: `.env`에 `NEXT_PUBLIC_MS_GRAPH_CLIENT_ID=<복사한 ID>`
   - Vercel: Project → Settings → Environment Variables에 동일 키 추가 후 재배포
     (NEXT_PUBLIC_ 변수는 빌드 시 인라인되므로 **재배포 필수**)

## 확인 방법

1. `/datalab/<게시물>` 상세 → "Excel로 직접 작업하기" 패널의 "내 OneDrive에서 Web-Excel 열기" 버튼이 활성화되어 있는지 확인
2. 클릭 → Microsoft 로그인 팝업 → 진행 상태(로그인 → 파일 준비 → 사본 저장 %) → Excel 웹 새 탭
3. 본인 OneDrive의 `DataLab/` 폴더에 사본이 생성되었는지 확인

## 주의·제약

| 항목 | 내용 |
|------|------|
| 클라이언트 ID | 시크릿 아님(SPA PKCE 공개값). 단, 리디렉션 URI가 우리 도메인으로 제한되어 있어 타 사이트에서 도용 불가 |
| VBA | Excel 웹에서는 실행 불가(사용자 고지 문구에 포함됨) — 데스크톱용 다운로드 병행 제공 |
| Python in Excel | M365 구독 계정에서 웹 사용 가능(기본 컴퓨트 포함, 프리미엄은 애드온) |
| 편집 결과 | 방문자 본인 OneDrive 사본에만 저장. 게시본 갱신은 기존 관리자 절차(웹 편집기 또는 datalab-publisher)로 별도 진행 |
| 파일 크기 | 업로드 세션 구현으로 수십 MB도 지원. Excel 웹 열람 한도는 100MB |
