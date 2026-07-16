/**
 * 모델 적합 탭 — 안내용 파이썬 코드 생성. 화면의 적합(pyFit.ts의 FIT_SCRIPT)과
 * 같은 방법(같은 scipy 호출·같은 고정 모수)을 독립 실행 가능한 스크립트로
 * 재현한다. 데이터는 코드에 직접 임베드(최대 2000개, 초과분은 안내 주석).
 * React 의존 없음.
 */
import type { FitData } from "./fitData";
import type { FitParamOut } from "./pyFit";

const EMBED_CAP = 2000;

/** 숫자 배열 → 파이썬 리스트 리터럴(12개/줄 줄바꿈, 상한 초과 시 절단 주석). */
function pyArray(values: number[], indent = "    "): { code: string; truncated: boolean } {
  const vals = values.slice(0, EMBED_CAP);
  const lines: string[] = [];
  for (let i = 0; i < vals.length; i += 12) {
    lines.push(indent + vals.slice(i, i + 12).map((v) => String(v)).join(", ") + ",");
  }
  return {
    code: `[\n${lines.join("\n")}\n]`,
    truncated: values.length > EMBED_CAP,
  };
}

function truncNote(total: number): string {
  return `# ⚠ 데이터가 많아 앞 ${EMBED_CAP}개만 임베드했습니다(전체 ${total}개).\n# 전체 분석은 원본을 CSV로 저장해 pd.read_csv 등으로 불러오세요.\n`;
}

function p(params: FitParamOut[] | undefined, name: string): number {
  return params?.find((q) => q.name === name)?.value ?? NaN;
}

function f(v: number): string {
  if (!Number.isFinite(v)) return "float('nan')";
  return String(Math.round(v * 1e6) / 1e6);
}

/* ─────────────── 분포 id ↔ scipy 표현(적합·표본추출 공용) ─────────────── */

/** 적합된 파라미터로 frozen 분포 생성 식. */
export function sevFrozenExpr(id: string, params: FitParamOut[]): string {
  switch (id) {
    case "normal":
      return `stats.norm(${f(p(params, "mu"))}, ${f(p(params, "sigma"))})`;
    case "lognormal":
      return `stats.lognorm(${f(p(params, "sigma"))}, 0, np.exp(${f(p(params, "mu"))}))`;
    case "exponential":
      return `stats.expon(0, ${f(1 / p(params, "lambda"))})`;
    case "weibull":
      return `stats.weibull_min(${f(p(params, "k"))}, 0, ${f(p(params, "lambda"))})`;
    case "gamma":
      return `stats.gamma(${f(p(params, "alpha"))}, 0, ${f(p(params, "theta"))})`;
    case "beta":
      return `stats.beta(${f(p(params, "alpha"))}, ${f(p(params, "beta"))})`;
    case "pareto2":
      return `stats.lomax(${f(p(params, "alpha"))}, 0, ${f(p(params, "theta"))})`;
    case "pareto1":
      return `stats.pareto(${f(p(params, "alpha"))}, 0, ${f(p(params, "theta_min"))})`;
    default:
      return "stats.norm()";
  }
}

export function freqFrozenExpr(id: string, params: FitParamOut[]): string {
  switch (id) {
    case "poisson":
      return `stats.poisson(${f(p(params, "lambda"))})`;
    case "negbinom":
      return `stats.nbinom(${f(p(params, "r"))}, ${f(p(params, "p"))})`;
    case "binomial":
      return `stats.binom(${Math.round(p(params, "n"))}, ${f(p(params, "p"))})`;
    default:
      return "stats.poisson(1)";
  }
}

