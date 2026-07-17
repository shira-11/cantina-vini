const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const content = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\nFake image data\r\n--${boundary}--\r\n`;

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(content)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});

req.on('error', console.error);
req.write(content);
req.end();
