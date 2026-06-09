// 도메인 타입 (설계서 §3 데이터 모델)

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Post {
  id: string;
  category_id: string;
  title: string;
  content: string;
  summary: string | null;
  summary_generated_at: string | null;
  view_count: number;
  author_name: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  post_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

/** 목록 카드용 조인 결과 */
export interface PostListItem extends Post {
  category: Pick<Category, "slug" | "name">;
}

/** 상세용 조인 결과 */
export interface PostDetail extends Post {
  category: Category;
  attachments: Attachment[];
}

export type SortOrder = "latest" | "popular";

/** 기존 보험 뉴스 대시보드(ins_) — 동일 Supabase 프로젝트, 읽기 공개. 보드에서 읽기 전용으로 연동. */
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  summary_short: string | null;
  snippet: string | null;
  source: string | null;
  published_at: string | null;
  category: string | null; // 생명보험 | 손해보험 | 제도·규제 | 상품 | 기타
  edition: string | null; // 08:00 | 14:00
  edition_date: string | null;
  is_representative: boolean;
}

export const NEWS_CATEGORIES = [
  "생명보험",
  "손해보험",
  "제도·규제",
  "상품",
  "기타",
] as const;
