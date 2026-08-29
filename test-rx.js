async function test() {
  const login = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543211', otp: '123456', purpose: 'login', role: 'DOCTOR' })
  });
  const res = await login.json();
  console.log('Login res:', res);
  const token = res.accessToken;
  console.log('Token:', token);

  const rx = await fetch('http://localhost:3001/api/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      consultationId: 'consult-1',
      items: [{ medicineName: 'Test', dosage: '1', frequency: '2', duration: '3' }]
    })
  });
  console.log('Rx Response:', rx.status, await rx.text());
}
test();
