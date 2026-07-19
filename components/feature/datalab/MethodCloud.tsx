"use client";

/**
 * 통계·ML·계리 파이썬 사전 — /datalab 상단.
 * PC(md+): 사분면 2차원 그래프 — 4개 카테고리(기초 통계·회귀/통계모형·머신러닝·보험/계리)가
 *   각 사분면(카테고리 이름은 사각형 바깥), 가로축=사용 빈도(중심 세로선에 가까울수록 자주),
 *   세로축=난이도(중심 가로선에서 멀수록 어려움). 데이터 핸들링(wrangle)은 각 셀 콤보박스가
 *   주 동선이므로 사분면 대신 아래 컴팩트 칩 스트립으로 둔다(팝업 동작은 동일).
 * 모바일(md 미만): 5개 카테고리 클러스터 워드클라우드 폴백.
 * 클릭 시 팝업 2탭: [정의 및 방법](이론·산출식·활용·해석) / [코드 적용](파라미터·코드·복사·실행기).
 *   코드 탭은 섹션별 기본/고급 수준 칩 + [전체|기본|고급] 필터, 글자 확대/축소(가−/가+).
 * 칩 색은 뮤트 팔레트(--chip-*) 한정 스코프(카테고리 고정색 + 수준 칩 slate/cyan).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { X, ChevronDown } from "lucide-react";
import {
  STAT_CATEGORIES,
  STAT_METHODS,
  methodFullCode,
  type MethodCategory,
  type MethodChipColor,
  type MethodCodeSection,
  type StatMethod,
} from "@/lib/statMethods";
import { METHOD_THEORY } from "@/lib/methodTheory";
import { METHOD_OPTION_DOCS } from "@/lib/methodOptionDocs";
import {
  METHOD_EXCEL_CODE,
  PIE_GENERAL_NOTE,
  PACKAGE_STATUS_META,
  noteToBullets,
  toExcelPython,
} from "@/lib/methodExcelCode";
import { useRunner } from "@/components/feature/datalab/RunnerContext";
import {
  CodeBlock,
  CopyButton,
  Prose,
} from "@/components/feature/datalab/code-popup";
import { DistCodeDialog } from "@/components/feature/datalab/DistCodeDialog";
import {
  FunctionSearch,
  type SearchItem,
} from "@/components/feature/datalab/FunctionSearch";
import {
  WRANGLE_SNIPPET_GROUPS,
  snippetInsertCode,
  type WrangleSnippet,
} from "@/lib/wrangleSnippets";
import {
  PLOT_SNIPPET_GROUPS,
  plotInsertCode,
  type PlotSnippet,
} from "@/lib/plotSnippets";
import { Tex } from "@/components/feature/datalab/Tex";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";
import { usePinnableDialog } from "@/components/feature/datalab/usePinnableDialog";
import {
  useDatalabOverrides,
  mergeMethod,
  mergeTheory,
  type OverrideData,
} from "@/lib/datalabOverrides";
import { OverrideEditPanel, type OvEditField } from "@/components/feature/datalab/OverrideEditPanel";

/** 사분면에 배치되는 카테고리 — wrangle은 아래 칩 스트립으로 분리 */
const QUAD_CATEGORIES: MethodCategory[] = STAT_CATEGORIES.filter(
  (c) => c.id !== "wrangle"
);
const WRANGLE_CATEGORY = STAT_CATEGORIES.find((c) => c.id === "wrangle")!;

/* 빈도(1~5) → 글자 크기·굵기 — 클수록 실무에서 자주 쓰는 방법 */
const SIZE: Record<number, { fs: number; fw: number }> = {
  1: { fs: 13, fw: 500 },
  2: { fs: 14.5, fw: 500 },
  3: { fs: 17, fw: 500 },
  4: { fs: 20.5, fw: 600 },
  5: { fs: 25, fw: 600 },
};

/* 웹 실행기 미지원 표시 — 실행 불가(none)는 회색, 일부만(partial)은 점선 밑줄 */
const WEB_NONE_COLOR = "#9a9ca1";
function webTermStyle(
  m: StatMethod,
  catColor: MethodChipColor
): { color: string; borderBottom?: string } {
  const support = m.webSupport ?? "full";
  return {
    color: support === "none" ? WEB_NONE_COLOR : `var(--chip-${catColor}-fg)`,
    borderBottom:
      support === "partial" ? "1.5px dashed currentColor" : undefined,
  };
}
const WEB_LIMITED = STAT_METHODS.filter((m) => (m.webSupport ?? "full") !== "full");

/* SSR 안전 결정적 해시 — 모바일 클러스터에서 크기가 섞여 보이게 */
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ───────────────── 팝업 (정의 및 방법 / 코드 적용 2탭) ───────────────── */

const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.6;

type DialogTab = "theory" | "code" | "excel" | "options";
type LevelFilter = "all" | "basic" | "advanced";
type SectionLevel = "basic" | "advanced";

/** 섹션 수준 — 미지정은 기본으로 취급 */
const levelOf = (s: MethodCodeSection): SectionLevel => s.level ?? "basic";

/** 수준 칩 색 — 카테고리 고정색(blue/violet/teal/rose/amber)과 겹치지 않는 저채도 2색 */
const LEVEL_META: Record<SectionLevel, { label: string; chip: "slate" | "cyan" }> = {
  basic: { label: "기본", chip: "slate" },
  advanced: { label: "고급", chip: "cyan" },
};

const LEVEL_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "basic", label: "기본" },
  { key: "advanced", label: "고급" },
];

function LevelChip({ level, fontSize }: { level: SectionLevel; fontSize: number }) {
  const { label, chip } = LEVEL_META[level];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-medium"
      style={{
        fontSize,
        background: `var(--chip-${chip}-bg)`,
        color: `var(--chip-${chip}-fg)`,
      }}
      title={
        level === "basic"
          ? "기본 — 하이퍼파라미터·변수를 지정해 바로 결과를 산출하는 첫 실행 경로"
          : "고급 — 최적화·튜닝·교차검증·진단·시뮬레이션"
      }
    >
      {label}
    </span>
  );
}

