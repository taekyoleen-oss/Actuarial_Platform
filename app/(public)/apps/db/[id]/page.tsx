import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, Target, ExternalLink, Info } from "lucide-react";
import { DbErdView } from "@/components/feature/db/DbErd";
import { DB_ORDER, getDb, getRiskSpec } from "@/lib/publicDb";

export function generateStaticParams() {
  return DB_ORDER.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = getDb(id);
  if (!data) return { title: "주요 공공DB | Insurance Insights Board" };
  return {
    title: `${data.profile.fullName} | 주요 공공DB`,
    description: data.profile.tagline,
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-medium text-foreground">
      <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
      {children}
    </h2>
  );
}

export default async function PublicDbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getDb(id);
  if (!data) notFound();
  const { profile, erd } = data;

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <Link
        href="/apps"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tertiary transition-colors hover:text-primary"
      >
        <ArrowLeft size={15} /> 모델분석 · 업무지원 앱
      </Link>

      {/* 헤더 */}
      <p className="mt-6 text-[13px] font-bold tracking-[0.14em] text-brand-sky">
        주요 공공DB
      </p>
      <h1 className="mt-2 text-[28px] font-bold tracking-tight text-foreground sm:text-[35px]">
        {profile.fullName}
      </h1>
      <p className="mt-2 max-w-3xl text-[16px] leading-relaxed text-body">
        {profile.tagline}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="rounded border border-border bg-white px-2.5 py-1 font-medium text-tertiary">
          {profile.provider}
        </span>
        <span className="rounded bg-chip-blue-bg px-2.5 py-1 font-medium text-chip-blue-fg">
          {profile.structure}
        </span>
        {profile.estimated && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--chip-amber-bg)] px-2.5 py-1 font-semibold text-[var(--chip-amber-fg)]">
            <Info size={13} /> 추정 ERD
          </span>
        )}
      </div>

      {/* 추정 ERD 안내 — 원본 스키마가 아닌 공개자료 기반 추정(논리) 모델 */}
      {profile.estimated && (
        <div className="mt-6 flex max-w-3xl items-start gap-2.5 rounded-cover border border-[var(--chip-amber-fg)]/25 bg-[var(--chip-amber-bg)] px-4 py-3.5 text-[13.5px] leading-relaxed text-[var(--chip-amber-fg)]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p>
            <b className="font-semibold">추정 ERD 안내 —</b> 이 ERD는 데이터 제공처의
            실제 물리 스키마가 아니라, 공개된 데이터 구성 설명과 표준 청구 포맷을
            바탕으로 <b className="font-semibold">재구성한 논리(추정) 모델</b>입니다.
            실제 컬럼명·키·테이블 구성은 정식(NDA) 데이터 사양서와 다를 수 있으며,
            아래 문서에 한국 유사 데이터와의 대응 매핑·비교 분석을 함께 정리했습니다.
          </p>
        </div>
      )}

      {/* 개요 */}
      <div className="mt-10 max-w-3xl space-y-4 text-[15px] leading-relaxed text-body">
        {profile.summary.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* 핵심 제원 */}
      <section className="mt-10">
        <dl className="grid gap-px overflow-hidden rounded-cover border border-border bg-border sm:grid-cols-2">
          {profile.facts.map((f) => (
            <div key={f.label} className="bg-white p-4">
              <dt className="text-[12px] font-semibold tracking-wide text-brand-sky">
                {f.label}
              </dt>
              <dd className="mt-1 text-[15px] leading-snug text-foreground">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 특성: 강점 / 유의점 / 활용 */}
      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <FeatureCard
          icon={<CheckCircle2 size={18} className="text-brand-sky" />}
          title="강점"
          items={profile.strengths}
        />
        <FeatureCard
          icon={<AlertTriangle size={18} className="text-chip-amber-fg" />}
          title="유의점"
          items={profile.cautions}
        />
        <FeatureCard
          icon={<Target size={18} className="text-brand-sky" />}
          title="활용"
          items={profile.uses}
        />
      </section>

      {/* DB 구조(ERD) — 네이티브 ERD 우선. embedHtml은 보조(전체 비교 문서) 링크로만 노출 */}
      <section className="mt-16">
        <SectionTitle>DB 구조 (ERD){profile.estimated && " · 추정"}</SectionTitle>
        {erd ? (
          <>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tertiary">
              키값(조인키)으로 테이블이 상호 연결됩니다. 박스는 키 컬럼만 간단히 보여
              연결선이 잘 보이도록 했고, <b>테이블을 누르면</b> 그 테이블의 연결선·연결
              키값(칩)·연결 목록·전체 컬럼 설명이 함께 표시됩니다.
              {getRiskSpec(profile.id) &&
                " 우측 ‘위험률 개발 필드 강조’ 버튼을 누르면 다음 위험률 자료를 만들 때 꼭 필요한 필드만 부각됩니다."}
            </p>
            {profile.embedHtml && (
              <div className="mt-4 flex justify-end">
                <a
                  href={profile.embedHtml}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  한일 구조 비교 전체 문서(매핑) 새 탭에서 보기{" "}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            <div className="mt-6">
              <DbErdView erd={erd} riskSpec={getRiskSpec(profile.id)} />
            </div>
          </>
        ) : profile.embedHtml ? (
          <>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tertiary">
              공개 자료로 재구성한 논리(추정) ERD와 한국 유사 데이터(NHIS) 대응 매핑·비교
              분석을 담은 레퍼런스 문서입니다. 실제 물리 스키마와 다를 수 있습니다.
            </p>
            <div className="mt-6 flex justify-end">
              <a
                href={profile.embedHtml}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                새 탭에서 전체 보기 <ExternalLink size={14} />
              </a>
            </div>
            <div className="mt-2 overflow-hidden rounded-cover border border-border bg-white shadow-card">
              <iframe
                src={profile.embedHtml}
                title={`${profile.fullName} ERD`}
                className="h-[820px] w-full border-0 bg-white"
                loading="lazy"
              />
            </div>
          </>
        ) : null}
      </section>

      {/* 출처 */}
      <section className="mt-12">
        <h3 className="text-sm font-semibold text-tertiary">출처</h3>
        <ul className="mt-2 space-y-1.5">
          {profile.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1.5 text-[14px] text-primary hover:underline"
              >
                <ExternalLink size={14} className="mt-0.5 shrink-0" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-placeholder">
          ERD·컬럼 정의는 SQL_Builder(DB 코드생성앱) 카탈로그의 공식 레이아웃 기반이며,
          DB 특성은 위 기관 자료를 참고해 정리했습니다. 표본 규모·기간 등 세부 수치는
          제공 기관의 최신 공지를 확인하세요.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-cover border border-border bg-white p-5 shadow-card">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 text-[14px] leading-relaxed text-body"
          >
            <span
              aria-hidden
              className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-brand-sky"
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
