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

// 빈칸 너비: 처음 너비(정답 길이 기준)는 유지하고 입력이 칸보다 길어질 때만 늘린다 (2026-10-30)
// 원래 코드는 글자마다 4글자 폭으로 줄였다 다시 늘려서, 타이핑할 때마다 줄이 출렁였다.
rep(`  const minW=parseFloat(getComputedStyle(inp).fontSize)*4;
  inp.style.width=minW+'px';
  inp.style.width=Math.max(inp.scrollWidth+2, minW)+'px';`,
`  if(!inp.dataset.w0) inp.dataset.w0=parseFloat(getComputedStyle(inp).width);
  const w0=+inp.dataset.w0;
  inp.style.width=w0+'px';
  if(inp.scrollWidth>inp.clientWidth) inp.style.width=(inp.scrollWidth+2)+'px';`);

// 칸을 마우스·터치로 누르면 누른 자리에 커서를 둔다 (2026-10-30)
// 원래는 포커스될 때마다 커서를 끝으로 옮겨서, 중간을 눌러도 끝으로 끌려갔다.
// 끝으로 보내는 건 엔터로 넘어왔을 때와, 성구 칸에 미리 채워진 앞부분만 있을 때(value===defaultValue)만.
rep(`document.addEventListener('focusin', e=>{
  const t=e.target;`,
`let lastPtr=null, lastPtrAt=0;
document.addEventListener('pointerdown', e=>{ lastPtr=e.target; lastPtrAt=Date.now(); }, true);
document.addEventListener('focusin', e=>{
  const t=e.target;`);
rep(`    setTimeout(()=>{ const l=t.value.length; try{t.setSelectionRange(l,l);}catch(_){} }, 0);
  }
});`,
`    const byPointer = lastPtr===t && Date.now()-lastPtrAt<1500;
    if(!byPointer || t.value===t.defaultValue)
      setTimeout(()=>{ const l=t.value.length; try{t.setSelectionRange(l,l);}catch(_){} }, 0);
  }
});`);

// ── 채점 결과 가독성 (2026-10-30) ──
// 내 답의 띄어쓰기를 정답 기준으로 되살리고, 틀린/빠뜨린 글자는 이어진 덩어리째 한 번에 칠한다.
// 정답·내 답을 같은 글씨 크기의 두 줄로 나란히 둔다. 사용자 입력은 이스케이프(원래 엔진엔 없었음).
{
    const s0 = html.indexOf('function diffHtml(u, c){');
    const e0 = html.indexOf("}).join('');\n}", s0) + "}).join('');\n}".length;
    if (s0 < 0 || e0 < s0) throw new Error('diffHtml 경계 못 찾음');
    html = html.slice(0, s0) + `function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// 글자 단위 LCS 정렬. 채점과 같은 norm 기준으로 비교하고, 화면엔 정답의 띄어쓰기를 되살려 보여준다.
function diffHtml(u, c){
  const nu=[...norm(u)];
  if(!nu.length) return '<span class="diff-wrong">(미입력)</span>';
  const nc=[], sp=[]; let pend=false;
  for(const ch of (c||'').normalize('NFC')){
    if(norm(ch)===''){ if(/\\s/.test(ch)) pend=true; continue; }
    nc.push(ch); sp.push(pend); pend=false;
  }
  const m=nu.length, n=nc.length;
  const dp=Array.from({length:m+1},()=>new Int32Array(n+1));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j]=nu[i-1]===nc[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const al=[]; let i=m,j=n;
  while(i>0||j>0){
    if(i>0&&j>0&&nu[i-1]===nc[j-1]){al.push(['ok',nu[i-1],sp[j-1]]);i--;j--;}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){al.push(['miss',nc[j-1],sp[j-1]]);j--;}
    else{al.push(['wrong',nu[i-1],false]);i--;}
  }
  al.reverse();
  // 같은 종류가 이어지면 한 덩어리로 (띄어쓰기도 덩어리 안에 포함)
  let out='', cur=null, buf='';
  const flush=()=>{ if(!buf) return; out+= cur==='ok'?escH(buf):'<span class="diff-'+(cur==='miss'?'missing':'wrong')+'">'+escH(buf)+'</span>'; buf=''; };
  for(const [t,ch,space] of al){
    if(t!==cur){ flush(); if(space){ out+=' '; } cur=t; buf=ch; }
    else buf+=(space?' ':'')+ch;
  }
  flush();
  return out.trim();
}` + html.slice(e0);
}
rep(`        inner=\`<div class="wlabel">\${skip?'⬜':'❌'} \${w.label}</div>
          <div style="font-size:.88em">내 답: \${skip?'<em style="color:#aaa">(미응답)</em>':diffHtml(w.user,w.correct)}</div>
          <div>정답: <span class="corr">\${w.correct}</span></div>\`;`,
`        inner=\`<div class="wlabel">\${skip?'⬜':'❌'} \${w.label}</div>
          <div class="drow ans"><span class="dlbl">정답</span><span class="dtxt">\${w.correct}</span></div>
          <div class="drow"><span class="dlbl">내 답</span><span class="dtxt">\${skip?'<em style="color:#aaa">(미응답)</em>':diffHtml(w.user,w.correct)}</span></div>\`;`);
