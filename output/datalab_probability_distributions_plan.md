# 확률분포 탭 (/datalab) — 구현 계획

- **작성일:** 2026-07-15
- **대상 섹션:** `데이터 예제/분석` (`/datalab`) — 데스크톱 3번째 탭 신설
- **탭 이름:** `확률분포`
- **문서 성격:** 구현 착수 전 설계·계획서(스펙). 승인 후 `writing-plans`로 실행 계획을 분해한다.

---

## 1. 개요와 목표

`/datalab`에 자주 쓰는 **확률분포**를 인터랙티브하게 탐색하는 탭을 추가한다. 각 분포마다
확률밀도함수(PDF)/확률질량함수(PMF)와 누적분포함수(CDF)를 **그래프**로 보여주고,
**파라미터를 바꾸면 그래프 모양이 실시간으로 바뀌며**, 아래에 **수식(KaTeX)**과
**통계량(평균·분산·표준편차·왜도·첨도)을 수식과 값**으로 함께 표시한다. 각 분포의
**파이썬 코드(scipy.stats 기반, 현재 파라미터 값 반영)**를 별도 팝업으로 열어 복사해
자신의 코딩에 활용할 수 있게 한다.

---

## 2. 요구사항 (원문 정리)

1. `/datalab`에 세 번째 탭 `확률분포` 추가.
2. 자주 쓰는 확률분포의 **PDF와 CDF를 그래프**로 표시.
3. **파라미터 변경 → 분포 형태가 실시간 변화**.
4. 상단 **연속형 분포**: 정규 · 로그정규 · 지수 · 와이블 · 감마 · 베타 · 파레토(1모수/2모수).
   - 각 분포별 그래프.
   - 그 아래 **파라미터 입력**.
   - 그 아래 **수식 + 통계량(평균·분산·표준편차·왜도·첨도 등)을 수식과 값으로** 표시.
5. 그 아래 **이산형 분포**: 이항 · 포아송 · 음이항.
   - 각 분포에 적합한 그래프(PMF 스템 + CDF 계단) + 수식 + 통계량.
6. **연속형/이산형 각각을 펼치거나 닫을 수 있게** → (확정) **그룹과 개별 분포 카드 모두 접기/펼치기**.
7. 위 내용에 대한 **파이썬 코드를 별도 팝업**으로 열람·복사.

---

## 3. 확정된 설계 결정 (Q&A)

| 항목 | 결정 | 비고 |
|------|------|------|
| 접기/펼치기 단위 | **그룹 + 개별 분포 카드 모두** | 그룹(연속형/이산형) 접기 + 카드별 접기 |
| 수식 표현 | **KaTeX 도입** | `katex` 의존성 추가, `renderToString`로 렌더 |
| 파이썬 코드 팝업 | **현재 파라미터 값 반영 + 복사** | 실행기로 보내기는 범위 밖(§17) |

### 기본값으로 확정(질문 없이 관례 준수)

- **차트 라이브러리 미도입** — 프로젝트 관례대로 **직접 SVG** 렌더(의존성 0). (`d3-geo`는 지구본 전용, 차트용 라이브러리는 없음)
- PDF와 CDF는 **좌우 2개의 작은 그래프**로 분리(스케일이 다르므로 이중축 오버레이 지양). 모바일은 세로 스택.
- 파라미터 컨트롤은 **슬라이더 + 숫자 입력** 병행(실시간 변화 체감). 계산이 가벼워 디바운스 불필요.
- 분포별 **정의 구간·유효 파라미터 범위**를 명시하고, **정의되지 않는 적률**(예: 파레토 α 조건)은 "정의되지 않음"으로 표기.

### ⚠️ 리뷰에서 확인 요청 (파레토 파라미터화)

"파레토(1모수/2모수)"는 관례가 갈린다. 본 계획은 **Loss Models(Klugman)/계리 시험 관례**로 작성한다.
아래로 확정하되, 다른 정의를 원하면 알려주세요(§6.4).

- **2모수 파레토** = Lomax형: `f(x)=α θ^α / (x+θ)^(α+1)`, `x>0`, 파라미터 `α`(형상), `θ`(척도).
- **1모수 파레토** = single-parameter Pareto: `f(x)=α θ^α / x^(α+1)`, `x>θ`, 파라미터 `α`만(`θ`는 고정 상수, 기본 `θ=1`).

