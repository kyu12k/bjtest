// 방문자 수 카운터 — POST: 오늘 방문 기록 후 집계 반환 / GET: 집계만 반환
// 같은 기기(vid)는 하루 한 번만 저장되고, 주·월은 기간 내 서로 다른 vid 수를 센다. 날짜는 KST, 주는 월요일 시작.
const KST_MS = 9 * 60 * 60 * 1000;
const VID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KEEP_DAYS = 70;

const ymd = d => d.toISOString().slice(0, 10);

function ranges(now) {
    const k = new Date(now.getTime() + KST_MS);
    const today = ymd(k);
    const sinceMonday = (k.getUTCDay() + 6) % 7;
    const week = ymd(new Date(k.getTime() - sinceMonday * 86400000));
    const month = today.slice(0, 8) + '01';
    return { today, week, month };
}

async function counts(db, now) {
    const r = ranges(now);
    const row = await db.prepare(
        `SELECT
           (SELECT COUNT(*) FROM visits WHERE day = ?1) AS today,
           (SELECT COUNT(DISTINCT vid) FROM visits WHERE day >= ?2) AS week,
           (SELECT COUNT(DISTINCT vid) FROM visits WHERE day >= ?3) AS month`
    ).bind(r.today, r.week, r.month).first();
    return { today: row.today, week: row.week, month: row.month };
}

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function onRequestGet({ env }) {
    return json(await counts(env.DB, new Date()));
}

export async function onRequestPost({ request, env }) {
    let vid = '';
    try { vid = String((await request.json()).vid || '').toLowerCase(); } catch { /* 본문 없음 */ }
    if (!VID_RE.test(vid)) return json({ error: 'invalid vid' }, 400);

    const now = new Date();
    await env.DB.prepare('INSERT OR IGNORE INTO visits (day, vid) VALUES (?1, ?2)')
        .bind(ranges(now).today, vid).run();

    if (Math.random() < 0.02) {
        const cutoff = ymd(new Date(now.getTime() + KST_MS - KEEP_DAYS * 86400000));
        await env.DB.prepare('DELETE FROM visits WHERE day < ?1').bind(cutoff).run();
    }
    return json(await counts(env.DB, now));
}
