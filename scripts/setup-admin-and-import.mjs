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
  {
    file: "분석보고서_ABL생명_우리WON건강환급보험.pdf",
    title: "ABL생명 우리WON건강환급보험 『건강환급금』 분석",
    desc: "받은 보험금을 뺀 납입보험료를 환급연령(가입연령별 60~85세) 생존 시 돌려주는 국내 최초 청구연동 개별 환급형 건강보험. 신규성은 위험률이 아니라 청구연동 환급(claims-linked ROP)과 이를 구현하는 retrospective 적립 시스템에 있음. 손실회피 고객 정조준·소액청구 억제(손해율 순기능)가 강점이나, 저축성 결합 수익성·불완전판매 민원 리스크 진단. 생명보험협회 9개월 배타권, 정성 추정 약 78점.",
  },
  {
    file: "분석보고서_DB생명_장기요양플러스보장특약.pdf",
    title: "DB생명 장기요양 플러스보장특약I 분석",
    desc: "최초 장기요양 2~5등급 판정 후 4년 내 상위(더 중증) 등급으로 악화 시 1,000만원 1회 지급. 등급 ‘진입’이 아닌 등급 간 ‘이전(악화)’ 자체를 트리거로 삼은 업계 최초 담보. 다중상태(Markov) 이전확률·종단 등급추적 데이터 확보가 진보성이자 모방 진입장벽. 5등급 진입자 4년 내 상향확률 79.4%·사망 경쟁위험 반영 등 정합성 쟁점 검토. 생명보험협회 6개월 배타권(2026.3).",
  },
  {
    file: "분석보고서_교보생명_심폐소생술급여보장특약외1종.pdf",
    title: "교보생명 심폐소생술·제세동 급여보장특약(2종) 분석",
    desc: "급여 심폐소생술(CPR)·제세동·전기적심조율전환 시행 시 가입금액 100%를 1회당 정액 지급. 진단·수술 이전의 응급처치(救命) 영역을 모든 원인·면책·횟수 제한 없이 정액 보장하는 업계 최초 특약. 수가코드 연동 정액(수술비 정액담보)의 변형이라 진보성·카피 취약, 준임종 급부(생존율 9.2%)와 1일 복수코드 지급배수가 손해율 좌우. 종합 추정 약 75점.",
  },
  {
    file: "분석보고서_교보생명_특정자궁질환보장특약.pdf",
    title: "교보생명 특정자궁질환보장특약(급여 초음파 검사비) 분석",
    desc: "다빈도 여성 자궁질환(근종 D25·기타 양성신생물 D26·자궁내막증 N80) 진단비(최초 1회 50만)와 급여 초음파 검사비(연 1회 10만)를 정액 보장. 신규성은 진단비가 아니라 ‘급여 초음파 검사비’로, 보장 축을 확진 이후에서 예방·조기발견으로 전진. HIRA 급여 데이터 기반 산출이 강점이나 검사비 청구 인플레·실손 중복·검사비 정액 카피 용이가 리스크. 6개월 배타권, 종합 추정 약 76점.",
  },
  {
    file: "분석보고서_라이나생명_미세잔존암WGS검사지원형.pdf",
    title: "라이나생명 암생존지원특약(미세잔존암 WGS검사 지원형) 분석",
    desc: "암 최초진단 이후 최대 10년간 매년 생존 시 미세잔존암(MRD) WGS검사를 현물(또는 현금 175만) 지급하는 업계 최초 생존조건부 검사지원 특약. 진단·치료의 다음 단계인 치료 후 추적관찰 공백을 정조준, 전장유전체 기반 ctDNA 분석의 진보성. 생존율 높을수록 누적 지급이 커지는 역방향 비용구조·제3자(Inocras) 벤더 의존 카피·현금전환 모럴해저드 진단. 종합 추정 약 80점.",
  },
  {
    file: "분석보고서_신한라이프_신한톤틴연금보험.pdf",
    title: "신한라이프 신한톤틴연금보험(생존자 재분배) 분석",
    desc: "조기 사망·해지자의 적립 차익(톤틴효과+저해지효과)을 생존자 연금재원에 재분배해 장수할수록·개시를 늦출수록 연금이 커지는(70세 개시 시 일반형 대비 138%) 국내 최초 한국형 톤틴연금. 사망·해지 크레딧 풀링이 본질, 원금손실 제거(사망≥납입·10년 후 해약 100%)가 일본 선례 대비 진보. 장수 역선택·유지율 의존이 핵심 리스크. 생명보험협회 12개월 배타권(생보 역대 두 번째), 종합 추정 약 87점.",
  },
  {
    file: "분석보고서_한화생명_카티라이프수술보장특약.pdf",
    title: "한화생명 카티라이프 무릎 연골재생 수술보장특약 분석",
    desc: "자가 늑연골유래 연골세포 이식술(카티라이프) 시행 시 정액 1,500만원을 최초 1회 지급. 인공관절 이전 단계인 중등도 연골손상(ICRS 3~4등급)의 치료 공백을 업계 최초로 정액 담보화. 제약사(바이오솔루션) 단독 MOU로 신의료기술 위험률을 자체 산출한 점이 진보성이자 모방 진입장벽. 출시 2개월 3.6만건(가입 50·60대 80%) 흥행이 역선택·시행건수 급증 리스크. 생명보험협회 6개월 배타권(2026.2.3~8월).",
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
