import { redirect } from "next/navigation";
import { THEORY_TOPICS } from "@/lib/theory";

// /theory 진입 시 첫 주제(생명보험)로 이동
export default function TheoryIndexPage() {
  redirect(`/theory/${THEORY_TOPICS[0].slug}`);
}
