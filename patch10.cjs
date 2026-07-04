const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const data = await response\.json\(\);\s*setSermonText\(data\.text\);/g, 
`let textRes2 = "";
      try {
        textRes2 = await response.text();
        const data = JSON.parse(textRes2);
        setSermonText(data.text);
      } catch(e) {
        throw new Error("서버 응답 오류: " + textRes2.substring(0, 50) + "...");
      }`);

fs.writeFileSync('src/App.tsx', code);
