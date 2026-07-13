// 클라이언트 전용: Microsoft Graph 연동(내 OneDrive로 사본 업로드 → Excel 웹 열기).
// msal-browser는 window 의존이므로 함수 내부에서 동적 import한다(SSR 안전).
// 시크릿 없음 — SPA PKCE 흐름이라 클라이언트 ID(NEXT_PUBLIC_MS_GRAPH_CLIENT_ID)만 사용.
import type { PublicClientApplication } from "@azure/msal-browser";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SCOPES = ["Files.ReadWrite"];
const AUTHORITY = "https://login.microsoftonline.com/common"; // 개인+조직 계정 공용
const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024; // Graph 단순 업로드 상한(4MB)
const CHUNK_SIZE = 327680 * 16; // 업로드 세션 청크 — 320KiB 배수 필수(5MiB)

/** Azure 앱 등록(클라이언트 ID). 미설정이면 null — 버튼은 비활성 안내로 폴백. */
export function msGraphClientId(): string | null {
  return process.env.NEXT_PUBLIC_MS_GRAPH_CLIENT_ID || null;
}

let pcaPromise: Promise<PublicClientApplication> | null = null;

async function getPca(clientId: string): Promise<PublicClientApplication> {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      const { PublicClientApplication } = await import("@azure/msal-browser");
      const pca = new PublicClientApplication({
        auth: {
          clientId,
          authority: AUTHORITY,
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: "sessionStorage" },
      });
      await pca.initialize();
      return pca;
    })();
  }
  return pcaPromise;
}

/** Files.ReadWrite 토큰 — 기존 계정은 silent, 아니면 로그인 팝업. */
export async function acquireGraphToken(clientId: string): Promise<string> {
  const pca = await getPca(clientId);
  const accounts = pca.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const r = await pca.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0],
      });
      return r.accessToken;
    } catch {
      // 갱신 실패 → 팝업으로 폴백
    }
  }
  const r = await pca.loginPopup({ scopes: SCOPES });
  return r.accessToken;
}

/** OneDrive 파일명 금지 문자 치환. */
function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|#%]/g, "_").trim();
  return cleaned || "workbook.xlsx";
}

export interface UploadedItem {
  webUrl: string;
  name: string;
}

interface DriveItemResponse {
  webUrl?: string;
  name?: string;
}

/**
 * 게시 워크북 사본을 사용자 OneDrive의 {folder}/ 아래에 업로드하고
 * Excel 웹에서 열 수 있는 webUrl을 반환한다.
 * 동일 파일명이 있으면 덮어쓰지 않고 자동 개명(conflictBehavior=rename).
 * 4MB 이하는 단순 PUT, 초과는 업로드 세션(청크, onProgress 0~1 콜백).
 */
export async function uploadToOneDrive(
  token: string,
  blob: Blob,
  fileName: string,
  folder = "DataLab",
  onProgress?: (ratio: number) => void
): Promise<UploadedItem> {
  const name = sanitizeName(fileName);
  const encodedPath = `${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;

  if (blob.size <= SIMPLE_UPLOAD_LIMIT) {
    const res = await fetch(
      `${GRAPH}/me/drive/root:/${encodedPath}:/content?@microsoft.graph.conflictBehavior=rename`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: blob,
      }
    );
    if (!res.ok) throw new Error(`upload_failed_${res.status}`);
    const item = (await res.json()) as DriveItemResponse;
    if (!item.webUrl) throw new Error("upload_incomplete");
    onProgress?.(1);
    return { webUrl: item.webUrl, name: item.name ?? name };
  }

  // 대용량 — 업로드 세션(청크)
  const sess = await fetch(
    `${GRAPH}/me/drive/root:/${encodedPath}:/createUploadSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: { "@microsoft.graph.conflictBehavior": "rename", name },
      }),
    }
  );
  if (!sess.ok) throw new Error(`session_failed_${sess.status}`);
  const { uploadUrl } = (await sess.json()) as { uploadUrl?: string };
  if (!uploadUrl) throw new Error("session_incomplete");

  let offset = 0;
  let item: DriveItemResponse | null = null;
  while (offset < blob.size) {
    const end = Math.min(offset + CHUNK_SIZE, blob.size);
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${offset}-${end - 1}/${blob.size}`,
      },
      body: blob.slice(offset, end),
    });
    if (!res.ok) throw new Error(`chunk_failed_${res.status}`);
    if (res.status === 200 || res.status === 201) {
      item = (await res.json()) as DriveItemResponse;
    }
    offset = end;
    onProgress?.(offset / blob.size);
  }
  if (!item?.webUrl) throw new Error("upload_incomplete");
  return { webUrl: item.webUrl, name: item.name ?? name };
}

/** MSAL/업로드 오류 → 사용자 문구. */
export function graphErrorMessage(e: unknown): string {
  const code =
    (e as { errorCode?: string })?.errorCode ??
    (e instanceof Error ? e.message : "");
  if (code.includes("user_cancelled")) return "로그인이 취소되었습니다.";
  if (code.includes("popup_window_error") || code.includes("empty_window_error"))
    return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
  if (code.includes("interaction_in_progress"))
    return "이미 로그인 창이 열려 있습니다. 열린 창을 완료하거나 닫아 주세요.";
  if (code.includes("_507")) return "OneDrive 저장 공간이 부족합니다.";
  if (code.includes("fetch_failed"))
    return "게시 파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  return "처리에 실패했습니다 — 잠시 후 다시 시도해 주세요.";
}
