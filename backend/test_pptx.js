const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pptxParser = require('pptx-text-parser');

(async () => {
  try {
    const url = "https://drive.google.com/uc?export=download&id=1-0HSDhLOAzoR2Viq9Qye5Lb_i5TJ8x5y";
    console.log("Downloading...");
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const filePath = path.join(os.tmpdir(), `test_pptx_${Date.now()}.pptx`);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log("Parsing...");
    try {
      // test function
      const doc = await pptxParser(filePath);
      console.log("Parsed using function! Length:", JSON.stringify(doc).length);
    } catch (e1) {
      console.error("Function failed:", e1.message);
      try {
        const pptxParserLib = require('pptx-text-parser');
        const doc2 = await pptxParserLib.getPowerPointText(filePath);
        console.log("Parsed using object method! Length:", JSON.stringify(doc2).length);
      } catch (e2) {
        console.error("Method failed:", e2.message);
      }
    }
  } catch (e) {
    console.error("Main error:", e);
  }
})();
