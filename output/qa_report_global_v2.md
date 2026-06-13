# QA 리포트 — 홈 입체화 + 해외 자료 네이티브 전환 + 일본 FSA 지식베이스화 (2026-06-13)

## 1. 데이터 무결성
- **FSA 원문 무손실**: `cases.html` DATA → `data/japan-fsa/cases.json` deep-equal 통과 (`_workspace/verify_fsa_data.mjs`). 15개 호·135건, id 유일, 텍스트 byte-equal.
- **인리치먼트 커버리지 100%** (`_workspace/verify_enrichment.mjs`): 전 135건 tldr·themes·kr.note 존재. theme(13)·term(glossary 91)·kbRef(KB 26) 참조 무결, keyPhrase 본문 부분문자열 일치.
  - 수정: 오기입 `third-sector` kbRef 4건 제거, 누락 용어 `자율주행` 용어집 추가(91종).

## 2. 빌드·타입
- `tsc --noEmit` 통과. `npm run build` 성공.
- 라우트: `/global`(Static), `/global/japan-fsa`(132kB Static), `/global/japan-life`, `/global/japan-life-trends`(Static), `/global/[slug]`(레거시 4종 redirect).

## 3. 런타임 스모크 (프로덕션 :3199, Playwright, 콘솔 에러 0)
- HTTP 200: `/`,`/global`,`/global/japan-fsa`,`/global/japan-life`,`/global/japan-life-trends`. `/global/japan-fsa-cases`→307→`/global/japan-fsa`.
- FSA 상세: 한줄핵심→❶신청→❷판단→❸배경→KOREA 한국에서는(note+KB아코디언+규정배지)→용어→관련사례. keyPhrase 하이라이트·용어 팝오버 동작.
- 동향: SVG 34·막대 495·꺾은선 27·표 21 서버 렌더, 스티키 TOC 활성화.
- 변천: 타임라인·파산표 렌더.

## 4. 후속
- 정적+코드 모두 배포 필요(Vercel). 레거시 `public/global/*.html` 보존(딥링크). DB 변경 없음(코드에서 viewer 마커→네이티브 경로 매핑).
