const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const parsedResult = JSON\.parse\(responseText\);/, `
      let parsedResult;
      try {
        let cleanText = responseText.replace(/^\\s*\`\`\`json\\n?/i, '').replace(/\\n?\`\`\`\\s*$/i, '').trim();
        parsedResult = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse JSON. Raw response:", responseText);
        throw new Error("AI 응답을 JSON으로 파싱하는데 실패했습니다. 텍스트를 다시 확인해주세요.");
      }
`);

fs.writeFileSync('server.ts', code);