/** 개별 데이터 MLE 적합 호출 줄(들) — FIT_SCRIPT와 동일한 고정 모수. */
function sevFitLines(id: string): string {
  switch (id) {
    case "normal":
      return `mu, sigma = stats.norm.fit(x)
dist = stats.norm(mu, sigma)
print(f"mu={mu:.6g}, sigma={sigma:.6g}")
k = 2  # 추정 모수 개수`;
    case "lognormal":
      return `s, _, scale = stats.lognorm.fit(x, floc=0)   # 위치모수 0 고정
mu, sigma = np.log(scale), s
dist = stats.lognorm(s, 0, scale)
print(f"mu={mu:.6g}, sigma={sigma:.6g}")
k = 2`;
    case "exponential":
      return `_, scale = stats.expon.fit(x, floc=0)
lam = 1 / scale
dist = stats.expon(0, scale)
print(f"lambda={lam:.6g}")
k = 1`;
    case "weibull":
      return `c, _, scale = stats.weibull_min.fit(x, floc=0)
dist = stats.weibull_min(c, 0, scale)
print(f"k(형상)={c:.6g}, lambda(척도)={scale:.6g}")
k = 2`;
    case "gamma":
      return `a, _, scale = stats.gamma.fit(x, floc=0)
dist = stats.gamma(a, 0, scale)
print(f"alpha={a:.6g}, theta={scale:.6g}")
k = 2`;
    case "beta":
      return `a, b, _, _ = stats.beta.fit(x, floc=0, fscale=1)  # [0,1] 고정
dist = stats.beta(a, b)
print(f"alpha={a:.6g}, beta={b:.6g}")
k = 2`;
    case "pareto2":
      return `c, _, scale = stats.lomax.fit(x, floc=0)   # Lomax = 2모수 파레토
dist = stats.lomax(c, 0, scale)
print(f"alpha={c:.6g}, theta={scale:.6g}")
k = 2`;
    case "pareto1":
      return `theta = float(np.min(x))                    # 하한 θ = 관측 최솟값
b, _, _ = stats.pareto.fit(x, floc=0, fscale=theta)
dist = stats.pareto(b, 0, theta)
print(f"alpha={b:.6g}, theta(고정)={theta:.6g}")
k = 1`;
    default:
      return "";
  }
}

/** 그룹 데이터용 make/init 파이썬 조각 — FIT_SCRIPT의 스펙과 동일. */
function groupedSpecLines(id: string): string {
  switch (id) {
    case "normal":
      return `make = lambda t: stats.norm(t[0], np.exp(t[1]))
t0 = [m, np.log(sd)]
names, k = ["mu", "sigma"], 2
unpack = lambda t: (t[0], np.exp(t[1]))`;
    case "lognormal":
      return `mu0 = np.log(m**2 / np.sqrt(v + m**2)); s0 = np.sqrt(max(np.log(1 + v/m**2), 1e-6))
make = lambda t: stats.lognorm(np.exp(t[1]), 0, np.exp(t[0]))
t0 = [mu0, np.log(s0)]
names, k = ["mu", "sigma"], 2
unpack = lambda t: (t[0], np.exp(t[1]))`;
    case "exponential":
      return `make = lambda t: stats.expon(0, np.exp(-t[0]))
t0 = [np.log(1/m)]
names, k = ["lambda"], 1
unpack = lambda t: (np.exp(t[0]),)`;
    case "weibull":
      return `make = lambda t: stats.weibull_min(np.exp(t[0]), 0, np.exp(t[1]))
t0 = [np.log(1.2), np.log(m)]
names, k = ["k", "lambda"], 2
unpack = lambda t: (np.exp(t[0]), np.exp(t[1]))`;
    case "gamma":
      return `make = lambda t: stats.gamma(np.exp(t[0]), 0, np.exp(t[1]))
t0 = [np.log(max(m**2/v, 1e-3)), np.log(max(v/m, 1e-9))]
names, k = ["alpha", "theta"], 2
unpack = lambda t: (np.exp(t[0]), np.exp(t[1]))`;
    case "beta":
      return `c0 = max(m*(1-m)/v - 1, 0.2)
make = lambda t: stats.beta(np.exp(t[0]), np.exp(t[1]))
t0 = [np.log(max(m*c0, 0.1)), np.log(max((1-m)*c0, 0.1))]
names, k = ["alpha", "beta"], 2
unpack = lambda t: (np.exp(t[0]), np.exp(t[1]))`;
    case "pareto2":
      return `make = lambda t: stats.lomax(np.exp(t[0]), 0, np.exp(t[1]))
t0 = [np.log(2.5), np.log(m*1.5)]
names, k = ["alpha", "theta"], 2
unpack = lambda t: (np.exp(t[0]), np.exp(t[1]))`;
    case "pareto1":
      return `theta = float(np.min(lo))                   # 하한 θ = 최소 구간 하한(고정)
make = lambda t: stats.pareto(np.exp(t[0]), 0, theta)
t0 = [np.log(2.0)]
names, k = ["alpha"], 1
unpack = lambda t: (np.exp(t[0]),)`;
    default:
      return "";
  }
}

