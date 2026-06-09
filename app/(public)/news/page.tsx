// 기존 배포된 보험 뉴스 대시보드(insurance-article)를 이 앱 프레임 안에 그대로 임베드.
// 새로 설계하지 않고 운영 중인 사이트를 가져온다. URL은 env로 교체 가능.
const NEWS_URL =
  process.env.NEXT_PUBLIC_NEWS_URL ||
  "https://taekyoleen-oss-insurance-article.vercel.app";

export const metadata = { title: "보험 뉴스 — Insurance Insights Board" };

export default function NewsPage() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <span className="text-sm font-medium text-foreground">보험 뉴스</span>
        <a
          href={NEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary"
        >
          새 탭에서 열기 ↗
        </a>
      </div>
      <iframe
        src={NEWS_URL}
        title="보험 뉴스 대시보드"
        className="w-full flex-1 border-0"
        loading="lazy"
      />
    </div>
  );
}
