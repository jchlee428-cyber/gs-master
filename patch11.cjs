const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/throw new Error\("서버에서 올바르지 않은 응답이 왔습니다. \(" \+ response\.status \+ "\)"\);/g, 
`if (response.status === 413) {
            throw new Error("파일 크기가 너무 큽니다. 32MB 이하의 파일을 업로드해주세요.");
          } else if (response.status === 504) {
            throw new Error("파일 처리 시간이 초과되었습니다. 더 작은 파일을 업로드해주세요.");
          } else if (response.status === 404) {
            throw new Error("파일 처리 서버를 찾을 수 없습니다. 배포 환경을 확인해주세요.");
          }
          throw new Error("서버 통신 오류가 발생했습니다. (" + response.status + ")");`);

fs.writeFileSync('src/App.tsx', code);
