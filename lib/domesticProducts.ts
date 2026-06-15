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
  htmlPath: string;
}

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
  "dementia-ltc-coverage-journey",
  "geriatric-lifecourse-coverage-journey",
  "diagnosis-coverage-catalog",
  "new-medical-technology-analysis",
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

export function listDomesticProducts(): ProductItem[] {
  if (!fs.existsSync(ROOT)) return [];

  const items: ProductItem[] = [];
  for (const file of fs.readdirSync(ROOT)) {
    if (path.extname(file).toLowerCase() !== ".html") continue;
    const base = file.slice(0, -5);
    const { title, subtitle } = titleParts(path.join(ROOT, file), base);
    items.push({
      base,
      title,
      subtitle,
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
