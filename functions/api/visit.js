// 방문자 수 카운터 — POST: 오늘 방문 기록 후 집계 반환 / GET: 집계만 반환
// 같은 기기(vid)는 하루 한 번만 visits에 저장된다. 날짜는 KST, 주는 월요일 시작.
// 집계는 읽을 때 세지 않고, 그 기기의 그날 첫 방문 때 counters 칸을 올려 둔다 (D1 하루 읽기 한도 때문).
// 주·월 칸은 "이번 기간에 이 기기의 기록이 아직 없을 때"만 올리므로 기간 내 서로 다른 기기 수와 같다.
const KST_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 86400000;
const VID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KEEP_DAYS = 70;
const TRACKING_START = '2026-10-14'; // 집계를 시작한 날. 이전 기간은 이날부터만 기록이 있다
const APP_TRACKING_START = '2026-10-29'; // 앱(PWA)으로 연 기기를 세기 시작한 날. 이전 visits.pwa는 0(모름)

const ymd = d => d.toISOString().slice(0, 10);

function ranges(now) {
    const k = new Date(now.getTime() + KST_MS);
    const today = ymd(k);
    const yesterday = ymd(new Date(k.getTime() - DAY_MS));
    const sinceMonday = (k.getUTCDay() + 6) % 7;
    const week = ymd(new Date(k.getTime() - sinceMonday * DAY_MS));
    const lastWeek = ymd(new Date(k.getTime() - (sinceMonday + 7) * DAY_MS));
    const month = today.slice(0, 8) + '01';
    const y = +today.slice(0, 4), m = +today.slice(5, 7);
    const lastMonth = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
    return { today, yesterday, week, lastWeek, month, lastMonth };
}

const keys = r => ({
    d: `d:${r.today}`, yd: `d:${r.yesterday}`,
    w: `w:${r.week}`, lw: `w:${r.lastWeek}`,
    m: `m:${r.month.slice(0, 7)}`, lm: `m:${r.lastMonth.slice(0, 7)}`,
    // 앱(PWA)으로 연 기기 — 화면에는 안 보이고 API 응답으로만 확인한다
    ad: `ad:${r.today}`, ayd: `ad:${r.yesterday}`, am: `am:${r.month.slice(0, 7)}`, alm: `am:${r.lastMonth.slice(0, 7)}`,
});

const readCounters = (db, K) => db.prepare('SELECT k, n FROM counters WHERE k IN (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)')
    .bind(K.d, K.yd, K.w, K.lw, K.m, K.lm, K.ad, K.ayd, K.am, K.alm);

// 집계 시작 전부터 걸친 기간이면 실제 집계 첫날(TRACKING_START)을, 아니면 기간 시작일을 준다 (화면의 기간 표시용)
const firstCounted = start => start < TRACKING_START ? TRACKING_START : start;

function shape(results, r) {
    const K = keys(r);
    const n = k => (results.find(x => x.k === k) || { n: 0 }).n;
    return {
        today: n(K.d), yesterday: n(K.yd),
        week: n(K.w), lastWeek: n(K.lw), lastWeekStart: r.lastWeek, lastWeekFirst: firstCounted(r.lastWeek),
        month: n(K.m), lastMonth: n(K.lm), lastMonthStart: r.lastMonth, lastMonthFirst: firstCounted(r.lastMonth),
        app: { since: APP_TRACKING_START, today: n(K.ad), yesterday: n(K.ayd), month: n(K.am), lastMonth: n(K.alm) },
    };
}

// 이 기기의 기록이 [since, today] 안에 아직 없으면 칸을 +1. 확인은 idx_visits_vid_day 색인으로 몇 행만 읽는다.
// visits INSERT보다 먼저 실행하므로 "오늘 첫 방문"이면 today까지 포함해 비어 있다.
const bumpIfFirstIn = (db, k, vid, since, today) => db.prepare(
    `INSERT INTO counters (k, n)
       SELECT ?1, 1 WHERE NOT EXISTS (SELECT 1 FROM visits WHERE vid = ?2 AND day >= ?3 AND day <= ?4)
     ON CONFLICT(k) DO UPDATE SET n = n + 1`
).bind(k, vid, since, today);

// 이번 달에 이 기기가 앱으로 연 기록이 아직 없으면 +1 (월 단위 앱 기기 수)
const bumpIfFirstAppIn = (db, k, vid, since, today) => db.prepare(
    `INSERT INTO counters (k, n)
       SELECT ?1, 1 WHERE NOT EXISTS (SELECT 1 FROM visits WHERE vid = ?2 AND day >= ?3 AND day <= ?4 AND pwa = 1)
     ON CONFLICT(k) DO UPDATE SET n = n + 1`
).bind(k, vid, since, today);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function onRequestGet({ env }) {
    const r = ranges(new Date());
    const { results } = await readCounters(env.DB, keys(r)).all();
    return json(shape(results, r));
}

export async function onRequestPost({ request, env }) {
    let vid = '', pwa = 0;
    try { const b = await request.json(); vid = String(b.vid || '').toLowerCase(); pwa = b.pwa === true ? 1 : 0; } catch { /* 본문 없음 */ }
    if (!VID_RE.test(vid)) return json({ error: 'invalid vid' }, 400);

    const now = new Date();
    const r = ranges(now);
    const K = keys(r);
    // 칸 올리기 → 방문 기록 → 집계 읽기를 한 batch(= 한 트랜잭션)로. 중간에 실패하면 전부 되돌아가므로
    // "기록은 됐는데 칸은 안 올라간" 상태가 생기지 않는다. 같은 기기의 동시 요청도 하나만 센다.
    // 앱 칸: 그날 첫 방문을 앱으로 열었으면 하루 칸 +1, 이번 달 앱 기록이 처음이면 월 칸 +1
    const appBumps = pwa ? [
        bumpIfFirstIn(env.DB, K.ad, vid, r.today, r.today),
        bumpIfFirstAppIn(env.DB, K.am, vid, r.month, r.today),
    ] : [];
    const out = await env.DB.batch([
        bumpIfFirstIn(env.DB, K.d, vid, r.today, r.today),
        bumpIfFirstIn(env.DB, K.w, vid, r.week, r.today),
        bumpIfFirstIn(env.DB, K.m, vid, r.month, r.today),
        ...appBumps,
        env.DB.prepare('INSERT OR IGNORE INTO visits (day, vid, pwa) VALUES (?1, ?2, ?3)').bind(r.today, vid, pwa),
        readCounters(env.DB, K),
    ]);

    if (Math.random() < 0.02) {
        const cutoff = ymd(new Date(now.getTime() + KST_MS - KEEP_DAYS * DAY_MS));
        await env.DB.prepare('DELETE FROM visits WHERE day < ?1').bind(cutoff).run();
    }
    return json(shape(out[out.length - 1].results, r));
}
