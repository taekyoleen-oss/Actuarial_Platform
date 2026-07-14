// 서버 전용: /datalab 파이썬 실행기 AI 어시스턴트(셀 오류 수정·제안 / 요청 기반 코드 생성).
// Claude Sonnet 호출. 브라우저 Pyodide 환경 제약과 '실제 데이터 스키마'를 프롬프트에
// 넣어, 이미 로드된 DataFrame의 열 이름에 맞는 실행 가능한 코드를 돌려준다.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `당신은 브라우저(Pyodide · WebAssembly Python 3.12)에서 실행되는 데이터 분석 코드를 돕는 어시스턴트입니다.

사용 가능한 라이브러리: numpy, pandas, scipy, statsmodels, scikit-learn, matplotlib, openpyxl.
설치되어 있지 않아 사용 불가: lifelines, xgboost, lightgbm, seaborn, plotly, requests 등(네트워크/미포함 패키지).

규칙:
- 데이터는 이미 로드된 DataFrame 변수(주로 df)나 작업 폴더의 파일(pd.read_csv/read_excel)로 접근합니다. 아래에 주어지는 '데이터 스키마'에 실제로 존재하는 열 이름만 사용하세요. 스키마에 없는 열을 지어내지 마세요.
- 이미 로드된 변수가 있으면 다시 로드하지 말고 그대로 사용하세요.
- 그래프는 matplotlib로 그리고 plt.show()로 표시합니다(백엔드 설정 불필요).
- 파일 다운로드, 네트워크 요청, 시스템 접근은 하지 마세요.
- 코드에는 핵심을 설명하는 한국어 주석을 간결히 답니다.

출력 형식(반드시 지킬 것): 먼저 한두 문장의 짧은 설명(한국어)을 쓰고, 그 다음 파이썬 코드 블록 하나만 출력합니다.
\`\`\`python
<코드>
\`\`\`
코드 블록은 정확히 하나만, 그 밖의 마크다운/표/여러 블록은 쓰지 마세요.`;

export interface PyAssistInput {
  /**
   * fix: 셀 오류 진단·수정 / generate: 요청→새 코드(러너 레벨) /
   * edit: 이 셀을 요청대로 수정·보완 / vars: 실제 세션 변수에 맞게 변수명만 조정
   */
  mode: "fix" | "generate" | "edit" | "vars";
  code?: string;
  error?: string;
  request?: string;
  schema?: string;
  priorCode?: string;
}

export interface PyAssistResult {
  code: string;
  explanation: string;
}

const cap = (s: string | undefined, n: number): string =>
  (s ?? "").slice(0, n);

function buildUserMessage(input: PyAssistInput): string {
  const schema = cap(input.schema, 6000) || "(아직 로드된 데이터가 없습니다)";

  if (input.mode === "edit") {
    return [
      "다음 셀의 파이썬 코드를 아래 '요청'에 맞게 수정하거나 내용을 추가한 '셀 전체 코드'를 제시하세요. 데이터 스키마의 실제 열 이름·변수를 사용하고, 요청과 무관한 부분은 최대한 유지하세요.",
      "",
      "[데이터 스키마(JSON)]",
      schema,
      "",
      "[이전 셀 코드(참고용, 이미 실행됨)]",
      cap(input.priorCode, 6000) || "(없음)",
      "",
      "[현재 셀 코드]",
      cap(input.code, 8000) || "(비어 있음)",
      "",
      "[요청]",
      cap(input.request, 1500) || "(요청 없음)",
    ].join("\n");
  }

  if (input.mode === "vars") {
    return [
      "다음 셀 코드에서 사용하는 '변수 이름'만 조정하세요. 아래 '데이터 스키마'의 vars 키에 있는, 현재 세션에 실제로 존재하는 변수(주로 DataFrame)에 맞게 데이터프레임 등 변수 이름을 바꿉니다.",
      "규칙: 코드의 로직·구조·함수·열 이름·문자열은 그대로 두고, 오직 존재하지 않는 변수를 실제 존재하는 변수 이름으로만 교체합니다. 이미 올바르면 그대로 두세요. 문맥상 알맞은 변수가 없으면 바꾸지 말고 짧게 이유만 설명하세요.",
      "",
      "[데이터 스키마(JSON) — vars 키가 실제 존재하는 변수]",
      schema,
      "",
      "[이전 셀 코드(참고용)]",
      cap(input.priorCode, 6000) || "(없음)",
      "",
      "[현재 셀 코드]",
      cap(input.code, 8000) || "(비어 있음)",
    ].join("\n");
  }

  if (input.mode === "fix") {
    const hasError = (input.error ?? "").trim().length > 0;
    return [
      hasError
        ? "다음 셀의 파이썬 코드가 오류를 냈습니다. 데이터 스키마를 참고해 원인을 진단하고, 오류를 고친 '셀 전체 코드'를 제시하세요."
        : "다음 셀의 파이썬 코드를 데이터 스키마에 비추어 검토하고, 문제가 있거나 개선할 점이 있으면 고친 '셀 전체 코드'를 제시하세요(문제가 없으면 그대로 두되 이유를 설명).",
      "",
      "[데이터 스키마(JSON)]",
      schema,
      "",
      "[셀 코드]",
      cap(input.code, 8000) || "(비어 있음)",
      "",
      hasError ? "[오류 트레이스백]" : "[오류 없음]",
      hasError ? cap(input.error, 4000) : "",
    ].join("\n");
  }
  // generate
  return [
    "아래 '요청'에 맞는 파이썬 코드를 작성하세요. 이미 로드된 데이터(스키마)를 활용하고, 실제 열 이름을 사용하세요. 새로 만든 결과는 print나 그래프로 확인할 수 있게 하세요.",
    "",
    "[데이터 스키마(JSON)]",
    schema,
    "",
    "[이전 셀 코드(참고용, 이미 실행됨)]",
    cap(input.priorCode, 8000) || "(없음)",
    "",
    "[요청]",
    cap(input.request, 1500) || "(요청 없음)",
  ].join("\n");
}

function parseResponse(text: string): PyAssistResult {
  const m = text.match(/```(?:python|py)?\s*\n?([\s\S]*?)```/);
  if (m) {
    return {
      code: m[1].trim(),
      explanation: text.slice(0, m.index).trim(),
    };
  }
  // 코드 블록이 없으면 전체를 설명으로(코드 없음)
  return { code: "", explanation: text.trim() };
}

/** 셀 오류 수정/제안 또는 요청 기반 코드 생성. 실패 시 throw. */
export async function pyAssist(input: PyAssistInput): Promise<PyAssistResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1600,
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  if (!text) throw new Error("empty response");
  return parseResponse(text);
}
