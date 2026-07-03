const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /제공된 설교 내용을 심도있게 분석하고, 지정된 JSON 스키마 형식에 맞추어 한국어로 응답해줘\.[\s\S]*?      \`;/g;

code = code.replace(regex, `제공된 설교 내용을 심도있게 분석하고, 지정된 JSON 스키마 형식에 맞추어 한국어로 응답해줘.
어떠한 경우에도 반드시 유효한 JSON 형식으로만 응답해야 하며, 그 외의 텍스트나 마크다운은 절대 포함하지 마라.
분석할 수 없는 내용이라면 문자열 필드에는 "분석 불가", 숫자 필드에는 0을 입력하여 완벽한 JSON 구조를 유지하라.
      \`;`);

fs.writeFileSync('server.ts', code);
