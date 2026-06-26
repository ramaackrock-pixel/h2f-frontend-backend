import http from 'http';

const req = http.request('http://localhost:4042/api/v1/billing', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        const inv = json.invoices.find(i => i._id === '6a3d07c3a874bfa4eec1ebd0' || i.id === '6a3d07c3a874bfa4eec1ebd0');
        console.log("API returned invoice:", JSON.stringify(inv, null, 2));
    } catch(e) {
        console.error("Error parsing JSON:", e, data);
    }
  });
});
req.end();
