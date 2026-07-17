const fs = require('fs');
const Tesseract = require('tesseract.js');

async function test() {
  console.log("Starting...");
  try {
    const { data: { text } } = await Tesseract.recognize(
      'https://tesseract.projectnaptha.com/img/eng_bw.png',
      'ita',
      { logger: m => console.log(m) }
    );
    console.log("TEXT:", text);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