> 대안(고전적 Pareto Type I: `x_m`·`α`, `x≥x_m`)을 원하면 그 정의로 교체 가능.

---

## 4. 아키텍처 · 통합 지점

### 4.1 탭 통합 (`DataLabTabs.tsx`)

현재 `DataLabTabs`는 두 섹션(`analysis`/`examples`)을 **한 번만 렌더**하고 `md:` 반응형
클래스로 표시를 토글한다(데스크톱=탭, 모바일=세로 스택, 탭바 없음, Pyodide 상태 보존).

- `TabKey`에 `"distributions"` 추가, 탭 버튼 `확률분포` 추가.
- `distributions: ReactNode` prop 추가 → `<div className={tab==="distributions" ? "md:block" : "md:hidden"}>`.
- **모바일**: 기존 관례대로 세 섹션이 세로로 스택(탭바 없음). 확률분포 섹션은 **그룹은 펼침 / 개별 카드는 접힘(초기값)**이라 스택이 과하게 길어지지 않는다.

### 4.2 페이지 (`app/(public)/datalab/page.tsx`)

- `<DataLabTabs analysis={<MethodCloud/>} examples={…} distributions={<DistributionLab/>} />`.
- 서버 컴포넌트 그대로. `DistributionLab`은 `"use client"`.

---

## 5. 컴포넌트 · 파일 구조

**신규**

| 파일 | 역할 | 성격 |
|------|------|------|
| `lib/distMath.ts` | 특수함수·수치 도구(lgamma·erf·정규화 불완전 감마/베타·분위수 이분법) | 순수 TS, 단위 테스트 가능 |
| `lib/distributions.ts` | 분포 카탈로그(파라미터 스펙·pdf/pmf·cdf·적률·KaTeX 문자열·파이썬 코드 생성) | 순수 TS(데이터+함수), React 무관 |
| `components/feature/datalab/DistributionLab.tsx` | 탭 루트: 연속형/이산형 그룹(접기) 렌더 | `"use client"` |
| `components/feature/datalab/DistCard.tsx` | 분포 1종 카드: 파라미터 컨트롤 + 차트 + 수식 + 통계량 + 코드 버튼(접기) | 클라 |
| `components/feature/datalab/DistChart.tsx` | SVG 렌더(연속=PDF/CDF 곡선, 이산=PMF 스템/CDF 계단) | 클라 |
| `components/feature/datalab/Tex.tsx` | KaTeX 래퍼(`renderToString` + `dangerouslySetInnerHTML`) | 클라/서버 무관 |
| `components/feature/datalab/DistCodeDialog.tsx` | 파이썬 코드 팝업(현재 값 반영, 복사) | 클라 |
| `components/feature/datalab/code-popup.tsx` | 공유 `copyText`·`CopyButton`·`CodeBlock` 추출 | 클라 (선택적 리팩터, 권장) |

**변경**

| 파일 | 변경 |
|------|------|
| `components/feature/datalab/DataLabTabs.tsx` | 3번째 탭(`distributions`) 추가 |
| `app/(public)/datalab/page.tsx` | `distributions` prop 전달 |
| `components/feature/datalab/MethodCloud.tsx` | (선택) `code-popup.tsx`의 공유 컴포넌트 사용으로 교체 |
| `package.json` | `katex` + `@types/katex` 추가 |

> **공유 코드 추출 권장**: 코드 팝업의 `copyText`/`CopyButton`/`CodeBlock`은 `MethodCloud`에 이미 존재한다.
> 같은 성격의 두 번째 코드 팝업을 만드는 작업이므로 `code-popup.tsx`로 추출해 양쪽에서 재사용한다(중복 제거).
> 위험을 최소화하려면 `MethodCloud`를 건드리지 않고 신규 팝업에만 복제하는 대안도 가능.

---

## 6. 분포 수학 모듈

브라우저에서 즉시 계산하므로 `scipy` 없이 **자체 수치 구현**한다.

### 6.1 특수함수 / 수치 도구 (`lib/distMath.ts`)

