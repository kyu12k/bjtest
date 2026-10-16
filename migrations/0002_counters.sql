-- 집계 결과를 미리 올려 두는 칸. 읽을 때 visits를 세지 않기 위함(D1 읽기 한도).
-- k: 'd:YYYY-MM-DD'(그날 기기 수) · 'w:YYYY-MM-DD'(월요일 시작 주의 기기 수) · 'm:YYYY-MM'(그 달 기기 수)
CREATE TABLE IF NOT EXISTS counters (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL DEFAULT 0
);
