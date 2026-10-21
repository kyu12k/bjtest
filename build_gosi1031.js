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

// ── 4단계 자문회용 문답지 (431031 천국고시(4차)-4단계A) — 문답지 그대로 ──
// 성구: [힌트(문답지에 미리 주어진 앞부분), 문답지 전문]. 빈칸: 문답지 본문의 ( )가 빈칸.
// 본문은 문답지를 옮겨 적되, 저희 개역한글 데이터와 글자(띄어쓰기·쉼표 제외)가 다르면 멈춘다.
const JAMUN = {
    titles: [16, 17, 18],
    verses: [
        ['15:2', '또 내가 보니', '또 내가 보니 불이 섞인 유리 바다 같은 것이 있고 짐승과 그의 우상과 그의 이름의 수를 이기고 벗어난 자들이 유리바다 가에 서서 하나님의 거문고를 가지고'],
        ['15:5', '또', '또 이 일 후에 내가 보니 하늘에 증거 장막의 성전이 열리며'],
        ['16:12', '또 여섯째가', '또 여섯째가 그 대접을 큰 강 유브라데에 쏟으매 강물이 말라서 동방에서 오는 왕들의 길이 예비되더라'],
        ['16:17', '일곱째가', '일곱째가 그 대접을 공기 가운데 쏟으매 큰 음성이 성전에서 보좌로부터 나서 가로되 되었다 하니'],
        ['16:19', '큰 성이', '큰 성이 세 갈래로 갈라지고 만국의 성들도 무너지니 큰 성 바벨론이 하나님 앞에 기억하신바 되어 그의 맹렬한 진노의 포도주 잔을 받으매'],
        ['17:5', '그 이마에', '그 이마에 이름이 기록되었으니 비밀이라, 큰 바벨론이라, 땅의 음녀들과 가증한 것들의 어미라 하였더라'],
        ['17:14', '저희가 어린 양으로 더불어 싸우려니와', '저희가 어린 양으로 더불어 싸우려니와 어린 양은 만주의 주시요 만왕의 왕이시므로 저희를 이기실터이요 또 그와 함께 있는 자들 곧 부르심을 입고 빼내심을 얻고 진실한 자들은 이기리로다'],
        ['18:2', '힘센 음성으로 외쳐', '힘센 음성으로 외쳐 가로되 무너졌도다 무너졌도다 큰 성 바벨론이여 귀신의 처소와 각종 더러운 영의 모이는 곳과 각종 더럽고 가증한 새의 모이는 곳이 되었도다'],
        ['18:4', '또 내가 들으니', '또 내가 들으니 하늘로서 다른 음성이 나서 가로되 내 백성아, 거기서 나와 그의 죄에 참예하지 말고 그의 받을 재앙들을 받지 말라'],
        ['18:23', '등불 빛이', '등불 빛이 결코 다시 네 가운데서 비취지 아니하고 신랑과 신부의 음성이 결코 다시 네 가운데서 들리지 아니하리로다 너의 상고들은 땅의 왕족들이라 네 복술을 인하여 만국이 미혹되었도다'],
    ],
    blanks: [
        ['15:1', '또 (하늘)에 크고 이상한 (다른 이적)을 보매 (일곱 천사)가 일곱 재앙을 가졌으니 곧 마지막 재앙이라 (하나님의 진노)가 이것으로 마치리로다'],
        ['15:3', '하나님의 종 (모세의 노래), (어린양의 노래)를 불러 가로되 주 하나님 곧 전능하신이시여 하시는 일이 크고 (기이하시도다) 만국의 왕이시여 주의 길이 (의롭고) 참되시도다'],
        ['16:3', '둘째가 그 대접을 (바다)에 쏟으매 바다가 곧 (죽은 자의 피) 같이 되니 바다 가운데 (모든 생물)이 죽더라'],
        ['16:4', '(세째)가 그 (대접)을 (강)과 (물 근원)에 쏟으매 (피)가 되더라'],
        ['16:10', '또 (다섯째)가 그 대접을 (짐승의 보좌)에 쏟으니 그 (나라)가 곧 어두워지며 사람들이 아파서 (자기 혀)를 (깨물고)'],
        ['16:21', '또 중수가 (한 달란트)나 되는 (큰 우박)이 하늘로부터 (사람들에게) 내리매 사람들이 그 박재로 인하여 하나님을 (훼방하니) 그 재앙이 심히 큼이러라'],
        ['17:7', '(천사)가 가로되 왜 기이히 여기느냐 내가 (여자)와 그의 탄바 (일곱 머리와 열뿔) 가진 (짐승의 비밀)을 네게 이르리라'],
        ['17:10', '또 (일곱 왕)이라 다섯은 (망하였고) 하나는 (있고) 다른이는 아직 이르지 아니하였으나 이르면 반드시 (잠간 동안) 계속하리라'],
        ['17:16', '네가 본바 이 (열 뿔과 짐승)이 (음녀)를 (미워하여) 망하게 하고 (벌거벗게) 하고 그 (살을) 먹고 (불로) 아주 사르리라'],
        ['18:3', '그 (음행의 진노의 포도주)를 인하여 (만국이 무너졌으며) 또 땅의 왕들이 그로 더불어 (음행하였으며) 땅의 상고들도 그 (사치의 세력)을 인하여 치부하였도다 하더라'],
        ['18:6', '그가 준 그대로 그에게 주고 그의 (행위대로) (갑절을 갚아주고) 그의 섞은 잔에도 (갑절이나) 섞어 그에게 주라'],
        ['18:8', '그러므로 (하루 동안)에 그 (재앙들이) 이르리니 곧 (사망과 애통과 흉년)이라 그가 또한 (불에 살라지리니) 그를 심판하신 주 하나님은 (강하신 자이심이니라)'],
    ],
};
{
    const flat = t => t.replace(/[\s,{}()]/g, '');
    const canon = ref => {
        const [ch, v] = ref.split(':').map(Number);
        const x = loadVerses(ch).find(y => y.v === v);
        if (!x) throw new Error(`계 ${ref} 원본 없음`);
        return x.raw.replace(/[{}]/g, '');
    };
    const check = (ref, paper) => {
        const ours = canon(ref);
        if (flat(ours) !== flat(paper)) throw new Error(`계 ${ref} 문답지와 원본이 다름\n 문답지: ${paper}\n 원본  : ${ours}`);
    };
    let num = 0;
    const titleData = JAMUN.titles.map(ch => ({ num: ++num, q: `계 ${ch}장의 제목을 기록하시오.`, a: TITLES[ch] }));
    const verseData = JAMUN.verses.map(([ref, hint, full]) => {
        check(ref, full);
        if (!full.startsWith(hint)) throw new Error(`계 ${ref} 힌트가 전문 앞부분이 아님`);
        return { num: ++num, ref: `계 ${ref}`, hint, full };
    });
    const blankData = JAMUN.blanks.map(([ref, paper]) => {
        check(ref, paper);
        return { num: ++num, ref: `계 ${ref}`, raw: paper.replace(/\(\s*([^)]+?)\s*\)/g, '{$1}') };
    });
    EXAMS['4A'] = { label: '4단계 자문회용 · 계 15~18장', total: num, titleData, verseData, blankData };
    report.push(`4A 자문회용: 제목${titleData.length} 성구${verseData.length} 빈칸${blankData.length} = ${num}문제`);
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
rep(`onclick="selectStage('4')">4단계 · 계 15~18장</button>`,
    `onclick="selectStage('4')">4단계 · 계 15~18장</button>\n      <button class="exam-btn" onclick="selectExam('4A')">4단계 자문회용 · 25문항</button>`);
// ?stage=N 외에 ?exam=4A 로 문제지 하나를 바로 연다
rep(`const s=new URLSearchParams(location.search).get('stage');\n  if(s) selectStage(s);`,
    `const q=new URLSearchParams(location.search), s=q.get('stage'), x=q.get('exam');\n  if(x&&EXAMS[x]) selectExam(x); else if(s) selectStage(s);`);
rep("const HKEY='bj_history';", "const HKEY='bj_history_gosi1031';"); // 같은 도메인 mock 기록과 분리

// 틀린 부분 찾기 탭 제거 (오답 데이터가 없음)
// (버튼을 지우면 setMode가 #tabP를 참조하다 죽으므로 숨기기만 한다)
const spotBtn = html.match(/<button([^>]*onclick="setMode\('spot'\)")/);
if (!spotBtn) throw new Error('spot 탭 버튼 없음');
html = html.replace(spotBtn[0], '<button hidden' + spotBtn[1]);

fs.mkdirSync('bjtest_gosi1031', { recursive: true });
fs.writeFileSync('bjtest_gosi1031/index.html', html);
console.log(report.join('\n'));
