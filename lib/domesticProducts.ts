import fs from "node:fs";
import path from "node:path";

/**
 * 국내 보험 정보·분석 > "상품 정보" 항목의 정적 자료.
 * public/domestic/products/ 의 .html 을 빌드 시점에 목록화한다(보험이론 사전 패턴).
 * 각 문서는 완성된 디자인이므로 뷰어에서 iframe으로 원본 그대로 임베드한다.
 * 자료 추가 = 해당 폴더에 .html 커밋·푸시(재배포 시 반영).
 */

export interface ProductItem {
  /** 파일명(확장자 제외) — 라우트 파라미터 */
  base: string;
  /** 카드 제목 — html <title>의 대시 앞부분 */
  title: string;
  /** 카드 보조설명 — html <title>의 대시 뒷부분(영문/비교 설명) */
  subtitle: string;
  /** 카드 본문 설명 — 문서 도입부(<p class="lead">)에서 추출. 없으면 빈 문자열. */
  description: string;
  /** 국내 카테고리 내 노출 항목(서브섹션). 미지정은 '보장내용 분석'. */
  section: string;
  htmlPath: string;
}

/** 정적 자료를 '보장내용 분석'이 아닌 다른 항목에 노출할 때 매핑(2026-06-15). */
const SECTION_OF: Record<string, string> = {
  "silson-insurance-generations": "보험 관련 정보",
};
const DEFAULT_PRODUCT_SECTION = "보장내용 분석";

const ROOT = path.join(process.cwd(), "public", "domestic", "products");

/** 목록 노출 순서(질병 담보여정 → 진단 카탈로그 → 비용 분석). 미지정 파일은 뒤에 가나다순. */
const ORDER = [
  "silson-insurance-generations",
  "cancer-coverage-journey",
  "cerebro-cardiovascular-coverage-journey",
  "metabolic-syndrome-coverage-journey",
  "diabetes-coverage-journey",
  "liver-disease-coverage-journey",
  "lung-disease-coverage-journey",
  "musculoskeletal-coverage-analysis",
  "facial-disease-coverage-analysis",
  "womens-health-coverage-journey",
  "mental-health-coverage-journey",
  "systemic-disease-coverage-journey",
  "dementia-ltc-coverage-journey",
  "geriatric-lifecourse-coverage-journey",
  "diagnosis-coverage-catalog",
  "new-medical-technology-analysis",
  "underwriting-spectrum-coverage-analysis",
  "outpatient-coverage-analysis",
  "care-cost-coverage-analysis",
  "legal-cost-coverage-analysis",
];

/** html <title>에서 "주제 — 보조설명"을 분리. <title> 없으면 파일명으로 폴백. */
function titleParts(filePath: string, base: string): { title: string; subtitle: string } {
  try {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 2000);
    const m = head.match(/<title>([^<]+)<\/title>/i);
    if (m) {
      const full = m[1].trim();
      const parts = full.split(/\s+[—–-]\s+/);
      const title = parts[0].trim();
      const subtitle = parts.slice(1).join(" — ").trim();
      if (title) return { title, subtitle };
    }
  } catch {
    /* 폴백 */
  }
  return { title: base.split(/[-_]+/).join(" "), subtitle: "" };
}

/**
 * 문서 도입부 카피를 카드 설명으로 추출 — <p class="lead">의 텍스트(태그 제거·공백 정리).
 * 모든 자료가 동일한 형태의 '읽는 법' 도입 문단을 가진다(예: 뇌·심혈관의 두 축 설명).
 */
function leadText(filePath: string): string {
  try {
    const html = fs.readFileSync(filePath, "utf8");
    const m = html.match(/<p[^>]*class=["'][^"']*\blead\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    if (m) {
      return m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch {
    /* 폴백: 설명 없음 */
  }
  return "";
}

export function listDomesticProducts(): ProductItem[] {
  if (!fs.existsSync(ROOT)) return [];

  const items: ProductItem[] = [];
  for (const file of fs.readdirSync(ROOT)) {
    if (path.extname(file).toLowerCase() !== ".html") continue;
    const base = file.slice(0, -5);
    const filePath = path.join(ROOT, file);
    const { title, subtitle } = titleParts(filePath, base);
    items.push({
      base,
      title,
      subtitle,
      description: leadText(filePath),
      section: SECTION_OF[base] ?? DEFAULT_PRODUCT_SECTION,
      htmlPath: `/domestic/products/${encodeURIComponent(file)}`,
    });
  }

  return items.sort((a, b) => {
    const ia = ORDER.indexOf(a.base);
    const ib = ORDER.indexOf(b.base);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.base.localeCompare(b.base, "ko");
  });
}

export function getDomesticProduct(base: string): ProductItem | undefined {
  return listDomesticProducts().find((i) => i.base === base);
}
