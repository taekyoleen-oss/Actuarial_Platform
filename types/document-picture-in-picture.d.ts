/**
 * Document Picture-in-Picture API 앰비언트 타입 (2026-07-20).
 * 아직 lib.dom 표준에 포함되지 않아 최소 선언만 둔다.
 * https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API
 */
interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
  preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
  readonly window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

interface Window {
  readonly documentPictureInPicture?: DocumentPictureInPicture;
}
