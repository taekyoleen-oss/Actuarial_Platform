import fs from "node:fs";
import path from "node:path";

/**
 * 보험이론 사전 — 폴더 기반 정적 자료실.
 * public/theory/<topic>/ 의 .html/.pdf 를 빌드 시점에 목록화한다(런타임 fs·DB 미사용).
 * 자료 추가 = 해당 폴더에 파일을 커밋·푸시(재배포 시 반영). 규칙은 각 폴더 README.md 참고.
 */
export const THEORY_TOPICS = [
  { slug: "life", name: "생명보험" },
  { slug: "general", name: "손해보험" },
  { slug: "statistics", name: "보험통계" },
] as const;

export type TheoryTopicSlug = (typeof THEORY_TOPICS)[number]["slug"];

export interface TheoryItem {
  /** 파일명(확장자 제외) — 라우트 파라미터이자 html/pdf/svg 짝 매칭 키 */
  base: string;
  /** 표시 제목 — html <title>의 "한글명 (영문명)" 우선, 폴백은 displayTitle() */
  title: string;
  htmlPath: string | null;
  pdfPath: string | null;
  /** 같은 파일명.svg — 카드 커버 일러스트 (theory-publisher 스킬이 생성) */
  coverPath: string | null;
}

const ROOT = path.join(process.cwd(), "public", "theory");

/** html <title>에서 표시 제목 추출: "한글명 (영문명) — 학습 해설서" → "한글명 (영문명)".
 *  공백으로 둘러싸인 대시(—·–·-) 이후 꼬리를 제거하므로 "Chain-ladder" 같은
 *  단어 내 하이픈은 보존된다. 형식이 없으면 null → 파일명 규칙으로 폴백. */
function titleFromHtml(filePath: string): string | null {
  try {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 2000);
    const m = head.match(/<title>([^<]+)<\/title>/i);
    if (!m) return null;
    const t = m[1].split(/\s+[—–-]\s+/)[0].trim();
    return t || null;
  } catch {
    return null;
  }
}

/** 표시 제목 폴백 규칙(2026-06-11 사용자 결정):
 *  숫자 접두사("01_") 제거 → "_"는 띄어쓰기로 → "해설서" 단어 제거.
 *  파일명·URL(base)은 바꾸지 않고 표시만 정리한다. */
function displayTitle(base: string): string {
  const t = base
    .replace(/^\d+[\s._-]*/, "")
    .split(/_+/)
    .join(" ")
    .split(/\s+/)
    .filter((w) => w !== "해설서")
    .join(" ")
    .trim();
  return t || base;
}

export function listTheoryItems(topic: TheoryTopicSlug): TheoryItem[] {
  const dir = path.join(ROOT, topic);
  if (!fs.existsSync(dir)) return [];

  const map = new Map<string, TheoryItem>();
  for (const file of fs.readdirSync(dir)) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== ".html" && ext !== ".pdf" && ext !== ".svg") continue;
    const base = file.slice(0, -ext.length);
    const item = map.get(base) ?? {
      base,
      title: displayTitle(base),
      htmlPath: null,
      pdfPath: null,
      coverPath: null,
    };
    const url = `/theory/${topic}/${encodeURIComponent(file)}`;
    if (ext === ".html") {
      item.htmlPath = url;
      // 영문 병기 제목(2026-06-11 사용자 요청): html <title>에서 자동 추출
      item.title = titleFromHtml(path.join(dir, file)) ?? item.title;
    } else if (ext === ".pdf") item.pdfPath = url;
    else item.coverPath = url;
    map.set(base, item);
  }
  // html이 있는 자료만 목록화(본문 열람은 HTML 기준 — 2026-06-11 사용자 결정).
  // pdf·svg는 같은 base명일 때 부속물로만 매칭. 파일명 가나다순(숫자 접두사로 순서 지정 가능)
  return [...map.values()]
    .filter((i) => i.htmlPath)
    .sort((a, b) => a.base.localeCompare(b.base, "ko"));
}

export function getTheoryTopic(slug: string) {
  return THEORY_TOPICS.find((t) => t.slug === slug);
}

export function getTheoryItem(topic: TheoryTopicSlug, base: string) {
  return listTheoryItems(topic).find((i) => i.base === base);
}
