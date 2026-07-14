# /datalab 보완 + /apps ML 브로셔 — 설계 (승인됨 2026-07-14)

사용자 승인 완료. 아래대로 구현하고 dev 서버 + Playwright 실측으로 검증한다.

## B. /apps — ML Auto Flow 브로셔
- `public/apps/ml-auto-flow-brochure.pdf` (복사 완료, 328KB).
- 머신러닝 자동분석 소속. **버튼 클릭 → 팝업(모달)** 안에서 PdfViewer 인라인 열람(전체보기·다운로드). 뒤로가기 닫힘 적용.
- 신규 클라이언트 컴포넌트 `components/feature/BrochureButton.tsx`(모달 + PdfViewer 임베드). `app/(public)/apps/page.tsx` 모델분석 그리드 아래 배치.

## A. /datalab (9)
1. **분포·시뮬레이션**: 기초통계 새 방법 `distributions`(분포 pdf/pmf 시각화·scipy `.fit` 적합+KS/AIC·난수 생성). 선형회귀·로지스틱에 `시뮬레이션(난수 생성)` 섹션(합성데이터 계수 복원·부트스트랩 CI·몬테카를로).
2. **샘플 데이터**: `public/datalab/samples/{claims,policy}.xlsx` 호스팅(exceljs 스크립트 `scripts/gen-datalab-samples.mjs`). 실행기 데이터 소스 3종: 샘플셋 선택·업로드(기존)·URL. 코드형 샘플 생성 유지.
3. **규제/제약**: Ridge/Lasso 특정 alpha+ElasticNet. 선형회귀(Ridge/Lasso alpha·positive)·로지스틱(penalty·C)·GLM(fit_regularized) 규제 섹션 + 원리 설명.
4. **교차검증 확장**: 기존 `cross-validation`에 KFold/Stratified/Repeated/LOO/TimeSeriesSplit/GroupKFold, cross_validate 다중지표, cross_val_predict, nested CV.
5. **뒤로가기 닫힘**: `lib/useHistoryDismiss.ts` 훅 → MethodDialog·ErrorFixModal·PdfViewer 전체보기·브로셔.
6·7. **데이터 핸들링 세분화**: `lib/wrangleSnippets.ts`(그룹: Join inner/left/right/outer/cross/키다름/검증 · 합치기 Concat-행/열 · Groupby sum/mean/agg/transform/filter · **Split** 열분리/청크/explode/조건분리 · 선택 loc/iloc · 필터·isin · 분기 where/select/cut/qcut · 피벗/melt · 결측 · 정렬·중복 · apply/map). 상단 로드 드롭다운에서 wrangle 제거. 각 셀 `데이터 핸들링 ▾` 콤보박스로 스니펫 삽입. 사전 wrangle 팝업 '실행기로 보내기' 제거.
8. **접기/펼치기 색**: 토글 바를 output(surface)과 다른 뮤트 틴트로.
9. **셀 이동·순서**: ▲/▼ 이동, 실행순서 배지 `In [n]`+상태 색, 위치 `[i+1]`.

## 검증
typecheck·build 통과 + Playwright 실측(콘솔 에러 0, 핵심 시나리오).
