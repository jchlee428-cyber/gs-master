const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/if \(\!response\.ok\) \{\s*const errData = await response\.json\(\);\s*throw new Error\(errData\.error \|\| (.*?)\);\s*\}/g, 
`if (!response.ok) {
        let errData;
        const textRes = await response.text();
        try {
          errData = JSON.parse(textRes);
        } catch (e) {
          console.error("Non-JSON error response:", textRes);
          throw new Error("서버 통신 오류가 발생했습니다. (" + response.status + ")");
        }
        throw new Error(errData.error || $1);
      }`);

fs.writeFileSync('src/App.tsx', code);