- `lgamma(x)` — Lanczos 근사(log Γ).
- `erf(x)` — 급수/근사(정규·로그정규 CDF에 사용).
- `lowerRegGamma(a, x)` = P(a,x) — 정규화 하부 불완전 감마(감마 CDF; Numerical Recipes `gammp`: `x<a+1` 급수 / 그 외 연분수).
- `regIncBeta(x, a, b)` = I_x(a,b) — 정규화 불완전 베타(베타 CDF; `betacf` 연분수).
- `betaln(a,b)` = `lgamma(a)+lgamma(b)-lgamma(a+b)`, `logChoose(n,k)`, `factln(n)`.
- `quantileByBisection(cdf, p, lo, hi)` — 연속형 그래프 도메인용 분위수(닫힌형 없는 감마·베타 등).

> **이산형 CDF/PMF**는 특수함수 대신 **로그공간 직접 합산**으로 계산(수치 안정, 지지집합 유한/절단 가능). 즉 이항/포아송/음이항은 pmf를 log로 누적.

### 6.2 연속형 분포 카탈로그 (`lib/distributions.ts`)

각 항목: `id`, `name`(한글), `en`, `params`(이름·기호·기본값·min/max/step·제약), `domain`,
`pdf(x)`, `cdf(x)`, `moments()`(평균·분산·왜도·초과첨도, 정의여부 포함), KaTeX 문자열(`pdfTex`,`cdfTex`,`statTex`), `python(params)`.

| 분포 | 파라미터 | 지지 | 평균 | 분산 | 왜도 | 초과첨도 | scipy |
|------|----------|------|------|------|------|----------|-------|
| 정규 Normal | μ∈ℝ, σ>0 | ℝ | μ | σ² | 0 | 0 | `norm(loc=μ, scale=σ)` |
| 로그정규 Lognormal | μ, σ>0 (로그스케일) | x>0 | `exp(μ+σ²/2)` | `(e^{σ²}−1)e^{2μ+σ²}` | `(e^{σ²}+2)√(e^{σ²}−1)` | `e^{4σ²}+2e^{3σ²}+3e^{2σ²}−6` | `lognorm(s=σ, scale=exp(μ))` |
| 지수 Exponential | λ>0 (rate) | x≥0 | 1/λ | 1/λ² | 2 | 6 | `expon(scale=1/λ)` |
| 와이블 Weibull | k>0, λ>0 | x≥0 | `λΓ(1+1/k)` | `λ²[Γ(1+2/k)−Γ(1+1/k)²]` | Γ-항 기반 | Γ-항 기반 | `weibull_min(c=k, scale=λ)` |
| 감마 Gamma | α>0, θ>0 | x>0 | αθ | αθ² | 2/√α | 6/α | `gamma(a=α, scale=θ)` |
| 베타 Beta | α>0, β>0 | [0,1] | α/(α+β) | `αβ/[(α+β)²(α+β+1)]` | 닫힌형 | 닫힌형 | `beta(a=α, b=β)` |
| 파레토(2모수) | α>0, θ>0 | x>0 | θ/(α−1), α>1 | raw-moment 기반 | raw-moment | raw-moment | `lomax(c=α, scale=θ)` |
| 파레토(1모수) | α>0 (θ 고정) | x>θ | αθ/(α−1), α>1 | raw-moment 기반 | raw-moment | raw-moment | `pareto(b=α, scale=θ)` |

- 와이블 적률: `g_i=Γ(1+i/k)` → 평균 `λg₁`, 분산 `λ²(g₂−g₁²)`, 왜도 `(g₃−3g₁g₂+2g₁³)/(g₂−g₁²)^{3/2}`, 초과첨도 `(g₄−4g₁g₃+6g₁²g₂−3g₁⁴)/(g₂−g₁²)²−3`.
- 베타 왜도 `2(β−α)√(α+β+1) / [(α+β+2)√(αβ)]`; 초과첨도 `6[(α−β)²(α+β+1)−αβ(α+β+2)] / [αβ(α+β+2)(α+β+3)]`.
- 파레토(2모수) 원적률 `E[Xᵏ]=θᵏ k!/∏_{i=1}^{k}(α−i)` (α>k), 파레토(1모수) `E[Xᵏ]=αθᵏ/(α−k)` (α>k) → 평균/분산/왜도/첨도를 원적률에서 계산.
- CDF: 정규/로그정규=`erf`, 지수=`1−e^{−λx}`, 와이블=`1−e^{−(x/λ)^k}`, 감마=`P(α,x/θ)`, 베타=`I_x(α,β)`, 파레토(2)=`1−(θ/(x+θ))^α`, 파레토(1)=`1−(θ/x)^α`.