/** [엑셀 적용 코드] 탭 — Python in Excel(=PY()) 적용 코드. 없으면 공통 안내 + 폴백 */
function ExcelCodePanel({
  method,
  fz,
  fontScale,
}: {
  method: StatMethod;
  fz: (px: number) => { fontSize: number };
  fontScale: number;
}) {
  const data = METHOD_EXCEL_CODE[method.id];
  return (
    <div>
      {/* 공통 차이점 안내 — 코드 위(글머리) */}
      <div
        className="rounded px-4 py-3 text-body"
        style={{
          ...fz(13),
          background: "color-mix(in srgb, var(--chip-cyan-bg) 55%, white)",
        }}
      >
        <span className="font-semibold text-foreground">
          엑셀의 Python(=PY())에서 쓰는 법
        </span>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-[1.7] marker:text-tertiary">
          {PIE_GENERAL_NOTE.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {data ? (
        <>
          {/* 이 방법의 패키지 상태 + 차이점 */}
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <span
              className="mt-0.5 inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: `var(--chip-${PACKAGE_STATUS_META[data.packageStatus].color}-bg)`,
                color: `var(--chip-${PACKAGE_STATUS_META[data.packageStatus].color}-fg)`,
              }}
            >
              {PACKAGE_STATUS_META[data.packageStatus].label}
            </span>
            <ul
              className="min-w-[12rem] flex-1 list-disc space-y-1 pl-4 leading-[1.7] text-body marker:text-tertiary"
              style={fz(13.5)}
            >
              {noteToBullets(data.note).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          {/* 적응 코드 섹션 */}
          {data.sections.map((s, i) => (
            <div key={`${s.title}-${i}`} className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground" style={fz(15)}>
                  {data.sections.length > 1 ? `${i + 1}. ` : ""}
                  {s.title}
                </h3>
                <LevelChip
                  level={s.level}
                  fontSize={Math.round(11 * fontScale * 10) / 10}
                />
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[10.5px] font-medium text-tertiary"
                  title={
                    s.sameAsOriginal
                      ? "데이터 로드 줄 정도만 다르고 로직은 '파이썬 코드 적용' 탭과 사실상 동일"
                      : "Python in Excel 환경에 맞게 로직·API가 바뀜"
                  }
                >
                  {s.sameAsOriginal ? "원본과 거의 동일" : "변경됨"}
                </span>
              </div>
              <CodeBlock
                code={toExcelPython(s.code).trim()}
                codeFz={13.5 * fontScale}
              />
            </div>
          ))}
        </>
      ) : (
        <p
          className="mt-4 rounded bg-surface px-4 py-3 leading-relaxed text-tertiary"
          style={fz(12.5)}
        >
          이 방법의 <strong>Python in Excel</strong> 적용 코드는 준비 중입니다. 위
          공통 차이점(데이터는 <code>xl()</code> · print는 진단창 · Anaconda
          패키지)을 <strong>파이썬 코드 적용</strong> 탭의 코드에 적용해 사용하세요.
        </p>
      )}
    </div>
  );
}

/**
 * [파라미터·옵션] 탭 — 파이썬·엑셀(=PY()) 공통의 함수 인자 심화 해설(사용자 요청 2026-07-19).
 * 기존 '주요 파라미터 요약'(method.params)을 이 탭으로 옮기고,
 * METHOD_OPTION_DOCS(fit_intercept·solver·거리 metric 등 값 후보·선택 기준)를 더한다.
 */
