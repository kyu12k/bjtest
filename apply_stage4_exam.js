// apply_stage4_exam.js - exam render에 level 3 처리 추가
const fs = require('fs');
const path = require('path');
const BASE_DIR = __dirname;

const OLD_EXAM = `        if (activeLevel === 1) {\n            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {\n                let width = (ans.length * 1.5) + 1; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            });\n        } else {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            htmlStr = words.map((word, i) => {\n                if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                let width = (word.length * 1.2) + 1;\n                let placeholder = activeLevel === 2 ? getChosung(word) : ""; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" placeholder="\${placeholder}" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            }).join(' ');\n        }\n`;

const NEW_EXAM = `        if (activeLevel === 1) {\n            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {\n                let width = (ans.length * 1.5) + 1; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            });\n        } else if (activeLevel === 3) {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            let wordIdx = 0;\n            htmlStr = words.map((word) => {\n                if (!word) return '';\n                if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }\n                const isBlank = (wordIdx % TOTAL_ROUNDS) === 0;\n                wordIdx++;\n                if (isBlank) { let width = (word.length * 1.2) + 1; return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`; }\n                return word;\n            }).join(' ');\n        } else {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            htmlStr = words.map((word, i) => {\n                if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                let width = (word.length * 1.2) + 1;\n                let placeholder = activeLevel === 2 ? getChosung(word) : ""; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" placeholder="\${placeholder}" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            }).join(' ');\n        }\n`;

let changed = 0, skipped = 0;
for (let i = 1; i <= 22; i++) {
  const filepath = path.join(BASE_DIR, `bjtest${i}`, 'index.html');
  if (!fs.existsSync(filepath)) { skipped++; continue; }
  let content = fs.readFileSync(filepath, 'utf-8');
  if (content.includes(OLD_EXAM)) {
    content = content.split(OLD_EXAM).join(NEW_EXAM);
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`[bjtest${i}] ✓ exam render 수정됨`);
    changed++;
  } else {
    console.log(`[bjtest${i}] ✗ 패턴 없음`);
    skipped++;
  }
}
console.log(`\n완료: ${changed}개 수정, ${skipped}개 건너뜀`);
