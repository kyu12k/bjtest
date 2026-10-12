// 10/31 천국고시 대비 페이지 생성기 (기록용)
// bjtest_mock 엔진을 그대로 쓰고, 데이터만 장별 원본(bjtest{N}/index.html)과 공식 장 제목(index.html)에서 만든다.
// 어떤 절이 출제될지 모르므로 범위 안의 모든 절을 성구·빈칸 양쪽으로 넣는다.
const fs = require('fs');

const STAGES = { 1: [3, 4], 2: [6, 7, 8], 3: [10, 11, 12], 4: [15, 16, 17, 18] };
const TITLE_Q = { 3: '계 2~3장' }; // 3장 제목은 기출(3단계 2회차)에서 2~3장으로 출제됨

const root = fs.readFileSync('index.html', 'utf8');
const TITLES = {};
for (const m of root.matchAll(/\{ num: (\d+),[^}]*title: "([^"]*)"/g)) TITLES[+m[1]] = m[2];

function loadVerses(ch) {
    const h = fs.readFileSync(`bjtest${ch}/index.html`, 'utf8');
    const m = h.match(/const verses = (\[[\s\S]*?\]);/);
    if (!m) throw new Error(`bjtest${ch}: verses 없음`);
    return eval(m[1]).map(s => {
        const mm = s.match(/^\s*(\d+)\s+([\s\S]*)$/);
        if (!mm) throw new Error(`bjtest${ch}: 절 번호 없음 → ${s.slice(0, 30)}`);
        return { v: +mm[1], raw: mm[2].trim() };
    });
}

const EXAMS = {};
const report = [];
for (const [stage, chs] of Object.entries(STAGES)) {
    chs.forEach((ch, i) => {
        const title = TITLES[ch];
        if (!title || title.includes('<')) throw new Error(`${ch}장 제목 이상: ${title}`);
        const vs = loadVerses(ch);
        let num = 0;
        const titleData = [{ num: ++num, q: `${TITLE_Q[ch] || `계 ${ch}장`}의 제목을 기록하시오.`, a: title }];
        const verseData = vs.map(x => ({ num: ++num, ref: `계 ${ch}:${x.v}`, hint: '', full: x.raw.replace(/[{}]/g, '') }));
        const blankData = vs.filter(x => /\{[^}]+\}/.test(x.raw)).map(x => ({ num: ++num, ref: `계 ${ch}:${x.v}`, raw: x.raw }));
        EXAMS[`${stage}-${i + 1}`] = { label: `${stage}단계(${i + 1}) · 계 ${ch}장`, total: num, titleData, verseData, blankData };
        report.push(`${stage}-${i + 1} 계${ch}장: 제목1 성구${verseData.length} 빈칸${blankData.length} = ${num}문제`);
    });
}

let html = fs.readFileSync('bjtest_mock/index.html', 'utf8');
const rep = (from, to) => {
    const n = html.split(from).length - 1;
    if (n !== 1) throw new Error(`치환 대상 ${n}개: ${String(from).slice(0, 50)}`);
    html = html.replace(from, () => to);
};

// 데이터 교체 (EXAMS ~ SPOT 별칭까지 통째로)
const s = html.indexOf('const EXAMS = {');
const eAnchor = "SPOT['2-1']=SPOT['1-1'];";
const e = html.indexOf(eAnchor) + eAnchor.length;
if (s < 0 || e < eAnchor.length) throw new Error('EXAMS/SPOT 경계 못 찾음');
html = html.slice(0, s)
    + 'const EXAMS = ' + JSON.stringify(EXAMS, null, 1) + ';\n'
    + 'const SPOT = {}; // 틀린 부분 찾기용 오답 데이터 없음 — 탭 숨김\n'
    + html.slice(e);

// 문구·범위
rep('<title>천국고시 모의고사 (계 1~11장)</title>', '<title>천국고시 대비 (10/31)</title>');
rep('<h1>📝 천국고시 모의고사</h1>', '<h1>📝 10/31 천국고시 대비</h1>');
rep('<p class="sub">계 1~11장 · 1~3단계 · 4단계</p>', '<p class="sub">10/31(토) · 범위 안의 모든 절 수록 (제목·성구·빈칸)</p>');
rep(">1단계 · 계 1~2장<", ">1단계 · 계 3~4장<");
rep(">2단계 · 계 1~5장<", ">2단계 · 계 6~8장<");
rep(">3단계 · 계 1~8장<", ">3단계 · 계 10~12장<");
rep(">4단계 · 계 1~11장<", ">4단계 · 계 15~18장<");
rep("const HKEY='bj_history';", "const HKEY='bj_history_gosi1031';"); // 같은 도메인 mock 기록과 분리

// 틀린 부분 찾기 탭 제거 (오답 데이터가 없음)
// (버튼을 지우면 setMode가 #tabP를 참조하다 죽으므로 숨기기만 한다)
const spotBtn = html.match(/<button([^>]*onclick="setMode\('spot'\)")/);
if (!spotBtn) throw new Error('spot 탭 버튼 없음');
html = html.replace(spotBtn[0], '<button hidden' + spotBtn[1]);

fs.mkdirSync('bjtest_gosi1031', { recursive: true });
fs.writeFileSync('bjtest_gosi1031/index.html', html);
console.log(report.join('\n'));