function OptionsPanel({
  method,
  color,
  fz,
}: {
  method: StatMethod;
  color: MethodChipColor;
  fz: (px: number) => { fontSize: number };
}) {
  const groups = METHOD_OPTION_DOCS[method.id] ?? [];
  return (
    <div>
      <p
        className="rounded px-4 py-2.5 text-body"
        style={{
          ...fz(13),
          background: "color-mix(in srgb, var(--chip-cyan-bg) 55%, white)",
        }}
      >
        여기 설명은 <strong>파이썬 코드 적용</strong>과{" "}
        <strong>엑셀 코드 적용</strong>(=PY()) 어느 쪽에든 공통으로 적용됩니다.
      </p>

      {method.params.length > 0 ? (
        <div className="mt-5">
          <h3 className="font-semibold text-foreground" style={fz(15)}>
            주요 파라미터 요약
          </h3>
          <dl className="mt-2 divide-y divide-border rounded border border-border">
            {method.params.map((p) => (
              <div key={p.name} className="px-3.5 py-2.5">
                <dt>
                  <code
                    className="font-mono font-medium"
                    style={{ ...fz(13), color: `var(--chip-${color}-fg)` }}
                  >
                    {p.name}
                  </code>
                </dt>
                <dd className="mt-0.5 leading-[1.75] text-body" style={fz(13.5)}>
                  {p.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {groups.map((g) => (
        <div key={g.func} className="mt-6">
          <h3 className="font-semibold text-foreground" style={fz(15)}>
            {g.func}
          </h3>
          {g.intro ? (
            <p className="mt-1 leading-[1.8] text-tertiary" style={fz(13.5)}>
              {g.intro}
            </p>
          ) : null}
          <dl className="mt-2 divide-y divide-border rounded border border-border">
            {g.options.map((o) => (
              <div key={o.name} className="px-3.5 py-2.5">
                <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <code
                    className="font-mono font-semibold"
                    style={{ ...fz(13), color: `var(--chip-${color}-fg)` }}
                  >
                    {o.name}
                  </code>
                  {o.values ? (
                    <span className="text-tertiary" style={fz(12.5)}>
                      {o.values}
                    </span>
                  ) : null}
                </dt>
                <dd className="mt-0.5 leading-[1.75] text-body" style={fz(13.5)}>
                  {o.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      {groups.length === 0 ? (
        <p
          className="mt-5 rounded bg-surface px-4 py-3 leading-relaxed text-tertiary"
          style={fz(13)}
        >
          이 방법의 심화 옵션 해설은 준비 중입니다. 위{" "}
          <strong>주요 파라미터 요약</strong>과 코드 탭의 주석을 참고하세요.
        </p>
      ) : null}
    </div>
  );
}

/** [정의 및 방법] 탭 — 이론 레지스트리(METHOD_THEORY)가 있으면 구조화, 없으면 intro+tips 폴백 */
function TheoryPanel({
  method,
  fz,
  fontScale,
}: {
  method: StatMethod;
  fz: (px: number) => { fontSize: number };
  fontScale: number;
}) {
  // 이론 텍스트도 관리자 오버라이드를 덮어 표시(수식·formulas는 원본 고정)
  const { overrides } = useDatalabOverrides();
  const theoryBase = METHOD_THEORY[method.id];
  const theory = theoryBase
    ? mergeTheory(theoryBase, overrides[`theory:${method.id}`])
    : theoryBase;

  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-6 first:mt-0">
      <h3 className="font-semibold text-foreground" style={fz(15)}>
        {title}
      </h3>
      {children}
    </div>
  );

  if (!theory) {
    // 폴백 — 이론 미수록 항목은 기존 개념 설명·해석 포인트를 같은 레이아웃으로
    return (
      <div>
        <Block title="정의 및 개념">
          <Prose text={method.intro} fz={fz(14.5).fontSize} className="mt-2 text-body" />
        </Block>
        {method.tips ? (
          <Block title="해석·의미">
            <Prose text={method.tips} fz={fz(14).fontSize} className="mt-2 text-body" />
          </Block>
        ) : null}
        <p className="mt-6 rounded bg-surface px-4 py-2.5 leading-relaxed text-tertiary" style={fz(12.5)}>
          이 방법의 산출식·활용 해설은 준비 중입니다. 실행 가능한 코드는{" "}
          <strong>파이썬 코드 적용</strong> 탭에서 확인하세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Block title="정의 및 개념">
        <Prose text={theory.definition} fz={fz(14.5).fontSize} className="mt-2 text-body" />
      </Block>

      {theory.formulas.length > 0 ? (
        <Block title="산출식">
          <div className="mt-2 divide-y divide-border rounded border border-border">
            {theory.formulas.map((f) => (
              <div key={f.label} className="px-3.5 py-3">
                <p className="font-medium text-foreground" style={fz(13)}>
                  {f.label}
                </p>
                <div
                  className="mt-1.5 overflow-x-auto py-0.5"
                  style={{ fontSize: Math.round(15 * fontScale * 10) / 10 }}
                >
                  <Tex expr={f.tex} block />
                </div>
                {f.note ? (
                  <p className="mt-1 leading-[1.75] text-tertiary" style={fz(13)}>
                    {f.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Block>
      ) : null}

      <Block title="활용 방법">
        <Prose text={theory.usage} fz={fz(14).fontSize} className="mt-2 text-body" />
      </Block>

      <Block title="해석·의미">
        <Prose text={theory.interpretation} fz={fz(14).fontSize} className="mt-2 text-body" />
      </Block>
    </div>
  );
}

function MethodDialog({
  method: methodBase,
  color,
  categoryLabel,
  fontScale,
  onFontScale,
  onSendToRunner,
  onClose,
}: {
  method: StatMethod;
  color: MethodChipColor;
  categoryLabel: string;
  fontScale: number;
  onFontScale: Dispatch<SetStateAction<number>>;
  // 코드는 팝업이 현재 보여주는 수준 필터 기준으로 넘긴다(전체 복사와 같은 범위)
  onSendToRunner: (m: StatMethod, code: string, level: LevelFilter) => void;
  onClose: () => void;
}) {
  // 기본 탭 = 정의 및 방법(개념을 먼저 이해하고 코드로)
  const [tab, setTab] = useState<DialogTab>("theory");
  const [level, setLevel] = useState<LevelFilter>("all");
  // 앞면 고정(pin) — 축소 창으로 화면 앞에 두고 이동·모퉁이 크기조절
  const pin = usePinnableDialog();
  // 관리자 오버라이드 — 표시할 설명은 DB 오버라이드 병합본(코드·수식은 원본 고정)
  const ov = useDatalabOverrides();
  const methodKey = `method:${methodBase.id}`;
  const theoryKey = `theory:${methodBase.id}`;
  const method = useMemo(
    () => mergeMethod(methodBase, ov.overrides[methodKey]),
    [methodBase, ov.overrides, methodKey]
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (pin.pinned) return; // 고정 중엔 배경 상호작용 유지(Esc·스크롤락 해제)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, pin.pinned]);

  // 글자 확대/축소 — 본문·코드·파라미터에 적용
  const fz = (px: number) => ({ fontSize: Math.round(px * fontScale * 10) / 10 });
  // 함수형 업데이트 — 연속 클릭에도 최신 배율 기준으로 증감
  const step = (d: number) =>
    onFontScale((cur) =>
      Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round((cur + d) * 10) / 10))
    );

  // 수준 필터에 보이는 섹션만 — 전체 복사도 이 기준(주석 결합 규칙은 methodFullCode와 동일)
  const visibleSections = useMemo(
    () =>
      method.sections.filter((s) => level === "all" || levelOf(s) === level),
    [method, level]
  );
  const allCode = useMemo(
    () =>
      level === "all"
        ? methodFullCode(method)
        : visibleSections
            .map((s) => `# ── ${s.title} ──\n${s.code.trim()}`)
            .join("\n\n\n"),
    [method, level, visibleSections]
  );
  const hasAdvanced = method.sections.some((s) => levelOf(s) === "advanced");
  // 수준 필터 UI는 [코드 적용] 탭에만 보이므로, 헤더의 복사·전송 버튼에 현재 범위를 표기
  const scopeSuffix = level === "all" ? "" : ` (${LEVEL_META[level].label})`;

  // ── 관리자 편집 — 원본(코드) 값과의 diff만 오버라이드로 저장 ──
  const theoryBaseForEdit = METHOD_THEORY[methodBase.id];
  const theoryMergedForEdit = theoryBaseForEdit
    ? mergeTheory(theoryBaseForEdit, ov.overrides[theoryKey])
    : undefined;

  const editFields: OvEditField[] = useMemo(() => {
    const f: OvEditField[] = [
      {
        id: "summary",
        label: "한 줄 요약",
        value: method.summary,
        original: methodBase.summary,
        rows: 2,
      },
      {
        id: "intro",
        label: "개념·용도 (코드 탭 상단)",
        value: method.intro,
        original: methodBase.intro,
        rows: 6,
      },
      {
        id: "tips",
        label: "해석·주의 포인트",
        value: method.tips ?? "",
        original: methodBase.tips ?? "",
        rows: 4,
      },
    ];
    if (theoryBaseForEdit && theoryMergedForEdit) {
      f.push(
        {
          id: "definition",
          label: "[정의 및 방법] 정의 및 개념",
          value: theoryMergedForEdit.definition,
          original: theoryBaseForEdit.definition,
          rows: 5,
        },
        {
          id: "usage",
          label: "[정의 및 방법] 활용 방법",
          value: theoryMergedForEdit.usage,
          original: theoryBaseForEdit.usage,
          rows: 4,
        },
        {
          id: "interpretation",
          label: "[정의 및 방법] 해석·의미",
          value: theoryMergedForEdit.interpretation,
          original: theoryBaseForEdit.interpretation,
          rows: 4,
        }
      );
    }
    methodBase.sections.forEach((s, i) => {
      f.push({
        id: `sec:${i}`,
        label: `섹션 ${i + 1} 설명 — ${s.title}`,
        value: method.sections[i]?.desc ?? "",
        original: s.desc ?? "",
        rows: 2,
      });
    });
    return f;
  }, [method, methodBase, theoryBaseForEdit, theoryMergedForEdit]);

  const saveEdits = async (values: Record<string, string>) => {
    const md: OverrideData = {};
    if (values.summary?.trim() && values.summary !== methodBase.summary)
      md.summary = values.summary;
    if (values.intro?.trim() && values.intro !== methodBase.intro)
      md.intro = values.intro;
    if (values.tips?.trim() && values.tips !== (methodBase.tips ?? ""))
      md.tips = values.tips;
    const secArr: (string | null)[] = methodBase.sections.map((s, i) => {
      const v = values[`sec:${i}`] ?? "";
      return v.trim() && v !== (s.desc ?? "") ? v : null;
    });
    if (secArr.some(Boolean)) md.sectionDescs = secArr;

    const td: OverrideData = {};
    if (theoryBaseForEdit) {
      if (
        values.definition?.trim() &&
        values.definition !== theoryBaseForEdit.definition
      )
        td.definition = values.definition;
      if (values.usage?.trim() && values.usage !== theoryBaseForEdit.usage)
        td.usage = values.usage;
      if (
        values.interpretation?.trim() &&
        values.interpretation !== theoryBaseForEdit.interpretation
      )
        td.interpretation = values.interpretation;
    }

    if (Object.keys(md).length > 0) await ov.save(methodKey, md);
    else if (ov.overrides[methodKey]) await ov.remove(methodKey);
    if (Object.keys(td).length > 0) await ov.save(theoryKey, td);
    else if (ov.overrides[theoryKey]) await ov.remove(theoryKey);
    setEditing(false);
  };

  const resetEdits = async () => {
    if (ov.overrides[methodKey]) await ov.remove(methodKey);
    if (ov.overrides[theoryKey]) await ov.remove(theoryKey);
    setEditing(false);
  };

  return (
    <div
      className={pin.overlayClass}
      role="dialog"
      aria-modal={!pin.pinned}
      aria-label={`${method.name} 파이썬 코드와 설명`}
      onClick={pin.pinned ? undefined : onClose}
    >
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[84vh] sm:rounded-cover"
        style={pin.panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {pin.ResizeHandles()}
        <header
          className="border-b border-border px-5 py-4 sm:px-6"
          {...pin.dragHandleProps}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                  style={{
                    background: `var(--chip-${color}-bg)`,
                    color: `var(--chip-${color}-fg)`,
                  }}
                >
                  {categoryLabel}
                </span>
                <h2 className="text-[19px] font-semibold text-foreground">
                  {method.name}
                </h2>
                <span className="text-[13.5px] text-tertiary">{method.en}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-tertiary">
                {method.summary}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {ov.isAdmin ? (
                <button
                  type="button"
                  onClick={() => setEditing((e) => !e)}
                  aria-pressed={editing}
                  title="관리자: 이 팝업의 설명 텍스트를 수정합니다(코드·수식 제외)"
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11.5px] font-medium ${
                    editing
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-tertiary hover:text-foreground"
                  }`}
                >
                  ✎ 편집
                </button>
              ) : null}
              {pin.PinButton()}
              {/* 글자 확대/축소 */}
              <div className="flex items-center rounded border border-border">
                <button
                  type="button"
                  onClick={() => step(-0.1)}
                  disabled={fontScale <= FONT_SCALE_MIN}
                  aria-label="글자 작게"
                  className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
                >
                  가−
                </button>
                <button
                  type="button"
                  onClick={() => onFontScale(1)}
                  aria-label="글자 크기 원래대로"
                  title="원래 크기로"
                  className="min-w-[42px] border-x border-border px-1 py-1 text-center text-[11px] tabular-nums text-tertiary hover:text-foreground"
                >
                  {Math.round(fontScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => step(0.1)}
                  disabled={fontScale >= FONT_SCALE_MAX}
                  aria-label="글자 크게"
                  className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
                >
                  가+
                </button>
              </div>
              {/* 코드 복사·실행기 전송은 [코드 적용] 탭 전용 액션 — 이론 탭에선 숨김 */}
              {tab === "code" ? (
                <>
                  <CopyButton text={allCode} label={`전체 코드 복사${scopeSuffix}`} />
                  {/* 데이터 핸들링은 통짜 로드 대신 각 셀 콤보박스로 삽입 → 버튼 숨김 */}
                  {method.category !== "wrangle" ? (
                    <button
                      type="button"
                      onClick={() => onSendToRunner(method, allCode, level)}
                      className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-[11.5px] font-medium text-tertiary hover:text-foreground"
                      title={
                        level === "all"
                          ? "‘파이썬 코드 실행’ 탭 실행기에 이 코드를 담고 그 탭으로 이동합니다"
                          : `‘파이썬 코드 실행’ 탭 실행기에 ${LEVEL_META[level].label} 수준 코드만 담고 그 탭으로 이동합니다`
                      }
                    >
                      ▶ 실행기로 보내기{scopeSuffix}
                    </button>
                  ) : null}
                </>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="ml-0.5 text-tertiary hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* 탭 — [정의 및 방법 | 코드 적용] */}
        <div
          role="tablist"
          aria-label="방법 설명 종류"
          className="flex items-center gap-1 border-b border-border px-5 pt-2 sm:px-6"
        >
          {(
            [
              { key: "theory", label: "정의 및 방법" },
              { key: "code", label: "파이썬 코드 적용" },
              { key: "excel", label: "엑셀 코드 적용" },
              { key: "options", label: "파라미터·옵션" },
            ] as { key: DialogTab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t border-b-2 px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "border-[var(--primary)] text-foreground"
                  : "border-transparent text-tertiary hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {editing ? (
            <OverrideEditPanel
              key={methodBase.id}
              fields={editFields}
              hasOverride={
                !!(ov.overrides[methodKey] || ov.overrides[theoryKey])
              }
              onSave={saveEdits}
              onReset={resetEdits}
              onCancel={() => setEditing(false)}
            />
          ) : tab === "theory" ? (
            <TheoryPanel method={method} fz={fz} fontScale={fontScale} />
          ) : tab === "excel" ? (
            <ExcelCodePanel method={method} fz={fz} fontScale={fontScale} />
          ) : tab === "options" ? (
            <OptionsPanel method={method} color={color} fz={fz} />
          ) : (
            <>
          <Prose text={method.intro} fz={fz(14.5).fontSize} className="text-body" />

          {method.category === "wrangle" ? (
            <div
              className="mt-4 rounded px-4 py-2.5 text-[12.5px] leading-relaxed text-body"
              style={{
                background: "color-mix(in srgb, var(--chip-amber-bg) 55%, white)",
              }}
            >
              이 데이터 핸들링 코드는 아래 <strong>파이썬 실행기</strong> 각 셀의{" "}
              <strong>데이터 핸들링 ▾</strong> 콤보박스에서 세부 항목(Join-left,
              Merge-행/열, Groupby-agg, Split 등)으로 골라 셀에 바로 삽입할 수
              있습니다.
            </div>
          ) : null}

          {/* 수준 필터 — 기본(바로 산출) / 고급(최적화·진단·시뮬레이션) */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-tertiary">코드 수준</span>
            <div className="flex items-center rounded border border-border">
              {LEVEL_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={level === f.key}
                  onClick={() => setLevel(f.key)}
                  className={`px-2.5 py-1 text-[12px] font-medium transition-colors first:rounded-l last:rounded-r ${
                    level === f.key
                      ? "bg-surface text-foreground"
                      : "text-tertiary hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-tertiary">
              기본 = 값을 지정해 바로 산출 · 고급 = 최적화·진단·시뮬레이션
              {hasAdvanced ? "" : " (이 방법은 기본 코드만 제공)"}
            </span>
          </div>

          {visibleSections.length === 0 ? (
            <p className="mt-4 rounded bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-tertiary">
              이 방법에는 <strong>{level === "basic" ? "기본" : "고급"}</strong>{" "}
              수준 코드가 없습니다. 위에서 <strong>전체</strong>를 선택해 모든
              코드를 확인하세요.
            </p>
          ) : null}

          {visibleSections.map((s, i) => (
            <div key={s.title} className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground" style={fz(15)}>
                  {visibleSections.length > 1 ? `${i + 1}. ` : ""}
                  {s.title}
                </h3>
                <LevelChip
                  level={levelOf(s)}
                  fontSize={Math.round(11 * fontScale * 10) / 10}
                />
              </div>
              {s.desc ? (
                <p className="mt-1 leading-[1.8] text-tertiary" style={fz(13.5)}>
                  {s.desc}
                </p>
              ) : null}
              <CodeBlock code={s.code.trim()} codeFz={13.5 * fontScale} />
            </div>
          ))}

          {method.params.length > 0 ? (
            <p
              className="mt-6 rounded bg-surface px-4 py-2.5 leading-relaxed text-tertiary"
              style={fz(12.5)}
            >
              파라미터·옵션 해설(fit_intercept·solver·거리 metric 등)은{" "}
              <button
                type="button"
                onClick={() => setTab("options")}
                className="font-medium text-primary hover:underline"
              >
                파라미터·옵션
              </button>{" "}
              탭으로 옮겼습니다 — 파이썬·엑셀 공통.
            </p>
          ) : null}

          {method.tips ? (
            <div className="mt-6 rounded bg-surface px-4 py-3">
              <p className="font-semibold text-foreground" style={fz(13)}>
                해석·주의 포인트
              </p>
              <Prose text={method.tips} fz={fz(13.5).fontSize} className="mt-1 text-body" />
            </div>
          ) : null}
            </>
          )}
        </div>

        <footer className="border-t border-border px-5 py-2.5 text-[12px] text-tertiary sm:px-6">
          {tab === "theory"
            ? "정의·산출식·활용을 먼저 확인한 뒤 '파이썬 코드 적용' 탭에서 실행 가능한 파이썬 코드를 복사하거나 실행기로 보내세요."
            : tab === "excel"
            ? "엑셀 셀에 =PY( 를 입력해 파이썬 편집 모드로 들어간 뒤, 블록의 ‘복사’로 코드를 붙여 넣으세요. 데이터는 xl()로 시트·표를 참조합니다."
            : tab === "options"
            ? "값 후보·기본값·선택 기준 중심의 해설입니다 — 파이썬·엑셀(=PY()) 어느 코드에든 그대로 적용됩니다."
            : "블록의 ‘복사’는 해당 코드만, ‘전체 코드 복사’는 현재 수준 필터에 보이는 블록을 이어붙여 복사합니다."}
        </footer>
      </div>
    </div>
  );
}

/* ───────────────────────── 사분면 2차원 그래프 (md+) ───────────────────────── */

/** 표시 폭 추정 — CJK는 fontSize, 라틴·기호는 0.58배 + 좌우 패딩 */
function estWidth(name: string, fs: number): number {
  let w = 0;
  for (const ch of name) w += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.58;
  return w + 10;
}

interface PlacedItem {
  m: StatMethod;
  color: MethodChipColor;
  x: number;
  y: number;
  fs: number;
  fw: number;
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/* 겹침 회피 이동 후보 — 총 변위(가로 가중 1.6배) 오름차순. 세로 이동 우선.
 * ml 카테고리가 14종으로 늘며 좁은 폭(≈1024px)에서 한 사분면이 붐벼 세로 범위를
 * 200까지 넓혀 탈출 자리를 더 확보한다(넓은 폭에선 가까운 자리가 먼저 뽑혀 무영향). */
const NUDGES: [number, number][] = (() => {
  const out: [number, number][] = [[0, 0]];
  for (let dy = 0; dy <= 200; dy += 10) {
    for (let dx = 0; dx <= 140; dx += 20) {
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) out.push([0, dy], [0, -dy]);
      else if (dy === 0) out.push([dx, 0], [-dx, 0]);
      else out.push([dx, dy], [dx, -dy], [-dx, dy], [-dx, -dy]);
    }
  }
  out.sort(
    (a, b) =>
      Math.abs(a[0]) * 1.6 +
      Math.abs(a[1]) -
      (Math.abs(b[0]) * 1.6 + Math.abs(b[1]))
  );
  return out;
})();

/**
 * 사분면 배치 — 결정적(같은 크기면 같은 결과).
 * 가로: 중심 세로선에서의 거리 ∝ (5-빈도), 세로: 중심 가로선에서의 거리 ∝ 난이도.
 * 겹침은 NUDGES 후보 이동으로 회피, 축 라벨 자리는 장애물로 선점.
 */
function layoutQuadrants(w: number, h: number): PlacedItem[] {
  const cx = w / 2;
  const cy = h / 2;
  const boxes: Box[] = [];
  const overlaps = (r: Box) =>
    boxes.some(
      (b) => !(r.x2 < b.x1 || r.x1 > b.x2 || r.y2 < b.y1 || r.y1 > b.y2)
    );
  // 겹침 넓이 합 — 완전 회피가 불가능할 때 '가장 덜 겹치는' 자리를 고르는 폴백용.
  const overlapArea = (r: Box) =>
    boxes.reduce((sum, b) => {
      const ox = Math.max(0, Math.min(r.x2, b.x2) - Math.max(r.x1, b.x1));
      const oy = Math.max(0, Math.min(r.y2, b.y2) - Math.max(r.y1, b.y1));
      return sum + ox * oy;
    }, 0);
  const boxAt = (x: number, y: number, bw: number, bh: number): Box => ({
    x1: x - bw / 2 - 4,
    y1: y - bh / 2 - 4,
    x2: x + bw / 2 + 4,
    y2: y + bh / 2 + 4,
  });

  // 축 라벨 자리 선점(어려움 ↑/↓, 자주 사용, 빈도 낮음 ×2)
  boxes.push(boxAt(cx, 13, 66, 18));
  boxes.push(boxAt(cx, h - 13, 66, 18));
  boxes.push(boxAt(cx, cy, 78, 22));
  boxes.push(boxAt(44, cy, 68, 18));
  boxes.push(boxAt(w - 44, cy, 68, 18));

  const items = QUAD_CATEGORIES.flatMap((cat, qi) =>
    STAT_METHODS.filter((m) => m.category === cat.id).map((m) => ({
      m,
      color: cat.color,
      qi,
    }))
  );
  // 중심(고빈도)부터 배치해 밀려나는 쪽이 항상 저빈도가 되게
  items.sort(
    (a, b) =>
      b.m.weight - a.m.weight ||
      a.m.difficulty - b.m.difficulty ||
      a.m.id.localeCompare(b.m.id)
  );

  const out: PlacedItem[] = [];
  for (const { m, color, qi } of items) {
    const sX = qi % 2 === 0 ? -1 : 1;
    const sY = qi < 2 ? -1 : 1;
    const { fs, fw } = SIZE[m.weight];
    const tw = estWidth(m.name, fs);
    const th = fs * 1.35;

    // 사분면 내부 허용 범위(중심 십자·바깥 여백 회피)
    const xLo = sX < 0 ? 10 + tw / 2 : cx + 10 + tw / 2;
    const xHi = sX < 0 ? cx - 10 - tw / 2 : w - 10 - tw / 2;
    const yLo = sY < 0 ? 8 + th / 2 : cy + 8 + th / 2;
    const yHi = sY < 0 ? cy - 8 - th / 2 : h - 8 - th / 2;

    // 기준 위치 — 빈도(가로)·난이도(세로)
    const tFreq = (5 - m.weight) / 4;
    const tDiff = (m.difficulty - 1) / 4;
    const minOX = 40 + tw / 2;
    const maxOX = Math.max(minOX, cx - 14 - tw / 2);
    const minOY = 20 + th / 2;
    const maxOY = Math.max(minOY, cy - 12 - th / 2);
    const baseX = cx + sX * (minOX + tFreq * (maxOX - minOX));
    const baseY = cy + sY * (minOY + tDiff * (maxOY - minOY));

    const clamp = (v: number, lo: number, hi: number) =>
      lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));

    let px = clamp(baseX, xLo, xHi);
    let py = clamp(baseY, yLo, yHi);
    // 완전 회피 자리를 찾되, 없으면 '최소 겹침' 자리로 폴백(겹치는 base 그대로 두지 않음).
    let bestX = px;
    let bestY = py;
    let bestOv = Infinity;
    let found = false;
    for (const [dx, dy] of NUDGES) {
      const x = clamp(baseX + dx, xLo, xHi);
      const y = clamp(baseY + dy, yLo, yHi);
      const box = boxAt(x, y, tw, th);
      if (!overlaps(box)) {
        px = x;
        py = y;
        found = true;
        break;
      }
      const ov = overlapArea(box);
      if (ov < bestOv) {
        bestOv = ov;
        bestX = x;
        bestY = y;
      }
    }
    if (!found) {
      px = bestX;
      py = bestY;
    }
    boxes.push(boxAt(px, py, tw, th));
    out.push({ m, color, x: px, y: py, fs, fw });
  }
  return out;
}

function CategoryTag({ cat, align }: { cat: MethodCategory; align: "l" | "r" }) {
  return (
    <div
      className={`flex items-baseline gap-2 ${align === "r" ? "flex-row-reverse text-right" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 self-center rounded-full"
        style={{ background: `var(--chip-${cat.color}-fg)` }}
        aria-hidden
      />
      <span className="text-[16px] font-semibold text-foreground">
        {cat.label}
      </span>
      <span className="hidden text-[13.5px] text-tertiary lg:inline">
        {cat.hint}
      </span>
    </div>
  );
}

function QuadrantChart({
  onOpen,
  highlightId,
}: {
  onOpen: (id: string) => void;
  highlightId: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize((prev) => {
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo(
    () => (size.w > 0 && size.h > 0 ? layoutQuadrants(size.w, size.h) : []),
    [size]
  );

  const axisLabel =
    "pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-white/75 px-1.5 py-px text-[10.5px] text-tertiary";

  return (
    <div className="hidden md:block">
      {/* 카테고리 이름 — 사각형 바깥(위) */}
      <div className="mb-2 flex items-center justify-between px-1">
        <CategoryTag cat={QUAD_CATEGORIES[0]} align="l" />
        <CategoryTag cat={QUAD_CATEGORIES[1]} align="r" />
      </div>

      <div ref={ref} className="relative h-[500px] lg:h-[540px]">
        {/* 사분면 배경 — 카테고리 색, 십자 여백이 축 역할 */}
        {QUAD_CATEGORIES.map((cat, qi) => (
          <div
            key={cat.id}
            className="absolute rounded-[10px]"
            style={{
              width: "calc(50% - 3px)",
              height: "calc(50% - 3px)",
              left: qi % 2 === 0 ? 0 : undefined,
              right: qi % 2 === 1 ? 0 : undefined,
              top: qi < 2 ? 0 : undefined,
              bottom: qi >= 2 ? 0 : undefined,
              background: `color-mix(in srgb, var(--chip-${cat.color}-bg) 55%, white)`,
            }}
            aria-hidden
          />
        ))}

        {/* 축 안내 라벨 */}
        <span className={`${axisLabel} left-1/2 top-1 -translate-x-1/2`}>
          어려움 ↑
        </span>
        <span className={`${axisLabel} bottom-1 left-1/2 -translate-x-1/2`}>
          어려움 ↓
        </span>
        <span
          className={`${axisLabel} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-border font-medium text-foreground`}
        >
          자주 사용
        </span>
        <span className={`${axisLabel} left-2 top-1/2 -translate-y-1/2`}>
          ← 빈도 낮음
        </span>
        <span className={`${axisLabel} right-2 top-1/2 -translate-y-1/2`}>
          빈도 낮음 →
        </span>

        {/* 항목 — 빈도(가로)·난이도(세로) 좌표 배치 */}
        {placed.map((p) => (
          <div
            key={p.m.id}
            className="absolute z-20"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              type="button"
              onClick={() => onOpen(p.m.id)}
              title={p.m.summary}
              className={`method-term whitespace-nowrap rounded px-1 leading-none ${
                highlightId === p.m.id ? "method-term-active" : ""
              }`}
              style={{
                fontSize: p.fs,
                fontWeight: p.fw,
                ...webTermStyle(p.m, p.color),
              }}
            >
              {p.m.name}
            </button>
          </div>
        ))}
      </div>

      {/* 카테고리 이름 — 사각형 바깥(아래) */}
      <div className="mt-2 flex items-center justify-between px-1">
        <CategoryTag cat={QUAD_CATEGORIES[2]} align="l" />
        <CategoryTag cat={QUAD_CATEGORIES[3]} align="r" />
      </div>

      <p className="mt-3 text-center text-[12px] text-tertiary">
        가로축 — 중심 세로선에 가까울수록 자주 사용 · 세로축 — 중심 가로선에서
        위·아래로 멀수록 난이도 높음 (글자가 클수록 자주 쓰는 방법)
      </p>
    </div>
  );
}

/* ──────────── 데이터 핸들링 칩 스트립 (md+, 사분면 아래) ──────────── */

/** 데이터 핸들링 3면 구분(작업 흐름순) — 클릭 → 사분면과 동일한 팝업 */
const WRANGLE_PANES: { label: string; color: string; ids: string[] }[] = [
  {
    label: "입력·선택·필터",
    color: "amber",
    ids: ["data-loading", "select-rows-cols", "filter-condition", "isin", "conditional"],
  },
  { label: "결합·집계", color: "cyan", ids: ["join-merge", "groupby", "pivot"] },
  { label: "정제·변형", color: "slate", ids: ["missing", "sort-dedup", "apply"] },
];

/* wrangle 방법 id → 세부 스니펫(코드 조각) — 각 방법 아래 리스트, 클릭 시 간단 코드 팝업 */
const ALL_WRANGLE_SNIPPETS: WrangleSnippet[] = WRANGLE_SNIPPET_GROUPS.flatMap(
  (g) => g.snippets
);
const snippetById = (id: string) => ALL_WRANGLE_SNIPPETS.find((s) => s.id === id);
const groupSnippetIds = (gid: string) =>
  (WRANGLE_SNIPPET_GROUPS.find((g) => g.id === gid)?.snippets ?? []).map(
    (s) => s.id
  );
const METHOD_SNIPPET_IDS: Record<string, string[]> = {
  "data-loading": groupSnippetIds("load"),
  "select-rows-cols": groupSnippetIds("select"),
  "filter-condition": groupSnippetIds("filter").filter(
    (id) => !id.includes("isin")
  ),
  isin: ["filter-isin", "filter-not-isin"],
  conditional: groupSnippetIds("branch"),
  "join-merge": [...groupSnippetIds("join"), ...groupSnippetIds("concat")],
  groupby: groupSnippetIds("groupby"),
  pivot: groupSnippetIds("pivot"),
  missing: groupSnippetIds("missing"),
  "sort-dedup": groupSnippetIds("sort-dedup"),
  apply: groupSnippetIds("apply-map"),
};
function snippetsForMethod(id: string): WrangleSnippet[] {
  return (METHOD_SNIPPET_IDS[id] ?? [])
    .map(snippetById)
    .filter((s): s is WrangleSnippet => Boolean(s));
}

/**
 * 데이터 핸들링(wrangle)은 사분면 바로 아래 '보이기/숨기기' 접이식 패널로 둔다(기본 접힘).
 * 펼치면 작업 흐름순 3면(선택·필터 / 결합·집계 / 정제·변형)으로 나눠 열람하고,
 * 클릭하면 사분면과 동일한 팝업이 열린다. 실제 삽입은 실행기 셀 콤보박스가 주 동선.
 */
function WranglePanel({
  onOpen,
  onOpenSnippet,
  highlightId,
}: {
  onOpen: (id: string) => void;
  onOpenSnippet: (s: WrangleSnippet) => void;
  highlightId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const total = useMemo(
    () => STAT_METHODS.filter((m) => m.category === "wrangle").length,
    []
  );
  if (total === 0) return null;
  const byId = (id: string) => STAT_METHODS.find((m) => m.id === id);

  return (
    <div className="mt-4 hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-cover border border-border bg-surface/60 px-4 py-2.5 text-left transition-colors hover:bg-surface"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-tertiary transition-transform ${
            open ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: `var(--chip-${WRANGLE_CATEGORY.color}-fg)` }}
          aria-hidden
        />
        <span className="text-[13.5px] font-semibold text-foreground">
          데이터 핸들링
        </span>
        <span className="rounded-full bg-white px-1.5 py-px text-[11px] font-medium text-tertiary">
          {total}
        </span>
        <span className="hidden text-[11.5px] text-tertiary sm:inline">
          입력 · 선택·필터 · 결합·집계 · 정제·변형
        </span>
        <span className="ml-auto text-[12px] font-medium text-tertiary">
          {open ? "접기" : "펼치기"}
        </span>
      </button>

      {open ? (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {WRANGLE_PANES.map((pane) => (
              <div
                key={pane.label}
                className="rounded-cover px-4 py-3.5"
                style={{
                  background: `color-mix(in srgb, var(--chip-${pane.color}-bg) 55%, white)`,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: `var(--chip-${pane.color}-fg)` }}
                    aria-hidden
                  />
                  <span className="text-[13px] font-semibold text-foreground">
                    {pane.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {pane.ids.map((id) => {
                    const m = byId(id);
                    if (!m) return null;
                    const snips = snippetsForMethod(id);
                    return (
                      <div key={id}>
                        <button
                          type="button"
                          onClick={() => onOpen(id)}
                          title={`${m.summary} — 클릭하면 정의·코드 전체 팝업`}
                          className={`method-term rounded px-1 text-[13px] font-semibold leading-snug ${
                            highlightId === id ? "method-term-active" : ""
                          }`}
                          style={{ color: `var(--chip-${pane.color}-fg)` }}
                        >
                          {m.name}
                        </button>
                        {snips.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1 pl-2">
                            {snips.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => onOpenSnippet(s)}
                                title={`${s.desc} — 클릭하면 간단 코드(파이썬·엑셀) 팝업`}
                                className="rounded border border-border bg-white/70 px-1.5 py-0.5 text-[11px] leading-tight text-tertiary transition-colors hover:bg-white hover:text-foreground"
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-tertiary">
            클릭하면 정의·코드 팝업이 열립니다. 실제 삽입은 &lsquo;파이썬 코드 실행&rsquo;
            탭 실행기 각 셀의 &lsquo;데이터 핸들링 ▾&rsquo; 콤보박스에서 세부 항목으로
            바로 할 수 있습니다.
          </p>
        </>
      ) : null}
    </div>
  );
}

/* ──────────── 그래프·시각화 접이식 패널 (사분면 아래, 데이터 핸들링과 동형) ──────────── */

/** 그래프 그룹 → 패널 색 — 칩 뮤트 팔레트 한정 스코프 */
const PLOT_PANE_COLOR: Record<string, string> = {
  eda: "blue",
  diag: "violet",
  interpret: "teal",
};

/**
 * 전처리(탐색)·후처리(진단·해석) 그래프를 한곳에 모은 별도 카테고리(사용자 요청).
 * 분석과 직접 연관된 그래프는 각 방법의 코드 섹션에 포함되고, 일반 그래프는
 * 여기서 열람한다. 클릭 → 간단 코드 팝업, 삽입은 실행기 셀 '그래프 ▾' 콤보박스.
 */
function PlotPanel({
  onOpenSnippet,
}: {
  onOpenSnippet: (s: PlotSnippet) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = useMemo(
    () => PLOT_SNIPPET_GROUPS.reduce((n, g) => n + g.snippets.length, 0),
    []
  );

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-cover border border-border bg-surface/60 px-4 py-2.5 text-left transition-colors hover:bg-surface"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-tertiary transition-transform ${
            open ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: "var(--primary)" }}
          aria-hidden
        />
        <span className="text-[13.5px] font-semibold text-foreground">
          그래프·시각화
        </span>
        <span className="rounded-full bg-white px-1.5 py-px text-[11px] font-medium text-tertiary">
          {total}
        </span>
        <span className="hidden text-[11.5px] text-tertiary sm:inline">
          탐색(EDA) · 모델 진단 · 해석 — 데이터를 그림으로 이해
        </span>
        <span className="ml-auto text-[12px] font-medium text-tertiary">
          {open ? "접기" : "펼치기"}
        </span>
      </button>

      {open ? (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {PLOT_SNIPPET_GROUPS.map((g) => {
              const color = PLOT_PANE_COLOR[g.id] ?? "blue";
              return (
                <div
                  key={g.id}
                  className="rounded-cover px-4 py-3.5"
                  style={{
                    background: `color-mix(in srgb, var(--chip-${color}-bg) 55%, white)`,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: `var(--chip-${color}-fg)` }}
                      aria-hidden
                    />
                    <span className="text-[13px] font-semibold text-foreground">
                      {g.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.snippets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onOpenSnippet(s)}
                        title={`${s.desc} — 클릭하면 간단 코드(파이썬·엑셀) 팝업`}
                        className="rounded border border-border bg-white/70 px-2 py-1 text-[12px] leading-tight text-body transition-colors hover:bg-white hover:text-foreground"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-tertiary">
            탐색은 df(로드한 데이터) 기준, 진단·해석은 자체 완결(인라인 빠른 적합
            포함) 조각입니다. 클릭하면 코드 팝업이 열리고, 삽입은 &lsquo;파이썬
            코드 실행&rsquo; 탭 실행기 각 셀의 &lsquo;그래프 ▾&rsquo;
            콤보박스에서 바로 할 수 있습니다.
          </p>
        </>
      ) : null}
    </div>
  );
}

/* ─────────────────── 모바일 폴백 — 카테고리 클러스터 클라우드 ─────────────────── */

function ClusterCloud({
  onOpen,
  highlightId,
}: {
  onOpen: (id: string) => void;
  highlightId: string | null;
}) {
  const clusters = useMemo(
    () =>
      STAT_CATEGORIES.map((cat) => ({
        cat,
        methods: STAT_METHODS.filter((m) => m.category === cat.id).sort(
          (a, b) => hashOf(a.id) - hashOf(b.id)
        ),
      })),
    []
  );

  return (
    <div className="grid gap-5 md:hidden">
      {clusters.map(({ cat, methods }) => (
        <div
          key={cat.id}
          className="rounded-cover px-4 py-4"
          style={{
            background: `color-mix(in srgb, var(--chip-${cat.color}-bg) 55%, white)`,
          }}
        >
          <div className="mb-2.5 flex items-baseline gap-2">
            <span
              className="h-2 w-2 shrink-0 self-center rounded-full"
              style={{ background: `var(--chip-${cat.color}-fg)` }}
              aria-hidden
            />
            <span className="text-[14.5px] font-semibold tracking-wide text-foreground">
              {cat.label}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 px-1 py-1.5">
            {methods.map((m) => {
              const { fs, fw } = SIZE[m.weight];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOpen(m.id)}
                  title={m.summary}
                  className={`method-term rounded px-1 leading-snug ${
                    highlightId === m.id ? "method-term-active" : ""
                  }`}
                  style={{
                    fontSize: fs,
                    fontWeight: fw,
                    ...webTermStyle(m, cat.color),
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── 섹션 루트 ───────────────────────────── */

export function MethodCloud() {
  const [openId, setOpenId] = useState<string | null>(null);
  // 팝업 글자 배율 — 팝업을 닫았다 열어도 유지
  const [fontScale, setFontScale] = useState(1);
  // 데이터 핸들링 세부 스니펫 — 간단 코드(파이썬·엑셀) 팝업
  const [snippet, setSnippet] = useState<WrangleSnippet | null>(null);
  // 그래프·시각화 스니펫 — 간단 코드 팝업(그래프 패널)
  const [plotSnip, setPlotSnip] = useState<PlotSnippet | null>(null);
  // 실행기는 '파이썬 코드 실행' 탭으로 분리 — 공유 컨텍스트로 코드 전송·탭 전환
  const runner = useRunner();
  // 실행기가 별도 탭이라 클라우드 강조 트리거는 없음(항상 null)
  const highlightId: string | null = null;

  // 팝업이 현재 필터로 보여주는 코드(code)를 그대로 실행기 탭으로 — 화면과 범위가 어긋나지 않게
  const sendToRunner = (m: StatMethod, code: string, level: LevelFilter) => {
    const scope = level === "all" ? "" : ` — ${LEVEL_META[level].label}`;
    runner?.sendToRunner(
      `# ═══ ${m.name} (${m.en})${scope} ═══\n${code}`,
      `${m.name} (${m.en})${scope}`
    );
    setOpenId(null);
  };

  const open = openId ? STAT_METHODS.find((m) => m.id === openId) : undefined;
  const openCat = open
    ? STAT_CATEGORIES.find((c) => c.id === open.category)
    : undefined;

  // 팝업(사전) 열림 중 브라우저 뒤로가기 → 뒤 페이지 이동 대신 팝업만 닫기
  useHistoryDismiss(!!(open && openCat), () => setOpenId(null));

  const searchItems: SearchItem[] = useMemo(
    () =>
      STAT_METHODS.map((m) => {
        const cat = STAT_CATEGORIES.find((c) => c.id === m.category);
        return {
          id: m.id,
          name: m.name,
          summary: m.summary,
          meta: m.en,
          color: cat?.color,
        };
      }),
    []
  );

  return (
    <section
      aria-label="통계·머신러닝 파이썬 사전"
      className="mb-10 rounded-cover bg-white p-6 shadow-card sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[17px] font-semibold text-foreground">
          분석 방법 사전 — 파이썬 코드
        </h2>
        <p className="text-[12.5px] text-tertiary">
          클릭하면 [정의 및 방법 · 파이썬 코드 적용 · 엑셀 코드 적용] 팝업이 열립니다
        </p>
      </div>

      <FunctionSearch
        items={searchItems}
        onOpen={setOpenId}
        placeholder="분석 방법 검색 — 이름·설명 (예: 회귀, 분포, groupby)"
      />

      <QuadrantChart onOpen={setOpenId} highlightId={highlightId} />
      <WranglePanel
        onOpen={setOpenId}
        onOpenSnippet={setSnippet}
        highlightId={highlightId}
      />
      {/* 모바일은 데이터 핸들링을 포함한 5개 카테고리를 클러스터로 */}
      <ClusterCloud onOpen={setOpenId} highlightId={highlightId} />
      {/* 그래프·시각화 — 전처리(탐색)·후처리(진단·해석) 그래프 별도 카테고리 */}
      <PlotPanel onOpenSnippet={setPlotSnip} />

      {/* 웹 실행기 제한 안내 — 회색(실행 불가)·점선(일부만) 표시 설명 */}
      {WEB_LIMITED.length > 0 ? (
        <div className="mt-4 rounded border border-border bg-surface/60 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-foreground">
            &lsquo;파이썬 코드 실행&rsquo; 탭 실행기(브라우저)에서 제한되는 방법
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-tertiary">
            {WEB_LIMITED.map((m) => (
              <li key={m.id}>
                <span
                  className="font-medium text-body"
                  style={{
                    color:
                      m.webSupport === "none" ? WEB_NONE_COLOR : undefined,
                    borderBottom:
                      m.webSupport === "partial"
                        ? "1.5px dashed currentColor"
                        : undefined,
                  }}
                >
                  {m.name}
                </span>
                {" — "}
                {m.webNote}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11.5px] text-tertiary">
            <span style={{ color: WEB_NONE_COLOR }}>회색 이름</span>은 브라우저
            실행기에서 실행할 수 없고(로컬 파이썬에서 이용),{" "}
            <span style={{ borderBottom: "1.5px dashed currentColor" }}>
              점선 밑줄
            </span>
            은 일부 블록만 실행됩니다. 그 밖의 방법은 &lsquo;파이썬 코드 실행&rsquo;
            탭 실행기에서 바로 돌려볼 수 있습니다.
          </p>
        </div>
      ) : null}

      {open && openCat ? (
        <MethodDialog
          // 다른 방법을 열면 탭·수준 필터를 초기 상태로(정의 및 방법 / 전체)
          key={open.id}
          method={open}
          color={openCat.color}
          categoryLabel={openCat.label}
          fontScale={fontScale}
          onFontScale={setFontScale}
          onSendToRunner={sendToRunner}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      {snippet ? (
        <DistCodeDialog
          name={snippet.label}
          en="데이터 핸들링"
          hideFooter
          subtitle="선택한 데이터 핸들링 조각의 코드입니다. ‘엑셀 코드 적용’ 탭에서 Python in Excel용도 함께 볼 수 있습니다."
          tabs={[
            {
              key: "py",
              label: "파이썬 코드 적용",
              code: snippetInsertCode(snippet),
            },
          ]}
          onClose={() => setSnippet(null)}
        />
      ) : null}

      {plotSnip ? (
        <DistCodeDialog
          name={plotSnip.label}
          en="그래프·시각화"
          hideFooter
          subtitle="선택한 그래프 조각의 코드입니다. 열 이름만 바꾸면 실제 데이터에 바로 쓸 수 있고, 실행기 각 셀의 ‘그래프 ▾’ 콤보박스로도 삽입됩니다."
          tabs={[
            {
              key: "py",
              label: "파이썬 코드 적용",
              code: plotInsertCode(plotSnip),
            },
          ]}
          onClose={() => setPlotSnip(null)}
        />
      ) : null}
    </section>
  );
}
