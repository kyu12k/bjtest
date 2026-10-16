// 방문자 수 카운터 — POST: 오늘 방문 기록 후 집계 반환 / GET: 집계만 반환
// 같은 기기(vid)는 하루 한 번만 visits에 저장된다. 날짜는 KST, 주는 월요일 시작.
// 집계는 읽을 때 세지 않고, 그 기기의 그날 첫 방문 때 counters 칸을 올려 둔다 (D1 하루 읽기 한도 때문).
// 주·월 칸은 "이번 기간에 이 기기의 오늘 이전 기록이 없을 때"만 올리므로 기간 내 서로 다른 기기 수와 같다.
const KST_MS = 9 * 60 * 60 * 1000;
const VID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KEEP_DAYS = 70;
const TRACKING_START = '2026-10-14'; // 집계를 시작한 날. 이전 달은 이날부터만 기록이 있다

const ymd = d => d.toISOString().slice(0, 10);

function ranges(now) {
    const k = new Date(now.getTime() + KST_MS);
    const today = ymd(k);
    const sinceMonday = (k.getUTCDay() + 6) % 7;
    const week = ymd(new Date(k.getTime() - sinceMonday * 86400000));
    const month = today.slice(0, 8) + '01';
    const y = +today.slice(0, 4), m = +today.slice(5, 7);
    const lastMonth = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
    return { today, week, month, lastMonth };
}

const keys = r => ({
    d: `d:${r.today}`,
    w: `w:${r.week}`,
    m: `m:${r.month.slice(0, 7)}`,
    lm: `m:${r.lastMonth.slice(0, 7)}`,
});

async function counts(db, r) {
    const K = keys(r);
    const { results } = await db.prepare('SELECT k, n FROM counters WHERE k IN (?1, ?2, ?3, ?4)')
        .bind(K.d, K.w, K.m, K.lm).all();
    const n = k => (results.find(x => x.k === k) || { n: 0 }).n;
    // lastMonthFirst: 지난 달 중 실제 집계가 된 첫날. 집계 시작 전 달이면 TRACKING_START, 아니면 그 달 1일
    return { today: n(K.d), week: n(K.w), month: n(K.m), lastMonth: n(K.lm),
             lastMonthStart: r.lastMonth, lastMonthFirst: r.lastMonth < TRACKING_START ? TRACKING_START : r.lastMonth };
}

// 기간(since ~ 어제) 안에 이 기기의 기록이 없을 때만 칸을 +1. 확인은 idx_visits_vid_day 색인으로 몇 행만 읽는다.
const bumpIfFirstIn = (db, k, vid, since, today) => db.prepare(
    `INSERT INTO counters (k, n)
       SELECT ?1, 1 WHERE NOT EXISTS (SELECT 1 FROM visits WHERE vid = ?2 AND day >= ?3 AND day < ?4)
     ON CONFLICT(k) DO UPDATE SET n = n + 1`
).bind(k, vid, since, today);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function onRequestGet({ env }) {
    return json(await counts(env.DB, ranges(new Date())));
}

export async function onRequestPost({ request, env }) {
    let vid = '';
    try { vid = String((await request.json()).vid || '').toLowerCase(); } catch { /* 본문 없음 */ }
    if (!VID_RE.test(vid)) return json({ error: 'invalid vid' }, 400);

    const now = new Date();
    const r = ranges(now);
    const ins = await env.DB.prepare('INSERT OR IGNORE INTO visits (day, vid) VALUES (?1, ?2)')
        .bind(r.today, vid).run();

    if (ins.meta.changes === 1) { // 이 기기의 오늘 첫 방문
        const K = keys(r);
        await env.DB.batch([
            env.DB.prepare('INSERT INTO counters (k, n) VALUES (?1, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1').bind(K.d),
            bumpIfFirstIn(env.DB, K.w, vid, r.week, r.today),
            bumpIfFirstIn(env.DB, K.m, vid, r.month, r.today),
        ]);
    }

    if (Math.random() < 0.02) {
        const cutoff = ymd(new Date(now.getTime() + KST_MS - KEEP_DAYS * 86400000));
        await env.DB.prepare('DELETE FROM visits WHERE day < ?1').bind(cutoff).run();
    }
    return json(await counts(env.DB, r));
}
