---
name: insurance-board-builder
description: "Insurance Insights Board(보험 정보 게시판) 빌드를 조율하는 에이전트 팀 오케스트레이터. DB 스키마·RLS·RPC, API·미들웨어, 페이지·컴포넌트(Tesla 테마), AI 요약 파이프라인을 db-architect/api-designer/ui-builder/ai-summarizer/qa-integrator 팀으로 구현한다. '게시판 만들어/빌드/구현', 'DB·RLS 생성', 'API 작성', 'UI·페이지 구현', '요약 기능' 요청 시 사용. 후속 작업: 결과 수정·보완, 부분 재실행(예: DB만 다시, API만 다시), 업데이트, 다시 실행, 이전 결과 기반 개선 요청 시에도 반드시 이 스킬을 사용. 단순 질문은 직접 응답."
---

# Insurance Board Builder — 에이전트 팀 오케스트레이터

`insurance-insights-board-design-v1.0.md`(내부 버전 v1.1) 기반으로 보험 정보 게시판을 빌드하는 팀을 조율한다.

## 실행 모드: 에이전트 팀

DB→API→UI/AI 의존성 조율과 경계면(API↔프론트) 교차 검증이 품질을 좌우하므로 에이전트 팀으로 구성한다. 리더(이 스킬)가 `TeamCreate`로 팀을 만들고, 팀원은 `SendMessage`·`TaskCreate`로 자체 조율한다. 모든 팀원 `model: "opus"`.

## 에이전트 구성

| 팀원 | 타입 | 역할 | 스킬 | 출력 |
|------|------|------|------|------|
| db-architect | general-purpose | 테이블·RLS·RPC·Storage·시드 | supabase-rls | `output/schema.sql`, `output/seed.sql`, `output/rls_tests.sql` |
| api-designer | general-purpose | Route Handler·Server Action·미들웨어 | — | `output/api_contract.json` + 코드 |
| ui-builder | general-purpose | 페이지·컴포넌트·Tesla 테마 | tweakcn-tesla-theme | `app/`·`components/` 코드 |
| ai-summarizer | general-purpose | 요약 파이프라인 | pdf-text-extract | 요약 로직 |
| qa-integrator | general-purpose | 경계면 교차 검증·RLS 테스트 | — | `output/qa_report.md` |

> 각 팀원의 역할·원칙·통신 프로토콜은 `.claude/agents/{name}.md`에 정의됨. 팀 생성 시 해당 정의가 페르소나가 된다.

## 워크플로우

### Phase 0: 컨텍스트 확인 (초기/후속 판별)
1. `output/` 와 `_workspace/` 존재 여부 확인
2. 분기:
   - 미존재 → **초기 실행**. Phase 1로.
   - 존재 + 부분 수정 요청("DB만 다시", "API 계약 수정") → **부분 재실행**. 해당 팀원만 구성/재호출, 수정 대상 산출물만 덮어쓴다. 이전 산출물 경로를 프롬프트에 포함.
   - 존재 + 새 입력 제공 → **새 실행**. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1.

### Phase 1: 준비
1. 설계서(v1.1) §2~§5와 사용자 요청 범위를 분석 — 이번 실행이 어느 마일스톤(DB/RLS / API / UI / 요약 / 전체)까지인지 확정.
2. `_workspace/` 생성, `output/` 확보.

### Phase 2: 팀 구성
`TeamCreate(team_name: "iib-team", members: [...])` — 이번 마일스톤에 필요한 팀원만 포함(예: DB/RLS 마일스톤이면 db-architect + qa-integrator). 각 멤버 `agent_type`은 `.claude/agents/` 커스텀 정의, `model: "opus"`.

`TaskCreate`로 작업 등록 + 의존성(`depends_on`):
- DB: 테이블·RLS·RPC·Storage·시드 (db-architect)
- API: 계약 + Route Handler + 미들웨어 (api-designer, depends_on DB)
- UI: 테마 + 페이지 + 컴포넌트 (ui-builder, depends_on API 계약)
- 요약: 파이프라인 (ai-summarizer, depends_on API+DB)
- QA: 각 모듈 완성 직후 교차 검증 (qa-integrator, 모듈별 depends_on)

