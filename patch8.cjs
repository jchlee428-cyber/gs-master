const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/g;
code = code.replace(regex, `
  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: "파일 크기가 너무 큽니다. 더 작은 파일을 업로드해주세요." });
    }
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {`);

fs.writeFileSync('server.ts', code);