/* ─────────────────────────── 심도 적합 코드 ─────────────────────────── */

export function severityFitCode(id: string, name: string, data: FitData): string {
  if (data.kind === "grouped") {
    const g = data.groups ?? [];
    const lo = pyArray(g.map((r) => r.lo));
    const hi = pyArray(g.map((r) => r.hi));
    const n = pyArray(g.map((r) => r.count));
    return `import numpy as np
from scipy import stats
from scipy.optimize import minimize
import matplotlib.pyplot as plt

# ${name} — 그룹(구간) 데이터 구간 우도 MLE
# 우도: L = Π [F(bᵢ)−F(aᵢ)]^nᵢ  (Loss Models 관례)
lo = np.array(${lo.code})
hi = np.array(${hi.code})
n  = np.array(${n.code}, float)

total = n.sum()
mids = (lo + hi) / 2
m = float(np.average(mids, weights=n))            # 초기값용 근사 적률
v = max(float(np.average((mids - m)**2, weights=n)), 1e-12)
sd = np.sqrt(v)

${groupedSpecLines(id)}

def nll(t):
    try:
        fr = make(t)
        pr = fr.cdf(hi) - fr.cdf(lo)
        if not np.all(np.isfinite(pr)) or np.any(pr <= 0):
            return 1e12
        return -float(np.sum(n * np.log(pr)))
    except Exception:
        return 1e12

res = minimize(nll, t0, method="Nelder-Mead",
               options={"maxiter": 4000, "xatol": 1e-9, "fatol": 1e-10})
dist = make(res.x)
logL = -res.fun
print("파라미터:", dict(zip(names, np.round(unpack(res.x), 6))))
print(f"logL={logL:.4f}  AIC={2*k - 2*logL:.4f}  BIC={k*np.log(total) - 2*logL:.4f}")

# 카이제곱 적합도 — 구간별 관측 vs 기대도수
E = total * (dist.cdf(hi) - dist.cdf(lo))
ok = E > 0
chi2 = float(np.sum((n[ok] - E[ok])**2 / E[ok]))
df = int(ok.sum()) - 1 - k
print(f"chi2={chi2:.4f}  df={df}  p={stats.chi2.sf(chi2, df):.4f}" if df > 0
      else f"chi2={chi2:.4f}  (df≤0 — 구간 수 부족)")

# 밀도 막대(경험) + 적합 PDF, ogive + 적합 CDF
xg = np.linspace(lo.min(), hi.max(), 300)
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].bar(lo, n/(total*(hi-lo)), width=hi-lo, align="edge", alpha=0.3, label="empirical")
ax[0].plot(xg, dist.pdf(xg), "r-", label="fitted"); ax[0].set_title("PDF"); ax[0].legend()
ax[1].step(np.r_[lo[0], hi], np.r_[0, np.cumsum(n)/total], where="post", label="ogive")
ax[1].plot(xg, dist.cdf(xg), "r-", label="fitted"); ax[1].set_title("CDF"); ax[1].legend()
plt.tight_layout(); plt.show()

# QQ-plot — 구간 상한 vs 누적확률 분위수
cum = np.cumsum(n)/total
keep = cum < 1 - 1e-9
plt.figure(figsize=(4, 4))
plt.scatter(dist.ppf(cum[keep]), hi[keep], s=18)
lim = [min(lo.min(), 0), hi.max()*1.05]
plt.plot(lim, lim, "k--", lw=1)
plt.xlabel("Theoretical"); plt.ylabel("Empirical"); plt.title("Q-Q plot")
plt.tight_layout(); plt.show()`;
  }

  const arr = pyArray(data.values);
  return `import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# ${name} — 개별 데이터 MLE 적합
${arr.truncated ? truncNote(data.values.length) : ""}x = np.array(${arr.code})

${sevFitLines(id)}

# 적합 통계량
n = len(x)
logL = float(np.sum(dist.logpdf(x)))
print(f"logL={logL:.4f}  AIC={2*k - 2*logL:.4f}  BIC={k*np.log(n) - 2*logL:.4f}")

# KS 검정 (주의: 파라미터를 데이터에서 추정했으므로 p값은 근사)
ks = stats.kstest(x, dist.cdf)
print(f"KS D={ks.statistic:.4f}  p={ks.pvalue:.4f}")

# Anderson-Darling A² (통계량 — 꼬리 적합에 민감)
xs = np.sort(x); F = np.clip(dist.cdf(xs), 1e-12, 1-1e-12)
i = np.arange(1, n+1)
a2 = -n - np.mean((2*i - 1) * (np.log(F) + np.log(1 - F[::-1])))
print(f"A²={a2:.4f}")

# 히스토그램(밀도) + 적합 PDF, ECDF + 적합 CDF
xg = np.linspace(xs[0], xs[-1], 300)
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].hist(x, bins="auto", density=True, alpha=0.3, label="empirical")
ax[0].plot(xg, dist.pdf(xg), "r-", label="fitted"); ax[0].set_title("PDF"); ax[0].legend()
ax[1].plot(xs, np.arange(1, n+1)/n, drawstyle="steps-post", label="ECDF")
ax[1].plot(xg, dist.cdf(xg), "r-", label="fitted"); ax[1].set_title("CDF"); ax[1].legend()
plt.tight_layout(); plt.show()

# QQ-plot
pp = (np.arange(1, n+1) - 0.5) / n
plt.figure(figsize=(4, 4))
plt.scatter(dist.ppf(pp), xs, s=10)
lim = [xs[0], xs[-1]]
plt.plot(lim, lim, "k--", lw=1)
plt.xlabel("Theoretical"); plt.ylabel("Sample"); plt.title("Q-Q plot")
plt.tight_layout(); plt.show()`;
}

