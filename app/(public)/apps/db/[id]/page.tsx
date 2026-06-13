import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, Target, ExternalLink } from "lucide-react";
import { DbErdView } from "@/components/feature/db/DbErd";
import { DB_ORDER, getDb } from "@/lib/publicDb";

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
      </div>

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

      {/* DB 구조(ERD) */}
      <section className="mt-16">
        <SectionTitle>DB 구조 (ERD)</SectionTitle>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tertiary">
          좌→우로 개인·명세서(허브)에서 세부내역·기관으로 이어집니다. 테이블 박스를
          누르면 아래에 컬럼·설명이 표시되고, 선이 연결된 테이블이 강조됩니다.
        </p>
        <div className="mt-6">
          <DbErdView erd={erd} />
        </div>
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
