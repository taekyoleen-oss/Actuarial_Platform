/**
 * 분석 방법 팝업 [엑셀 적용 코드] 탭 — Python in Excel(=PY()) 적용 코드 레지스트리.
 *
 * 키는 lib/statMethods.ts `STAT_METHODS`(계리 8종 포함)의 방법 id와 1:1 대응.
 * 없는 id는 팝업이 공통 차이점 안내 + '코드 적용' 탭 참고 폴백을 보인다.
 * 데이터는 lib/methodExcelCodeData.ts(워크플로우 pie-code 산출). 확대는 그 파일에 id 키 추가.
 */

/** 필요한 패키지의 Python in Excel(Anaconda) 사용 가능 여부 */
export type ExcelPackageStatus = "available" | "partial" | "unavailable";

export interface ExcelCodeSection {
  title: string;
  level: "basic" | "advanced";
  /** 데이터 로드 줄 정도만 바뀌고 로직이 원본과 사실상 동일하면 true */
  sameAsOriginal: boolean;
  code: string;
}

export interface MethodExcelCode {
  packageStatus: ExcelPackageStatus;
  /** 코드 위에 표시할 이 방법의 Python in Excel 적용 차이점 */
  note: string;
  sections: ExcelCodeSection[];
}

/** 모든 방법 공통 — Python in Excel과 브라우저 실행기의 차이(탭 상단 고정 안내·글머리) */
export const PIE_GENERAL_NOTE: string[] = [
  "데이터는 파일 읽기 대신 xl(\"범위 또는 표\", headers=True)로 시트를 참조합니다.",
  "결과는 print가 아니라 코드 마지막 줄에 둡니다 — 셀에는 마지막 식의 값이 반환되고, print는 진단(Diagnostics) 창으로 갑니다.",
  "np·pd·plt·sns·statsmodels(sm)·warnings는 기본 로드되어 다시 import할 필요가 없습니다(아래 코드에서 해당 줄은 주석 처리). scipy·scikit-learn 등은 import가 필요합니다.",
  "Anaconda 큐레이션 패키지만 됩니다(pip 불가) — scipy·scikit-learn 등은 되지만 lifelines·xgboost·lightgbm 등은 안 됩니다.",
];

/**
 * 방법별 note(문장 문자열)를 글머리 목록으로 변환.
 * 문장(마침표+공백) 단위로 자르고, 위 공통 안내·패키지 배지에 이미 있는 '패키지 사용
 * 가능' 재진술 문장만 걸러 낸다(중복 축소). 그 밖의 방법별 정보(표 이름·셀 순서 등)는 유지.
 */
const _AVAIL_RE = /(기본 제공|기본 공급|사용 가능|그대로 실행)/;
const _PKG_RE = /(scipy|numpy|pandas|matplotlib|statsmodels|scikit-learn|sklearn|patsy|Anaconda|필요한|패키지)/;
export function noteToBullets(note: string): string[] {
  return note
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, "").trim())
    .filter(Boolean)
    .filter((s) => !(_AVAIL_RE.test(s) && _PKG_RE.test(s)));
}

/** Python in Excel이 실행 전에 기본 로드하는 패키지 — 재import가 중복이라 주석 처리 대상 */
const EXCEL_PRELOADED_IMPORTS = new Set([
  "import numpy as np",
  "import pandas as pd",
  "import matplotlib.pyplot as plt",
  "import seaborn as sns",
  "import statsmodels as sm",
  "import warnings",
  "import excel",
]);

/**
 * 엑셀 기본 로드 패키지의 import 줄을 주석 처리(중복 로드 방지·엑셀의 장점 유지).
 * 정확히 일치하는 줄만 대상 — statsmodels.api 등 하위 모듈 import는 기본 로드(bare
 * statsmodels)와 달라 그대로 두고, scipy처럼 로드 안 된 패키지도 유지한다.
 */
function commentPreloadedImports(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      // 인라인 주석·후행 공백을 떼고 '정확히' 일치하는 기본 로드 import만 주석 처리
      const core = line.replace(/\s+#.*$/, "").trim();
      if (EXCEL_PRELOADED_IMPORTS.has(core)) {
        return `# ${core}  ← Excel 기본 로드(생략 가능)`;
      }
      return line;
    })
    .join("\n");
}

/**
 * 파이썬 코드를 Python in Excel용으로 변환.
 *  · plt.show()는 불필요(셀이 마지막 그림을 반환) → 제거
 *  · 엑셀 기본 로드 패키지(np·pd·plt·sns·sm·warnings)의 import 줄 → 주석 처리
 *  · 모델 적합의 임베드 데이터 옆에 xl() 대안 주석을 덧붙인다(있을 때만)
 * 나머지 차이(print→진단창, 셀당 그림 1개)는 코드 위 안내(PIE_CODE_NOTE)로 설명한다.
 */
export function toExcelPython(code: string): string {
  let out = code.replace(/;?[ \t]*plt\.show\(\)/g, "");
  out = commentPreloadedImports(out);
  out = out.replace(
    /(#\s*1\)\s*데이터 입력[^\n]*\n)/,
    `$1# ▶ Python in Excel: 임베드된 데이터 대신 시트를 참조하려면 예) x = np.asarray(xl("범위 또는 표"), float).ravel()\n`
  );
  return out;
}

/** 확률분포·모델 적합 코드 팝업의 '엑셀 적용 코드' 탭 안내(코드 위·글머리) */
export const PIE_CODE_NOTE: string[] = [
  "scipy·numpy·matplotlib만 써서 =PY()에서 대부분 그대로 실행됩니다.",
  "데이터가 코드에 임베드돼 있습니다 — 시트를 쓰려면 xl(\"범위/표\")로 바꾸세요(주석에 예시).",
  "결과는 마지막 줄에 둡니다 — 셀에는 마지막 식 값이 반환되고 print는 진단(Diagnostics) 창으로 갑니다.",
  "np·pd·plt 등 기본 로드 패키지의 import 줄은 주석 처리했습니다(scipy 등은 import 필요).",
  "그림은 셀당 1개만 반환 — 여러 그래프는 셀을 나눠 마지막 줄에 plt.gcf()를 두세요(불필요한 plt.show()는 제거).",
];

export const PACKAGE_STATUS_META: Record<
  ExcelPackageStatus,
  { label: string; color: string }
> = {
  available: { label: "패키지 사용 가능", color: "teal" },
  partial: { label: "일부 패키지 제한", color: "amber" },
  unavailable: { label: "일부 패키지 미지원", color: "rose" },
};

export { METHOD_EXCEL_CODE } from "./methodExcelCodeData";