### Phase 3: 빌드 (팀원 자체 조율)
- 팀원이 공유 작업 목록에서 작업을 claim하고 수행.
- **통신 규칙**: db-architect가 스키마 확정 → api-designer에 SendMessage. api-designer가 계약 확정 → ui-builder/ai-summarizer/qa-integrator에 SendMessage. qa-integrator는 모듈 완성 알림을 받으면 즉시 경계면 교차 검증 후 책임 에이전트에 환류.
- **산출물**: 구조화 산출물은 `output/`(스키마·계약·리포트), 중간물은 `_workspace/{phase}_{agent}_{artifact}`, 코드는 `app/`·`components/`·`lib/`.
- 리더는 `TaskGet`으로 진행률 모니터링, 막힌 팀원에 개입.

### Phase 4: 통합·검증
1. 모든 작업 완료 대기(`TaskGet`).
2. `qa-integrator`의 `output/qa_report.md` 수집 → 실패 항목은 책임 에이전트에 재작업 요청(최대 2회).
3. 빌드/타입 검증(가능 시 `npm run build`/`tsc`), DB는 `output/rls_tests.sql` 시나리오 점검.

### Phase 5: 정리
1. 팀원 종료(SendMessage) → `TeamDelete`.
2. `_workspace/` 보존(감사 추적).
3. 사용자에 결과 요약 + 후속 액션(예: "`output/schema.sql`을 Supabase SQL Editor에서 실행 필요") 보고.

## 데이터 흐름
```
[리더] TeamCreate
   db-architect → output/schema.sql ─┐
        │ SendMessage(스키마 확정)    │
        ▼                            │
   api-designer → output/api_contract.json ─┐
        │ SendMessage(계약 확정)             │
        ▼                                   ▼
   ui-builder(app/,components/)   ai-summarizer(요약 로직)
        └────────── 모듈 완성 알림 ──────────┘
                         ▼
   qa-integrator → output/qa_report.md → (실패 시 SendMessage 환류)
                         ▼
                 [리더: 통합·보고]
```

## 에러 핸들링
| 상황 | 전략 |
|------|------|
| 팀원 1명 실패/중지 | 리더 감지 → SendMessage 상태 확인 → 재시작 또는 대체 |
| 의존 산출물 미비(예: 계약 없이 UI) | 소비자 팀원은 가정 진행 금지. 생산자에 보완 요청, 리더가 작업 순서 조정 |
| QA 실패 항목 | 책임 에이전트 최대 2회 재작업. 미해결 시 `qa_report.md`에 잔존 이슈 명시 후 진행 |
| 라이브 DB 자격증명 부재 | SQL 산출까지만. "SQL Editor 실행 필요" 명시 |
| 데이터 충돌 | 출처 병기, 삭제 금지 |

## 테스트 시나리오
### 정상 흐름 (DB/RLS 마일스톤)
1. 사용자: "DB/RLS까지 만들어줘"
2. Phase 0: `output/` 없음 → 초기 실행
3. Phase 2: db-architect + qa-integrator 팀 구성
4. Phase 3: db-architect가 schema/seed/rls_tests 생성, qa-integrator가 rls_tests 시나리오 검증
5. Phase 4: 통과 확인
6. 결과: `output/schema.sql`·`seed.sql`·`rls_tests.sql` 생성 + "SQL Editor 실행 필요" 안내

### 에러 흐름
1. Phase 3에서 api-designer가 계약 작성 중 스키마 컬럼 누락 발견
2. db-architect에 SendMessage로 보완 요청
3. db-architect가 스키마 보완 → 재통지
4. api-designer 계약 완성, 진행
5. 만약 db-architect 무응답 시: 리더가 누락 컬럼을 작업으로 재등록, 미해결분은 보고서에 명시
