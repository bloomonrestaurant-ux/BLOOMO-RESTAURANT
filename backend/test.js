async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', data);
  } catch (err) {
    console.error('ERROR MSG:', err.message);
  }
}

test();