### 6.3 이산형 분포 카탈로그

| 분포 | 파라미터 | 지지 | 평균 | 분산 | 왜도 | 초과첨도 | scipy |
|------|----------|------|------|------|------|----------|-------|
| 이항 Binomial | n∈ℤ≥1, 0<p<1 | 0..n | np | np(1−p) | (1−2p)/√(np(1−p)) | (1−6p(1−p))/(np(1−p)) | `binom(n, p)` |
| 포아송 Poisson | λ>0 | 0,1,… | λ | λ | 1/√λ | 1/λ | `poisson(λ)` |
| 음이항 NegBinom | r>0, 0<p<1 | 0,1,… | r(1−p)/p | r(1−p)/p² | (2−p)/√(r(1−p)) | (p²−6p+6)/(r(1−p)) | `nbinom(n=r, p=p)` |

- PMF: 이항 `C(n,k)pᵏ(1−p)^{n−k}`, 포아송 `e^{−λ}λᵏ/k!`, 음이항 `C(k+r−1,k)pʳ(1−p)ᵏ`(r 실수 허용, `lgamma` 사용).
- 그래프 x범위: cdf≥0.999가 되는 kmax까지(이항은 0..n).

### 6.4 파레토 파라미터화 (확인 요청 재게시)

§3의 ⚠️ 항목과 동일. **기본: Loss Models 관례**. 리뷰 시 확정.

### 6.5 정의되지 않는 적률 처리

- `moments()`는 각 통계량에 `{value|null, defined:boolean, note?}` 반환.
- UI는 정의 안 될 때 "정의되지 않음 (예: α>2 필요)"로 표기(값 대신). 파레토·(필요 시)로그정규 등에 적용.
- 파라미터 유효성: σ>0, α>0, 0<p<1, n≥1 정수 등 위반 시 입력 클램프 + 유효범위 힌트.

---

## 7. 그래프 렌더링 (`DistChart.tsx`, SVG)

- **고정 `viewBox` + `width:100%`**(반응형 자동 스케일, `preserveAspectRatio`). `MethodCloud`식 ResizeObserver 불필요.
- **연속형**: 도메인 `[q(0.001), q(0.999)]`(닫힌형 분위수 있으면 사용, 없으면 이분법; 베타는 `[0,1]`). x를 ~300점 샘플 → `pdf`, `cdf` 배열 → `polyline`/`path`. 좌=PDF, 우=CDF(y∈[0,1]).
- **이산형**: PMF는 스템(수직선 + 점), CDF는 계단(step). x=0..kmax.
- 축: 최소 눈금 + 0선. 선 색 `--primary`(PDF/PMF), CDF는 `--chip-teal-fg` 등 대비색. 채움은 옅게(선택).
- 엣지: 베타 pdf가 끝점에서 발산(α<1·β<1)하면 y상한 클램프·끝점 회피 샘플링. 감마/로그정규 x→0 처리.
- reduced-motion 무관(정적). 접근성: `role="img"` + `aria-label`(분포·파라미터 요약).

---

## 8. 수식 렌더링 (KaTeX, `Tex.tsx`)

- `katex.renderToString(expr, { throwOnError:false, displayMode })` → `dangerouslySetInnerHTML`.
- `import "katex/dist/katex.min.css"`(`Tex.tsx` 모듈에서 1회; 폰트는 KaTeX가 번들). 이 앱은 아티팩트가 아니므로 CSP 제약 없음.
- 각 분포 스펙이 LaTeX 문자열 보유: `pdfTex`/`cdfTex`(블록), 통계량 `statTex[]`(평균·분산·표준편차·왜도·첨도 — 기호식과 값 병기: 예 `\mu = 0`, `\sigma^2 = 1`).
- 통계량 UI: 각 행 = **KaTeX 기호 수식** + **계산된 수치**(dl/table). 정의 안 되면 수치 자리에 "정의되지 않음".

