/**
 * 초급 코드 레지스트리 — /datalab 코드 팝업의 [초급 | 고급] 하위 탭(사용자 요청 2026-09-29).
 * 기존 코드는 '고급', 여기 코드는 처음 쓰는 사람이 바로 결과를 보는 가장 짧은 경로.
 *
 * 작성 규약(데이터 파일 lib/beginnerCode/*.ts 공통):
 *  · 블록당 코드 ~12줄 이하. 블록 = 실행기의 셀 하나(# %%로 이어 붙음).
 *  · 블록마다 result(실행 결과 설명)를 단다. 같은 일을 하는 흔한 다른 방법(예: 히스토그램의
 *    df.plot / plt.hist / df.hist)은 alt: true 블록으로 기본 방법 뒤에 덧붙인다.
 *  · 한 줄마다 쉬운 한국어 주석. 결과는 print 대신 마지막 줄에 '값(식)'을 둔다
 *    (실행기는 마지막 식을 보여 주고, 엑셀 =PY()는 그 값을 셀에 반환).
 *  · 분석 방법: 첫 블록에서 샘플을 정확히 pd.read_excel("policy.xlsx") 형태로 읽는다
 *    (인자 없이 — 엑셀 변환이 xl("policy[#All]", headers=True)로 바꾼다).
 *  · 그래프·데이터 핸들링 조각: 고급과 같이 df가 이미 있다고 가정(셀 삽입 문맥).
 *  · 그래프는 pandas .plot() 한두 줄 + plt.show(). 패키지는 pandas·numpy·scipy·
 *    statsmodels·scikit-learn·matplotlib만. 검증: scripts/test-beginner-code.mjs
 */
import { toExcelPython } from "./methodExcelCode";
import { DATA as METHODS_STAT } from "./beginnerCode/methodsStat";
import { DATA as METHODS_ML } from "./beginnerCode/methodsMl";
import { DATA as METHODS_ACT } from "./beginnerCode/methodsAct";
import { DATA as WRANGLE } from "./beginnerCode/wrangle";
import { DATA as PLOT } from "./beginnerCode/plot";

export interface BeginnerBlock {
  /** 블록 제목(셀 머리 주석) */
  title: string;
  code: string;
  /** 실행하면 무엇이 나오는지 — 팝업에서 코드 위에 '결과'로 표시 */
  result?: string;
  /**
   * 같은 일을 하는 '다른 방법'(대안 코드). 팝업에는 함께 보이고, 실행기 셀 삽입에서는
   * 빠진다(기본 방법만 삽입). 대안 블록도 앞 블록 뒤에 순서대로 실행해도 동작해야 한다.
   */
  alt?: boolean;
}

export type BeginnerKind = "method" | "wrangle" | "plot";

const REGISTRY: Record<BeginnerKind, Record<string, BeginnerBlock[]>> = {
  method: { ...METHODS_STAT, ...METHODS_ML, ...METHODS_ACT },
  wrangle: WRANGLE,
  plot: PLOT,
};

export function beginnerBlocks(kind: BeginnerKind, id: string): BeginnerBlock[] | undefined {
  const b = REGISTRY[kind][id];
  return b && b.length > 0 ? b : undefined;
}

/** 블록들을 한 스크립트로 — 블록 사이 # %%(실행기에서 셀 단위로 나뉨) */
export function beginnerScript(blocks: BeginnerBlock[]): string {
  return blocks.map((b) => `# ── ${b.title} ──\n${b.code.trim()}`).join("\n\n# %%\n");
}

/** 초급 코드 → Python in Excel: 공통 변환 + 샘플 파일 읽기를 xl() 표 참조로 */
export function toBeginnerExcel(code: string): string {
  return toExcelPython(code).replace(
    /pd\.read_excel\("([\w가-힣-]+)\.xlsx"\)/g,
    'xl("$1[#All]", headers=True)'
  );
}

/** 초급 탭 상단 안내 */
export const BEGINNER_NOTE =
  "초급 — 가장 짧은 코드로 바로 결과를 봅니다. 열 이름만 내 데이터에 맞게 바꾸면 됩니다. 옵션·진단·튜닝은 [고급] 탭에 있습니다.";
export const BEGINNER_EXCEL_NOTE =
  "초급(엑셀) — 셀에 =PY( 를 입력하고 붙여 넣으세요. xl(\"policy[#All]\", headers=True)의 표 이름은 내 시트의 표/범위(예: \"A1:P601\")로 바꿉니다. 마지막 줄의 값이 셀에 표시됩니다.";

/** 그래프·핸들링 조각의 초급 삽입 텍스트(셀 삽입·팝업 공용) — 없으면 undefined */
export function beginnerSnippetCode(
  kind: "wrangle" | "plot",
  id: string,
  label: string
): string | undefined {
  // 셀 삽입은 기본 방법만(대안은 팝업에서 골라 복사) — 한 셀에 그래프가 여러 장 나오지 않도록
  const b = beginnerBlocks(kind, id)?.filter((x) => !x.alt);
  return b?.length
    ? `# ▸ ${label} (초급)\n${b.map((x) => x.code.trim()).join("\n\n")}`
    : undefined;
}