/* ─────────────────────────── 빈도 적합 코드 ─────────────────────────── */

export function frequencyFitCode(
  id: string,
  name: string,
  counts: number[]
): string {
  const arr = pyArray(counts);
  let fit: string;
  if (id === "poisson") {
    fit = `lam = counts.mean()                          # 포아송 MLE = 표본평균
dist = stats.poisson(lam)
print(f"lambda={lam:.6g}")
k = 1`;
  } else if (id === "negbinom") {
    fit = `# 음이항 MLE — p를 r로 프로파일(p = r/(r+평균)) 후 r만 1차원 최적화
from scipy.optimize import minimize_scalar
mean = counts.mean()
def nll(logr):
    r = np.exp(logr); p = r / (r + mean)
    v = -float(np.sum(stats.nbinom.logpmf(counts, r, p)))
    return v if np.isfinite(v) else 1e12
res = minimize_scalar(nll, bounds=(np.log(1e-2), np.log(1e4)), method="bounded")
r = float(np.exp(res.x)); p = r / (r + mean)
dist = stats.nbinom(r, p)
print(f"r={r:.6g}, p={p:.6g}")
k = 2`;
  } else {
    fit = `# 이항 MLE — n은 정수 탐색(관측 최대 이상), p = 평균/n
mean = counts.mean(); kobs = max(int(counts.max()), 1)
best = None
for nn in range(kobs, kobs*10 + 21):
    pp = mean / nn
    if not (0 < pp < 1):
        continue
    ll = float(np.sum(stats.binom.logpmf(counts, nn, pp)))
    if np.isfinite(ll) and (best is None or ll > best[0]):
        best = (ll, nn, pp)
ll, n_hat, p_hat = best
dist = stats.binom(n_hat, p_hat)
print(f"n={n_hat}, p={p_hat:.6g}")
k = 2`;
  }
  return `import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# ${name} — 연도별 사고건수(빈도) 적합
${arr.truncated ? truncNote(counts.length) : ""}counts = np.array(${arr.code})

${fit}

ny = len(counts)
logL = float(np.sum(dist.logpmf(counts)))
print(f"logL={logL:.4f}  AIC={2*k - 2*logL:.4f}  BIC={k*np.log(ny) - 2*logL:.4f}")

# 카이제곱 — 건수 0..max 관측 vs 기대(꼬리는 마지막 빈에 합산)
K = int(counts.max())
obs = np.bincount(counts, minlength=K+1).astype(float)
E = ny * np.array([dist.pmf(j) for j in range(K+1)])
E[-1] += ny * float(dist.sf(K))
ok = E > 0
chi2 = float(np.sum((obs[ok] - E[ok])**2 / E[ok]))
df = int(ok.sum()) - 1 - k
print(f"chi2={chi2:.4f}  df={df}  p={stats.chi2.sf(chi2, df):.4f}" if df > 0
      else f"chi2={chi2:.4f}  (df≤0 — 관측 건수 종류 부족)")

# 경험 PMF vs 적합 PMF
kk = np.arange(0, K + 3)
plt.figure(figsize=(5.5, 3.2))
plt.bar(np.arange(K+1), obs/ny, width=0.35, alpha=0.4, label="empirical")
plt.plot(kk, dist.pmf(kk), "ro-", ms=4, lw=1, label="fitted")
plt.xlabel("연간 건수 k"); plt.ylabel("P(N=k)"); plt.legend()
plt.tight_layout(); plt.show()`;
}