---

## 9. 파라미터 컨트롤 · 접기/펼치기

- **컨트롤**: 파라미터마다 슬라이더(range) + 숫자 입력 + 초기화. `min/max/step`은 스펙에서. 정수 파라미터(n)는 step=1.
- **상태**: `DistCard` 로컬 상태(파라미터 값). 변경 즉시 pdf/cdf/적률 재계산(가벼움).
- **접기(2단계)**:
  - **그룹**(연속형/이산형): 헤더 클릭 토글. 초기 **펼침**.
  - **개별 카드**: 헤더(분포명) 클릭 토글. 초기 **접힘**, 단 **정규분포 1개만 펼침**(탭이 살아있게).
  - 접힘 시 카드 본문(컨트롤·차트·수식·통계량) 미렌더 → 초기 렌더 비용↓.
- 아이콘: `lucide-react`의 `ChevronDown`/`ChevronRight`(기존 사용 중).

---

## 10. 파이썬 코드 팝업 (`DistCodeDialog.tsx`)

- 트리거: 각 카드의 `파이썬 코드 보기` 버튼.
- 패턴 재사용: `MethodDialog`처럼 오버레이 클릭·Escape·`body` 스크롤락·`useHistoryDismiss`(뒤로가기로 닫힘) + `CopyButton`/`CodeBlock`(복사, `execCommand` 폴백).
- **코드 내용(현재 파라미터 값 반영)** — scipy.stats로 PDF/CDF(또는 PMF/CDF) 그래프 + `stats(moments="mvsk")` 통계량 출력. 예(정규, μ=0·σ=1):

```python
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# 정규분포 Normal(mu=0, sigma=1)
mu, sigma = 0, 1
dist = stats.norm(loc=mu, scale=sigma)

x = np.linspace(dist.ppf(0.001), dist.ppf(0.999), 400)
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].plot(x, dist.pdf(x)); ax[0].set_title("PDF")   # 한글 폰트 이슈로 라벨은 영문
ax[1].plot(x, dist.cdf(x)); ax[1].set_title("CDF")
plt.tight_layout(); plt.show()

mean, var, skew, kurt = dist.stats(moments="mvsk")
print(f"평균={mean:.4f} 분산={var:.4f} 표준편차={var**0.5:.4f} 왜도={skew:.4f} 초과첨도={kurt:.4f}")
```

- 이산형은 `np.arange` + `vlines`(PMF) + `step`(CDF). matplotlib 라벨은 영문(Pyodide 한글 폰트 부재 관례), `print`는 한글 OK.
- 팝업은 **열람·복사 전용**(실행기로 보내기 없음 — §17).

---

## 11. 디자인 토큰 준수 (비협상 v2)