rep(`        inner=\`<div class="wlabel">\${skip?'⬜':'❌'} \${w.label}</div>
          <div style="margin-bottom:4px;font-size:.88em;line-height:1.7">내 답: \${skip?'<em style="color:#aaa">(미응답)</em>':diffHtml(w.user,w.correct)}</div>
          <div class="ans-box">\${w.correct}</div>\`;`,
`        inner=\`<div class="wlabel">\${skip?'⬜':'❌'} \${w.label}</div>
          <div class="drow ans"><span class="dlbl">정답</span><span class="dtxt">\${w.correct}</span></div>
          <div class="drow"><span class="dlbl">내 답</span><span class="dtxt">\${skip?'<em style="color:#aaa">(미응답)</em>':diffHtml(w.user,w.correct)}</span></div>\`;`);
// 오답 목록 맨 위에 색 설명 한 줄
rep(`    wrongs.forEach(w=>{
      let inner='';`,
`    wl.innerHTML='<div class="diff-legend"><span class="diff-wrong">잘못 쓴 글자</span> · <span class="diff-missing">빠뜨린 글자</span> · 띄어쓰기·쉼표는 채점에서 제외</div>';
    wrongs.forEach(w=>{
      let inner='';`);
rep('.ans-box{', `.drow{display:flex;gap:8px;align-items:flex-start;margin-top:5px;line-height:1.8}
.dlbl{flex:0 0 3em;font-size:.78rem;font-weight:bold;color:var(--sub);padding-top:3px;text-align:right}
.dtxt{flex:1;font-size:.93rem;word-break:keep-all;overflow-wrap:anywhere}
.drow.ans .dtxt{color:var(--ans-c);background:var(--ans-bg);border-radius:6px;padding:3px 8px}
.drow:not(.ans) .dtxt{padding:3px 8px}
.diff-legend{font-size:.8rem;color:var(--sub);margin:4px 2px 10px}
.ans-box{`);

// 빈칸 너비엔 애니메이션을 걸지 않는다 — 애니메이션 중 너비를 재면 2px씩 쌓여 칸이 계속 늘어났다(포커스 색 변화만 유지)
rep('outline:none;padding:1px 4px;margin:1px;vertical-align:middle;transition:.2s}',
    'outline:none;padding:1px 4px;margin:1px;vertical-align:middle;transition:border-color .2s,background-color .2s}');

// 한글 입력 보호 (engine.js와 같은 처리, 2026-10-30)
// 조합 중 즉시 포커스를 옮기면 안드로이드 키보드가 마지막 글자를 잃거나 앞 칸 글자를 다음 칸에 다시 넣는다.
const IME_ATTR = ' autocorrect="off" autocapitalize="off" spellcheck="false"'; // 제목·빈칸 칸은 원래 autocomplete="off"가 있음
rep('<input type="text" class="line-inp"', '<input type="text" class="line-inp"' + IME_ATTR);
rep('<input type="text" class="binp"', '<input type="text" class="binp"' + IME_ATTR);
rep('<textarea class="vtarea"', '<textarea class="vtarea" autocomplete="off"' + IME_ATTR);
rep(`document.addEventListener('keydown', e=>{
  if(e.key!=='Enter') return;
  const t=e.target;`,
`// 아이패드 외장 키보드: 앞 칸에서 조합 중이던 마지막 글자가 다음 칸 첫 타건에 다시 붙어 나온다 (예: 노래→다음 칸 "래깅")
// 빈 칸의 첫 타건은 자모 하나뿐이므로, 첫 입력이 앞 칸 끝 글자로 시작하는 완성 음절이면 끌려온 것 → 지우고 다시 포커스
function guardCarry(from,to){
  const tail=from.value.slice(-1), before=to.value;
  if(!/[가-힣]/.test(tail)) return;
  const T=tail.charCodeAt(0)-0xAC00;
  const off=()=>{ to.removeEventListener('input',h); to.removeEventListener('blur',off); };
  const h=()=>{
    off();
    if(!to.value.startsWith(before)) return;
    const c=to.value.charCodeAt(before.length)-0xAC00;
    if(!(c>=0&&c<11172)) return;
    if(!(c===T||(T%28===0&&c-c%28===T))) return;
    to.blur(); to.value=before;
    setTimeout(()=>{ to.value=before; to.focus(); try{to.setSelectionRange(before.length,before.length);}catch(_){} },60);
  };
  to.addEventListener('input',h); to.addEventListener('blur',off);
}
document.addEventListener('keydown', e=>{
  if(e.key!=='Enter') return;
  if(e.isComposing||e.keyCode===229) return; // 한글 조합 중엔 개입하지 않음
  const t=e.target;`);
rep(`    const nx=all[i+1]; nx.focus();
    const l=nx.value.length; try{nx.setSelectionRange(l,l);}catch(_){}`,
`    // 앞 칸을 blur해 키보드 조합을 확정·초기화한 뒤 한 박자 늦게 다음 칸으로
    const nx=all[i+1];
    setTimeout(()=>{
      if(document.activeElement===t) t.blur();
      guardCarry(t,nx);
      nx.focus();
      const l=nx.value.length; try{nx.setSelectionRange(l,l);}catch(_){}
    },0);`);

// 틀린 부분 찾기 탭 제거 (오답 데이터가 없음)
// (버튼을 지우면 setMode가 #tabP를 참조하다 죽으므로 숨기기만 한다)
const spotBtn = html.match(/<button([^>]*onclick="setMode\('spot'\)")/);
if (!spotBtn) throw new Error('spot 탭 버튼 없음');
html = html.replace(spotBtn[0], '<button hidden' + spotBtn[1]);

fs.mkdirSync('bjtest_gosi1031', { recursive: true });
fs.writeFileSync('bjtest_gosi1031/index.html', html);
console.log(report.join('\n'));