/* ───────────────────────── 몬테카를로 코드 ───────────────────────── */

/**
 * 시뮬레이션 이어가기 코드 — 빈도+심도가 모두 있으면 집합손해 S=ΣX
 * (연간 총손해)·VaR·TVaR, 심도만이면 표본추출·분위수.
 */
export function monteCarloCode(
  sev: { id: string; name: string; params: FitParamOut[] },
  freq?: { id: string; name: string; params: FitParamOut[] } | null
): string {
  const sevExpr = sevFrozenExpr(sev.id, sev.params);
  if (!freq) {
    return `import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# 몬테카를로 — 적합된 심도분포(${sev.name})에서 표본추출
rng = np.random.default_rng(42)
sev = ${sevExpr}

n_sim = 100_000
xs = sev.rvs(n_sim, random_state=rng)

print(f"평균={xs.mean():,.2f}  표준편차={xs.std():,.2f}")
for q in [0.50, 0.75, 0.90, 0.95, 0.99, 0.995]:
    print(f"  {q:.1%} 분위수 = {np.quantile(xs, q):,.2f}")

plt.figure(figsize=(6, 3.2))
plt.hist(xs, bins=80, density=True, alpha=0.5)
plt.title("Simulated severity"); plt.tight_layout(); plt.show()

# 응용: 보상한도·자기부담금 적용 후 기대지급액
# ded, lim = 1000, 50000
# paid = np.clip(xs - ded, 0, lim - ded)
# print("기대지급액:", paid.mean())`;
  }

  const freqExpr = freqFrozenExpr(freq.id, freq.params);
  return `import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

# 몬테카를로 집합손해모형 — S = X₁+…+X_N (연간 총손해)
# 빈도 N ~ ${freq.name}, 심도 X ~ ${sev.name} (적합 결과 반영)
rng = np.random.default_rng(42)
freq = ${freqExpr}
sev  = ${sevExpr}

n_years = 20_000                     # 시뮬레이션 연수
N = freq.rvs(n_years, random_state=rng)
S = np.zeros(n_years)
total = int(N.sum())
all_x = sev.rvs(total, random_state=rng)   # 심도 일괄 추출 후 연도별 분배(빠름)
idx = np.r_[0, np.cumsum(N)]
for i in range(n_years):
    S[i] = all_x[idx[i]:idx[i+1]].sum()

print(f"연간 건수 평균={N.mean():.3f}  연간 총손해 평균={S.mean():,.2f}")
for q in [0.95, 0.99]:
    var_q = np.quantile(S, q)
    tvar_q = S[S >= var_q].mean()          # 조건부 기대 초과손해
    print(f"  VaR {q:.0%} = {var_q:,.2f}   TVaR {q:.0%} = {tvar_q:,.2f}")

plt.figure(figsize=(6, 3.2))
plt.hist(S, bins=80, density=True, alpha=0.5)
plt.axvline(np.quantile(S, 0.99), color="r", ls="--", lw=1, label="VaR 99%")
plt.title("Aggregate loss S"); plt.legend(); plt.tight_layout(); plt.show()

# 응용: 재보험 초과손해(XL) 층별 기대손해
# att, lim = np.quantile(S, 0.90), np.quantile(S, 0.99)
# ceded = np.clip(S - att, 0, lim - att)
# print("층별 기대손해(출재):", ceded.mean())`;
}