- 단일 강조색 `--primary`(#3E6AE1), **그라데이션 금지**, 크림 캔버스·카드 화이트, 카드 엘리베이션 `shadow-card`.
- 칩 색: 연속형 그룹=`blue`, 이산형 그룹=`violet`(또는 `teal`) — 카드/헤더 뱃지에 `--chip-*` 토큰 스코프 사용.
- 헤딩 600/700, 본문 400/500. 색상 트랜지션 0.33s.
- 팝업/카드/버튼은 기존 `MethodCloud` 스타일과 일치.

---

## 12. 의존성 변경

- 추가: `"katex": "^0.16"`(runtime), `"@types/katex": "^0.16"`(dev).
- 신규 라이브러리 없음(차트는 자체 SVG, 수치는 자체 구현).

---

## 13. 파일 변경 목록 (요약)

**신규(8):** `lib/distMath.ts`, `lib/distributions.ts`, `DistributionLab.tsx`, `DistCard.tsx`, `DistChart.tsx`, `Tex.tsx`, `DistCodeDialog.tsx`, `code-popup.tsx`(선택).
**변경(4):** `DataLabTabs.tsx`, `datalab/page.tsx`, `MethodCloud.tsx`(선택), `package.json`.

---

## 14. 구현 순서

1. `package.json`에 `katex`/`@types/katex` 추가 → `npm install`.
2. `lib/distMath.ts`(특수함수·수치) — 값 검증(정규·감마·베타 CDF를 알려진 값과 대조).
3. `lib/distributions.ts`(카탈로그: 연속 8 + 이산 3, pdf/pmf·cdf·moments·tex·python).
4. `Tex.tsx`(KaTeX 래퍼) + CSS import.
5. `DistChart.tsx`(SVG 연속/이산).
6. `code-popup.tsx` 추출(또는 복제) → `DistCodeDialog.tsx`.
7. `DistCard.tsx`(컨트롤+차트+수식+통계량+코드 버튼, 접기).
8. `DistributionLab.tsx`(그룹 접기 + 카드 목록).
9. `DataLabTabs.tsx` 3번째 탭 + `page.tsx` prop.
10. `typecheck` → `build` → Playwright 실측.

---

## 15. 검증 계획

- `npm run typecheck`, `npm run build` 통과.
- **Playwright 실측**:
  - 데스크톱: 탭 `확률분포` 표시/전환, 그룹·카드 접기/펼치기.
  - 파라미터 슬라이더 변경 → SVG `path` `d` 변화 + 통계량 수치 변화.
  - KaTeX 렌더 확인(`.katex` 존재).
  - 코드 팝업: **현재 값이 반영**되었는지, 복사(클립보드/폴백), 뒤로가기·Escape·오버레이 닫힘.
  - 정의되지 않는 적률(파레토 α=1 → 평균 "정의되지 않음") 표기.
  - 모바일: 세 섹션 세로 스택, 카드 초기 접힘.
  - **콘솔 에러 0**.
- **수치 정확성 스팟체크**: 표준정규 CDF(0)=0.5·CDF(1.96)≈0.975, 감마(2,2) 평균=4, 포아송(3) 분산=3, 베타(2,2) 평균=0.5 등.

---

## 16. 리스크 · 엣지케이스

- **특수함수 정확도**: 불완전 감마/베타 연분수 수렴·경계(a·b 큰 값). 알려진 값 대조로 검증.
- **적률 미정의**: 파레토(α 조건)·꼬리 무거운 분포 — null 처리·표기.
- **발산 pdf**: 베타(α<1 또는 β<1) 끝점, 감마/로그정규 x→0 — y클램프·샘플 회피.
- **정수 제약**: 이항 n 정수화, 음이항 r 실수 허용(감마 일반화).
- **KaTeX 번들**: CSS/폰트 포함으로 번들 증가(수용). SSR 안전.
- **모바일 스택 길이**: 카드 초기 접힘으로 완화.

---

## 17. 범위 밖 (YAGNI) · 향후 확장

- 코드 팝업 → 파이썬 실행기로 전송/실행(탭 간 상태 연결 필요). **이번 범위 밖.**
- 데이터 적합(fit)·경험분포 오버레이(기존 `분석 방법 사전`/실행기가 담당).
- 추가 분포(균등·기하·초기하·카이제곱·t·F 등) — 카탈로그가 **데이터 주도**라 향후 항목 추가만으로 확장 가능(구조는 준비).
- 그래프 이미지 다운로드.

---

## 18. 사후 문서 업데이트(구현 후)

- `CLAUDE.md` 변경 이력 표에 1행 추가.
- 메모리 `datalab-section.md` 갱신(3번째 탭 `확률분포` 추가 사실).

---

## 부록 A. 컴포넌트 트리(요약)

```
DataLabTabs
 ├─ analysis:      MethodCloud (기존)
 ├─ examples:      검색/정렬 + DataPostCard[] (기존)
 └─ distributions: DistributionLab (신규)
      ├─ 그룹: 연속형 분포 (접기)
      │    └─ DistCard × {정규,로그정규,지수,와이블,감마,베타,파레토(1),파레토(2)}
      │         ├─ 파라미터 컨트롤(슬라이더+숫자)
      │         ├─ DistChart (PDF | CDF)
      │         ├─ 수식(Tex: pdf/cdf)
      │         ├─ 통계량(Tex 기호 + 값)
      │         └─ [파이썬 코드 보기] → DistCodeDialog
      └─ 그룹: 이산형 분포 (접기)
           └─ DistCard × {이항,포아송,음이항}  (PMF 스템 | CDF 계단)
```
