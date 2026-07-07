import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

async function run() {
  const filePath = 'test.pdf';
  // Create a 2MB dummy file
  fs.writeFileSync(filePath, Buffer.alloc(2 * 1024 * 1024, 'a'));
  
  const fileSize = fs.statSync(filePath).size;
  const chunkSize = 500 * 1024;
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const uploadId = Date.now().toString();

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    const chunk = fs.createReadStream(filePath, { start, end: end - 1 });

    const formData = new FormData();
    formData.append('chunk', chunk, 'test.pdf');
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', 'test.pdf');
    formData.append('patientName', 'Test Patient');
    formData.append('pid', '123');

    try {
      const res = await axios.post('http://localhost:4042/api/v1/records/chunk', formData, {
        headers: formData.getHeaders()
      });
      console.log(`Chunk ${i} response:`, res.data);
    } catch (e) {
      console.error(`Chunk ${i} error:`, e.response?.data || e.message);
    }
  }
  fs.unlinkSync(filePath);
}
run();
