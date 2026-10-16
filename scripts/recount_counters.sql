-- counters 재계산: visits에서 오늘·이번 주·이번 달·지난 달 칸을 다시 세어 덮어쓴다.
-- KST 기준, 주는 월요일 시작 (functions/api/visit.js의 ranges()와 같은 규칙). 여러 번 돌려도 안전하다.
-- 사용: wrangler d1 execute bjtest-visits --remote --file scripts/recount_counters.sql
INSERT INTO counters (k, n)
  SELECT 'd:' || date('now', '+9 hours'), COUNT(*)
    FROM visits WHERE day = date('now', '+9 hours')
  UNION ALL
  SELECT 'w:' || date('now', '+9 hours', '-6 days', 'weekday 1'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= date('now', '+9 hours', '-6 days', 'weekday 1')
  UNION ALL
  SELECT 'm:' || strftime('%Y-%m', 'now', '+9 hours'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= strftime('%Y-%m-01', 'now', '+9 hours')
  UNION ALL
  SELECT 'm:' || strftime('%Y-%m', 'now', '+9 hours', 'start of month', '-1 month'), COUNT(DISTINCT vid)
    FROM visits WHERE day >= date('now', '+9 hours', 'start of month', '-1 month')
                  AND day <  date('now', '+9 hours', 'start of month')
ON CONFLICT(k) DO UPDATE SET n = excluded.n;
