---
name: pdf-text-extract
description: "업로드된 PDF에서 텍스트를 추출하여 AI 요약 입력으로 만드는 스킬. pdf-parse 기반 추출, 추출 실패(스캔 이미지 PDF 등) 시 본문만 요약하는 폴백을 제공한다. PDF 텍스트 추출, 요약 입력 준비, 첨부 파일 처리, summarize 파이프라인 작업 시 반드시 사용. 추출 로직 수정·보완 요청 시에도 사용."
---

# pdf-text-extract — PDF 텍스트 추출 (요약 입력용)

게시물 첨부 PDF에서 텍스트를 추출해 Claude Sonnet 요약의 입력을 만든다. 결정적 작업(추출)은 코드가 하고, 품질 판단(요약)만 LLM이 한다.

## 핵심 흐름

1. Storage에서 PDF를 버퍼로 다운로드(서버, service_role)
2. `pdf-parse`로 텍스트 추출
3. 본문(`ib_posts.content`) + 추출 텍스트를 합쳐 요약 입력 구성
4. 입력이 모델 한도를 넘으면 앞부분 위주로 잘라 토큰을 절약

## 폴백 (Why)

스캔 이미지형 PDF는 텍스트 레이어가 없어 추출 결과가 비거나 깨진다. 이때 **본문만으로 요약**한다 — 요약 기능 자체가 실패하는 것보다 부분 요약이 사용자에게 낫다. OCR은 v1.0 범위 밖.

추출 성공 판정: 추출 문자열의 의미 있는 길이(예: 공백 제거 후 50자 이상)를 기준으로 한다. 미달이면 폴백.

## 사용

```ts
import { extractPdfText } from '@/lib/utils/pdf';
const { text, ok } = await extractPdfText(buffer);
const summaryInput = ok ? `${post.content}\n\n[첨부]\n${text}` : post.content;
```

추출 유틸 구현은 `scripts/extract.mjs`를 참조해 `lib/utils/pdf.ts`로 옮긴다(서버 전용).

## 주의
- **서버 전용**: 추출은 Route Handler/Server Action에서만. 클라이언트에서 service_role로 다운로드 금지.
- 대용량 PDF는 메모리 부담 → 페이지 수/바이트 상한을 두고 초과 시 앞부분만 처리.
- 추출 실패는 에러가 아니라 **폴백 경로**다. 사용자에게 "첨부 추출 실패, 본문 기준 요약" 정도만 표기.
