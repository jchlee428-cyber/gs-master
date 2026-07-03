const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `제공된 설교 내용을 심도있게 분석하고, 지정된 JSON 스키마 형식에 맞추어 한국어로 응답해줘.
      \`;

      let response;`;

const replacement = `제공된 설교 내용을 심도있게 분석하고, 지정된 JSON 스키마 형식에 맞추어 한국어로 응답해줘.
어떠한 경우에도 (예: 설교 내용이 아니거나 텍스트가 부족한 경우 등) 반드시 유효한 JSON 형식으로만 응답해야 하며, 그 외의 텍스트나 마크다운(예: \`\`\`json)은 절대 포함하지 마라.
분석할 수 없는 내용이라면 문자열 필드에는 "분석 불가", 숫자 필드에는 0을 입력하여 완벽한 JSON 구조를 유지하라.
      \`;

      let response;`;

code = code.replace(target, replacement);

const target2 = `      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated from Gemini.");
      }

      const parsedResult = JSON.parse(responseText);

      const historyItem = {`;

const replacement2 = `      let responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated from Gemini.");
      }

      // Remove possible markdown formatting
      responseText = responseText.replace(/^\\s*\`\`\`json\\n?/i, '').replace(/\\n?\`\`\`\\s*$/i, '').trim();

      let parsedResult;
      try {
        parsedResult = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON. Raw response:", responseText);
        throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 파싱 실패)");
      }

      const historyItem = {`;

code = code.replace(target2, replacement2);
fs.writeFileSync('server.ts', code);
