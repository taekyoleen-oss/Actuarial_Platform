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
] as const;

export type TheoryTopicSlug = (typeof THEORY_TOPICS)[number]["slug"];

export interface TheoryItem {
  /** 파일명(확장자 제외) — 라우트 파라미터이자 html/pdf/svg 짝 매칭 키 */
  base: string;
  /** 표시 제목 — base에서 "01_" 같은 정렬용 숫자 접두사를 제거한 것 */
  title: string;
  htmlPath: string | null;
  pdfPath: string | null;
  /** 같은 파일명.svg — 카드 커버 일러스트 (theory-publisher 스킬이 생성) */
  coverPath: string | null;
}

const ROOT = path.join(process.cwd(), "public", "theory");

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
      title: base.replace(/^\d+[\s._-]*/, "") || base,
      htmlPath: null,
      pdfPath: null,
      coverPath: null,
    };
    const url = `/theory/${topic}/${encodeURIComponent(file)}`;
    if (ext === ".html") item.htmlPath = url;
    else if (ext === ".pdf") item.pdfPath = url;
    else item.coverPath = url;
    map.set(base, item);
  }
  // 커버(svg)만 있는 항목은 자료가 아니므로 제외. 파일명 가나다순(숫자 접두사로 순서 지정 가능)
  return [...map.values()]
    .filter((i) => i.htmlPath || i.pdfPath)
    .sort((a, b) => a.base.localeCompare(b.base, "ko"));
}

export function getTheoryTopic(slug: string) {
  return THEORY_TOPICS.find((t) => t.slug === slug);
}

export function getTheoryItem(topic: TheoryTopicSlug, base: string) {
  return listTheoryItems(topic).find((i) => i.base === base);
}
