const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  console.log('🔐 Testing Login Functionality...\n');

  try {
    // Step 1: Register a test user first
    console.log('1. Registering test user...');
    const email = `logintest${Date.now()}@example.com`;
    const password = 'password123';
    const displayName = 'Login Test User';

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      displayName
    });
    
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('User ID:', registerResponse.data.user.id);

    // Step 2: Test login with correct credentials
    console.log('\n2. Testing login with correct credentials...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });

    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('User data:', loginResponse.data.user);

    // Step 3: Test token verification
    console.log('\n3. Testing token verification...');
    const token = loginResponse.data.token;
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Token verification successful:', verifyResponse.data.message);

    // Step 4: Test API call with token
    console.log('\n4. Testing authenticated API call...');
    const gameDataResponse = await axios.get(`${API_BASE_URL}/user/game-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Authenticated API call successful');
    console.log('User coins:', gameDataResponse.data.gameData.totalCoins);

    // Step 5: Test login with wrong password
    console.log('\n5. Testing login with wrong password...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly rejected wrong password:', error.response.data.message);
    }

    // Step 6: Test login with non-existent user
    console.log('\n6. Testing login with non-existent user...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent user:', error.response.data.message);
    }

    console.log('\n🎉 LOGIN FUNCTIONALITY TEST PASSED!');
    console.log('✅ All login scenarios working correctly');

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
}

testLogin();