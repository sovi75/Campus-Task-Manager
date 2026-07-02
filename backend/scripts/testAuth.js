const { spawn } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api/auth`;

let serverProcess;

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start server
const startServer = () => {
  return new Promise((resolve, reject) => {
    console.log('Spawning backend server...');
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
      env: { ...process.env, PORT: TEST_PORT }
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server]: ${output.trim()}`);
      if (output.includes('Server running') || output.includes('MongoDB Connected')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error]: ${data.toString()}`);
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });
  });
};

const runTests = async () => {
  let passed = true;
  let testUserToken = '';

  const testUser = {
    name: 'QA Auth Tester',
    email: 'qa_tester_' + Date.now() + '@university.edu',
    password: 'password123'
  };

  try {
    console.log('\n--- Starting Authentication API Verification Tests ---\n');

    // Test 1: Register validation check (missing details)
    console.log('Test 1: POST /register - empty payload validation...');
    let res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    let data = await res.json();
    if (res.status === 400 && data.status === 'error' && data.errors.name) {
      console.log('✔ Passed validation checks.');
    } else {
      console.error('❌ Failed empty payload validation:', res.status, data);
      passed = false;
    }

    // Test 2: Successful Registration
    console.log('\nTest 2: POST /register - valid new registration...');
    res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    data = await res.json();
    if (res.status === 201 && data.status === 'success' && data.data.token) {
      console.log('✔ Passed registration.');
      testUserToken = data.data.token;
    } else {
      console.error('❌ Failed registration:', res.status, data);
      passed = false;
    }

    // Test 3: Duplicate Registration
    console.log('\nTest 3: POST /register - duplicate email check...');
    res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    data = await res.json();
    if (res.status === 400 && data.status === 'error') {
      console.log('✔ Passed duplicate check.');
    } else {
      console.error('❌ Failed duplicate registration constraint:', res.status, data);
      passed = false;
    }

    // Test 4: Login with incorrect password
    console.log('\nTest 4: POST /login - incorrect password credentials...');
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'wrongpassword' })
    });
    data = await res.json();
    if (res.status === 401 && data.status === 'error') {
      console.log('✔ Passed invalid credentials login check.');
    } else {
      console.error('❌ Failed invalid credentials login check:', res.status, data);
      passed = false;
    }

    // Test 5: Successful Login
    console.log('\nTest 5: POST /login - valid login...');
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    data = await res.json();
    if (res.status === 200 && data.status === 'success' && data.data.token) {
      console.log('✔ Passed valid login.');
      testUserToken = data.data.token;
    } else {
      console.error('❌ Failed valid login:', res.status, data);
      passed = false;
    }

    // Test 6: Access protected profile route without token
    console.log('\nTest 6: GET /me - no token auth protection check...');
    res = await fetch(`${BASE_URL}/me`);
    data = await res.json();
    if (res.status === 401 && data.status === 'error') {
      console.log('✔ Passed missing token authorization check.');
    } else {
      console.error('❌ Failed missing token authorization check:', res.status, data);
      passed = false;
    }

    // Test 7: Access protected profile route with invalid token
    console.log('\nTest 7: GET /me - invalid token auth protection check...');
    res = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': 'Bearer invalidtoken123' }
    });
    data = await res.json();
    if (res.status === 401 && data.status === 'error') {
      console.log('✔ Passed invalid token authorization check.');
    } else {
      console.error('❌ Failed invalid token authorization check:', res.status, data);
      passed = false;
    }

    // Test 8: Access protected profile route with valid token
    console.log('\nTest 8: GET /me - valid token profile retrieval...');
    res = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    data = await res.json();
    if (res.status === 200 && data.status === 'success' && data.data.email === testUser.email) {
      console.log('✔ Passed valid profile retrieval.');
    } else {
      console.error('❌ Failed valid profile retrieval:', res.status, data);
      passed = false;
    }

    // Test 9: Logout
    console.log('\nTest 9: POST /logout...');
    res = await fetch(`${BASE_URL}/logout`, { method: 'POST' });
    data = await res.json();
    if (res.status === 200 && data.status === 'success') {
      console.log('✔ Passed logout endpoint.');
    } else {
      console.error('❌ Failed logout:', res.status, data);
      passed = false;
    }

    // Cleanup: Delete the test user from MongoDB Atlas
    console.log('\nCleaning up database tester entries...');
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
    console.log('Cleaned up successfully.');

  } catch (error) {
    console.error('❌ Critical testing error occurred:', error);
    passed = false;
  } finally {
    // Terminate server process
    if (serverProcess) {
      console.log('\nStopping server process...');
      serverProcess.kill('SIGINT');
    }
    
    await sleep(2000);
    
    if (passed) {
      console.log('\n==== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ====\n');
      process.exit(0);
    } else {
      console.error('\n==== TESTS FAILED! PLEASE REVIEW ISSUES ENCOUNTERED. ====\n');
      process.exit(1);
    }
  }
};

// Execute flow
startServer().then(async () => {
  // Wait a moment for server to listen fully
  await sleep(2000);
  runTests();
}).catch((err) => {
  console.error('Failed to spawn server process:', err);
  process.exit(1);
});
