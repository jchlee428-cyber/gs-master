const { PDFParse } = require('pdf-parse');
const fs = require('fs');
async function test() {
  const buffer = fs.readFileSync('package.json'); // not a pdf, but let's see
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    await parser.load();
    const text = await parser.getText();
    console.log("Success", text);
  } catch(e) {
    console.error("Error", e);
  }
}
test();
