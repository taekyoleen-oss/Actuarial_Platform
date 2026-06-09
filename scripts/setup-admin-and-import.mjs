// 관리자 생성 + content/exclusive-rights PDF → 게시물 일괄 등록 (service_role).
// 실행: node scripts/setup-admin-and-import.mjs
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// --- .env.local 로드 ---
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = "taekyoleen@gmail.com";

const sb = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 카드 제목·설명 (PDF 내용 기반)
const ITEMS = [
  {
    file: "분석보고서_하나손보_변호사선임_현물급부.pdf",
    title: "하나손해보험 자동차사고 변호사선임 현물급부 담보 분석",
    desc: "손해보험 비용담보 최초의 ‘변호사선임 현물급부’ 사례. 2026년 변호사선임비용 규제 강화(자기부담 50%·심급별 한도 분리)에 현금이 아닌 제휴 법무법인의 현물 제공으로 대응한 구조의 독창성·진보성과, 변호사법 제34조(소개·알선 금지) 리스크를 정밀 진단. 정성 추정 78~86점, 배타적사용권 6~12개월 기대.",
  },
  {
    file: "분석보고서_하나손보_신경인지기능검사비.pdf",
    title: "하나손해보험 신경인지기능검사 비용지원비 담보 분석",
    desc: "치매 진단 2단계인 급여 신경인지기능검사(SNSB·CERAD-K·LICA)의 비용을 최초 1회 보전하는 업계 최초 검사비 담보. 선별(MMSE)과 감별(뇌영상) 사이의 보장 공백을 정조준. 손해보험협회 6개월 배타적사용권 부여(만료 ~2026.6.18). 라인업 진입 관문·교차판매 도구로서의 가치를 분석.",
  },
  {
    file: "분석보고서_현대해상_재택간병_프리미엄간병.pdf",
    title: "현대해상 재택간병인 지원·프리미엄 간병 서비스 담보 분석",
    desc: "입원에서 퇴원 후 1년·자택까지 간병인 현물을 연속 제공하여 보장 공백과 간병 일당 담보의 모럴해저드(손해율 300~600%)를 구조적으로 해소. 요양보호사 자격 기반 서비스 품질을 함께 진단. 2종 각각 6개월 배타권(’25.11.19), 출시 직후 월 1만 건 이상 판매.",
  },
  {
    file: "분석보고서_흥국화재_표적치매MRI검사지원비.pdf",
    title: "흥국화재 표적치매약물 치료 중 MRI 검사지원비 담보 분석",
    desc: "알츠하이머 신약 레켐비(레카네맙) 투약 중 부작용(ARIA) 감시용 비급여 뇌 MRI를 회당 50만원·최대 3회 보전. 비급여 검사를 독립 위험으로 재구성한 업계 최초 담보. 한국에자이 협업, 손해보험협회 6개월 배타권(만료 ~2026.7.24).",
  },
];

async function ensureAdmin() {
  const password = randomBytes(9).toString("base64").replace(/[+/=]/g, "") + "!Aa1";
  const { data, error } = await sb.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
  });
  if (error) {
    if (/already/i.test(error.message)) {
      console.log(`[admin] 이미 존재: ${ADMIN_EMAIL} (비밀번호 유지)`);
      // user id 확보 위해 목록 조회
      const { data: list } = await sb.auth.admin.listUsers();
      const u = list?.users?.find((x) => x.email === ADMIN_EMAIL);
      if (u) await sb.from("ib_admins").upsert({ user_id: u.id, email: ADMIN_EMAIL });
      return null;
    }
    throw error;
  }
  await sb.from("ib_admins").upsert({ user_id: data.user.id, email: ADMIN_EMAIL });
  console.log(`[admin] 생성 완료`);
  return { email: ADMIN_EMAIL, password };
}

async function importPosts() {
  const { data: cat } = await sb
    .from("ib_categories")
    .select("id")
    .eq("slug", "exclusive-rights")
    .single();
  if (!cat) throw new Error("exclusive-rights 카테고리 없음 (seed.sql 실행 필요)");

  const dir = "content/exclusive-rights";
  const present = new Set(readdirSync(dir).filter((f) => f.endsWith(".pdf")));
  let created = 0;

  for (let i = 0; i < ITEMS.length; i++) {
    const it = ITEMS[i];
    if (!present.has(it.file)) {
      console.log(`[skip] 파일 없음: ${it.file}`);
      continue;
    }
    // 중복 방지: 동일 제목 존재 시 건너뜀
    const { data: dup } = await sb
      .from("ib_posts")
      .select("id")
      .eq("title", it.title)
      .maybeSingle();
    if (dup) {
      console.log(`[skip] 이미 등록됨: ${it.title}`);
      continue;
    }

    // 1) 게시물 생성
    const { data: post, error: pe } = await sb
      .from("ib_posts")
      .insert({
        category_id: cat.id,
        title: it.title,
        content: it.desc,
        author_name: "보험상품 분석팀",
        is_published: true,
      })
      .select("id")
      .single();
    if (pe) throw pe;

    // 2) Storage 업로드 (ASCII 키, 표시명은 원본 유지)
    const storagePath = `exclusive-rights/${post.id}/doc.pdf`;
    const buf = readFileSync(path.join(dir, it.file));
    const { error: ue } = await sb.storage
      .from("ib-attachments")
      .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });
    if (ue) throw ue;

    // 3) 첨부 메타
    const { error: ae } = await sb.from("ib_attachments").insert({
      post_id: post.id,
      file_name: it.file,
      storage_path: storagePath,
      mime_type: "application/pdf",
      file_size: buf.length,
    });
    if (ae) throw ae;

    created++;
    console.log(`[post] 등록: ${it.title}  (id=${post.id})`);
  }
  return created;
}

(async () => {
  const cred = await ensureAdmin();
  const n = await importPosts();
  console.log("\n========== 결과 ==========");
  if (cred) {
    console.log(`관리자 이메일 : ${cred.email}`);
    console.log(`관리자 비번   : ${cred.password}   ← 첫 로그인 후 변경 권장`);
  } else {
    console.log(`관리자 이메일 : ${ADMIN_EMAIL} (기존 계정, 비번 변경은 Supabase Auth에서)`);
  }
  console.log(`등록된 카드   : ${n}건`);
})();
