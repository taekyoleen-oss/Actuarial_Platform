/**
 * 분석 방법 팝업 [엑셀 적용 코드] 탭 — Python in Excel(=PY()) 적용 코드 레지스트리.
 *
 * 키는 lib/statMethods.ts `STAT_METHODS`(계리 8종 포함)의 방법 id와 1:1 대응.
 * 없는 id는 팝업이 공통 차이점 안내 + '코드 적용' 탭 참고 폴백을 보인다.
 * 데이터는 lib/methodExcelCodeData.ts(워크플로우 pie-code 산출). 확대는 그 파일에 id 키 추가.
 */

/** 필요한 패키지의 Python in Excel(Anaconda) 사용 가능 여부 */
export type ExcelPackageStatus = "available" | "partial" | "unavailable";

export interface ExcelCodeSection {
  title: string;
  level: "basic" | "advanced";
  /** 데이터 로드 줄 정도만 바뀌고 로직이 원본과 사실상 동일하면 true */
  sameAsOriginal: boolean;
  code: string;
}

export interface MethodExcelCode {
  packageStatus: ExcelPackageStatus;
  /** 코드 위에 표시할 이 방법의 Python in Excel 적용 차이점 */
  note: string;
  sections: ExcelCodeSection[];
}

/** 모든 방법 공통 — Python in Excel과 브라우저 실행기의 차이(탭 상단 고정 안내) */
export const PIE_GENERAL_NOTE =
  "엑셀의 Python(Python in Excel, =PY())은 아래 브라우저 실행기와 다릅니다. ① 데이터는 파일 읽기 대신 xl(\"범위 또는 표\", headers=True)로 시트를 참조합니다. ② print() 출력은 셀이 아니라 진단(Diagnostics) 창에 표시되고, 셀에는 코드 '마지막 식'의 값이 반환됩니다. ③ Anaconda 배포판의 큐레이션 패키지만 사용할 수 있어(pip 설치 불가) numpy·pandas·scipy·statsmodels·scikit-learn·matplotlib 등은 되지만 lifelines·xgboost·lightgbm 등은 사용할 수 없습니다.";

export const PACKAGE_STATUS_META: Record<
  ExcelPackageStatus,
  { label: string; color: string }
> = {
  available: { label: "패키지 사용 가능", color: "teal" },
  partial: { label: "일부 패키지 제한", color: "amber" },
  unavailable: { label: "일부 패키지 미지원", color: "rose" },
};

export { METHOD_EXCEL_CODE } from "./methodExcelCodeData";
