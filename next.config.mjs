/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse는 서버 전용 — 서버 외부 패키지로 처리
  serverExternalPackages: ["pdf-parse"],
  images: {
    remotePatterns: [
      // Supabase Storage 공개 이미지 (필요 시 호스트 추가)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async rewrites() {
    return [
      // Entra 앱 등록의 SPA 리디렉션 URI(경로 포함)와 동일한 주소를 유지하면서
      // MSAL v5 redirect-bridge를 실행하는 앱 라우트를 서빙
      { source: "/msal-redirect.html", destination: "/msal-redirect" },
    ];
  },
};

export default nextConfig;
