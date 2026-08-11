const https = require('https');
const http = require('http');

// Step 1: We have the token from the login response. Decode it to get the user ID.
// Step 2: We need to update the role. Let's try admin endpoints.

// The token from our last login:
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmMjg0NTE2LWYxMWQtNDhjNC05ZTI2LTUyYWQ4NzMzNTYyNiIsImVtYWlsIjoiYmxvb21vbnJlc3RhdXJhbnRAZ21haWwuY29tIiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzg2NDQzNzI4LCJleHAiOjE3ODcwNDg1Mjh9.XGp6boxFPN8E_ke94C-UvBzmNM3jF2PkDNd9tl6SYmI';

// Try to access all available admin endpoints to find one to promote user
const endpoints = [
  '/api/v1/admin/users',
  '/api/v1/admin/dashboard',
  '/api/v1/auth/profile',
];

async function get(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'bloomo-restaurant.onrender.com',
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 500) }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function main() {
  for (const ep of endpoints) {
    const r = await get(ep);
    console.log(`\n${ep} → ${r.status}`);
    console.log(r.body || r.error);
  }
}

main();
