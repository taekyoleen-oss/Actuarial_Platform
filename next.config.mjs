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
};

export default nextConfig;
