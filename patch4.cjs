const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/마크다운\(예: \`\`\`json\)/g, '마크다운(예: \\`\\`\\`json)');

fs.writeFileSync('server.ts', code);
