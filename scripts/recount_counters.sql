-- counters 재계산: visits에서 다시 세어 덮어쓴다. 여러 번 돌려도 안전하다.
--   d: 날짜 칸 — visits에 남아 있는 모든 날(최근 70일)
--   w: 이번 주·지난 주 / m: 이번 달·지난 달 — 모두 70일 보관 범위 안이라 정확히 다시 셀 수 있다
-- KST 기준, 주는 월요일 시작 (functions/api/visit.js의 ranges()와 같은 규칙).
-- 그보다 오래된 칸은 visits가 지워져 다시 셀 수 없으므로 건드리지 않는다.
-- 사용: wrangler d1 execute bjtest-visits --remote --file scripts/recount_counters.sql
INSERT INTO counters (k, n)
  SELECT 'd:' || day, COUNT(*)
    FROM visits WHERE day >= '' GROUP BY day
  UNION ALL
  SELECT 'w:' || date('now', '+9 hours', '-6 days', 'weekday 1'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= date('now', '+9 hours', '-6 days', 'weekday 1')
  UNION ALL
  SELECT 'w:' || date('now', '+9 hours', '-6 days', 'weekday 1', '-7 days'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= date('now', '+9 hours', '-6 days', 'weekday 1', '-7 days')
                  AND day <  date('now', '+9 hours', '-6 days', 'weekday 1')
  UNION ALL
  SELECT 'm:' || strftime('%Y-%m', 'now', '+9 hours'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= strftime('%Y-%m-01', 'now', '+9 hours')
  UNION ALL
  SELECT 'm:' || strftime('%Y-%m', 'now', '+9 hours', 'start of month', '-1 month'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= date('now', '+9 hours', 'start of month', '-1 month')
                  AND day <  date('now', '+9 hours', 'start of month')
ON CONFLICT(k) DO UPDATE SET n = excluded.n;
