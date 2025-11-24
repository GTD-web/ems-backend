/**
 * 평가 기간 기본 등급 구간 설정
 *
 * 프론트엔드에서 평가 기간 생성 시 참고할 수 있는 기본 등급 구간입니다.
 */
export const DEFAULT_GRADE_RANGES = [
  {
    grade: 'S',
    minRange: 121,
    maxRange: 1000,
  },
  {
    grade: 'A+',
    minRange: 111,
    maxRange: 120,
  },
  {
    grade: 'A',
    minRange: 101,
    maxRange: 110,
  },
  {
    grade: 'B+',
    minRange: 91,
    maxRange: 100,
  },
  {
    grade: 'B',
    minRange: 81,
    maxRange: 90,
  },
  {
    grade: 'C',
    minRange: 71,
    maxRange: 80,
  },
  {
    grade: 'D',
    minRange: 0,
    maxRange: 70,
  },
] as const;

