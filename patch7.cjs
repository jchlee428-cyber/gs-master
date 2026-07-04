const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(\!response\.ok\) \{\s*const errData = await response\.json\(\);\s*throw new Error\(errData\.error \|\| '파일 처리에 실패했습니다\.'\);\s*\}/g;

code = code.replace(regex, `if (!response.ok) {
        let errData;
        const textRes = await response.text();
        try {
          errData = JSON.parse(textRes);
        } catch (e) {
          console.error("Non-JSON error response:", textRes);
          throw new Error("서버에서 올바르지 않은 응답이 왔습니다. (" + response.status + ")");
        }
        throw new Error(errData.error || '파일 처리에 실패했습니다.');
      }`);

fs.writeFileSync('src/App.tsx', code);
