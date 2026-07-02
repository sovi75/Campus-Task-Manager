const { spawn } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Task = require('../models/Task');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_PORT = process.env.PORT || 5000;
const AUTH_URL = `http://127.0.0.1:${TEST_PORT}/api/auth`;
const TASKS_URL = `http://127.0.0.1:${TEST_PORT}/api/tasks`;

let serverProcess;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  let authToken = '';
  let taskId1 = '';
  let taskId2 = '';
  let taskId3 = '';

  const testUser = {
    name: 'QA Task Tester',
    email: 'qa_task_tester_' + Date.now() + '@university.edu',
    password: 'password123'
  };

  try {
    console.log('\n--- Starting Task API Verification Tests ---\n');

    // Step 1: Register test user
    console.log('Step 1: Registering tester user...');
    let res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    let authData = await res.json();
    if (res.status === 201 && authData.status === 'success') {
      authToken = authData.data.token;
      console.log('✔ Tester user registered.');
    } else {
      console.error('❌ Failed registration:', res.status, authData);
      throw new Error('Registration failed');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    // Step 2: Create Tasks (3 sample tasks)
    console.log('\nStep 2: Creating 3 sample tasks...');
    const t1Payload = {
      title: 'Calculus Homework 5',
      description: 'Study triple integrals in chapter 5.',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      priority: 'High',
      category: 'Assignment',
      courseCode: 'MATH301',
      reminders: { enabled: true, option: '1 hour before' }
    };
    
    const t2Payload = {
      title: 'History Midterm Review',
      description: 'Review notes on industrial revolution.',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      priority: 'Medium',
      category: 'Exam',
      courseCode: 'HIST110',
      reminders: { enabled: false, option: 'none' }
    };

    const t3Payload = {
      title: 'Personal Budget Sheet',
      description: 'Organize university semester expenses.',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday (overdue)
      priority: 'Low',
      category: 'Personal',
      courseCode: 'Admin',
      reminders: { enabled: false, option: 'none' }
    };

    // Create task 1
    res = await fetch(TASKS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(t1Payload)
    });
    let t1Data = await res.json();
    if (res.status === 201 && t1Data.status === 'success') {
      taskId1 = t1Data.data._id;
      console.log(`✔ Created task 1: "${t1Payload.title}" with ID ${taskId1}`);
    } else {
      console.error('❌ Failed to create task 1:', res.status, t1Data);
      passed = false;
    }

    // Create task 2
    res = await fetch(TASKS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(t2Payload)
    });
    let t2Data = await res.json();
    if (res.status === 201 && t2Data.status === 'success') {
      taskId2 = t2Data.data._id;
      console.log(`✔ Created task 2: "${t2Payload.title}" with ID ${taskId2}`);
    } else {
      console.error('❌ Failed to create task 2:', res.status, t2Data);
      passed = false;
    }

    // Create task 3
    res = await fetch(TASKS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(t3Payload)
    });
    let t3Data = await res.json();
    if (res.status === 201 && t3Data.status === 'success') {
      taskId3 = t3Data.data._id;
      console.log(`✔ Created task 3: "${t3Payload.title}" with ID ${taskId3}`);
    } else {
      console.error('❌ Failed to create task 3:', res.status, t3Data);
      passed = false;
    }

    // Step 3: Fetch all tasks
    console.log('\nStep 3: Fetching all tasks...');
    res = await fetch(TASKS_URL, { headers });
    let tasksData = await res.json();
    if (res.status === 200 && tasksData.status === 'success' && tasksData.results === 3) {
      console.log('✔ Successfully retrieved all 3 tasks.');
    } else {
      console.error('❌ Failed to retrieve tasks:', res.status, tasksData);
      passed = false;
    }

    // Step 4: Filter tasks (by category and priority)
    console.log('\nStep 4: Filtering tasks...');
    
    // Status Filter
    res = await fetch(`${TASKS_URL}?status=Pending`, { headers });
    let pendingTasks = await res.json();
    if (res.status === 200 && pendingTasks.results === 3) {
      console.log('✔ Status filter (Pending) returned correct counts.');
    } else {
      console.error('❌ Failed status filter:', pendingTasks);
      passed = false;
    }

    // Priority Filter
    res = await fetch(`${TASKS_URL}?priority=High`, { headers });
    let highTasks = await res.json();
    if (res.status === 200 && highTasks.results === 1 && highTasks.data[0].title === 'Calculus Homework 5') {
      console.log('✔ Priority filter (High) returned correct task.');
    } else {
      console.error('❌ Failed priority filter:', highTasks);
      passed = false;
    }

    // Category Filter
    res = await fetch(`${TASKS_URL}?category=Exam`, { headers });
    let examTasks = await res.json();
    if (res.status === 200 && examTasks.results === 1 && examTasks.data[0].title === 'History Midterm Review') {
      console.log('✔ Category filter (Exam) returned correct task.');
    } else {
      console.error('❌ Failed category filter:', examTasks);
      passed = false;
    }

    // Step 5: Search tasks by keyword
    console.log('\nStep 5: Keyword searching tasks...');
    res = await fetch(`${TASKS_URL}?search=calculus`, { headers });
    let searchData = await res.json();
    if (res.status === 200 && searchData.results === 1 && searchData.data[0].title === 'Calculus Homework 5') {
      console.log('✔ Search (keyword "calculus") returned correct task.');
    } else {
      console.error('❌ Failed keyword search:', searchData);
      passed = false;
    }

    // Step 6: Update a single task (Mark completed)
    console.log('\nStep 6: Updating single task...');
    res = await fetch(`${TASKS_URL}/${taskId1}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'Completed', courseCode: 'MATH301-A' })
    });
    let updateData = await res.json();
    if (res.status === 200 && updateData.status === 'success' && updateData.data.status === 'Completed' && updateData.data.courseCode === 'MATH301-A') {
      console.log('✔ Successfully updated task completion status and course code.');
    } else {
      console.error('❌ Failed to update task:', res.status, updateData);
      passed = false;
    }

    // Step 7: Bulk actions
    console.log('\nStep 7: Verifying Bulk Actions endpoints...');
    
    // Bulk Status update to Completed
    res = await fetch(`${TASKS_URL}/bulk-status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: [taskId2, taskId3], status: 'Completed' })
    });
    let bulkStatusData = await res.json();
    if (res.status === 200 && bulkStatusData.status === 'success') {
      console.log('✔ Bulk status update succeeded.');
    } else {
      console.error('❌ Bulk status update failed:', res.status, bulkStatusData);
      passed = false;
    }

    // Verify change took place
    res = await fetch(`${TASKS_URL}?status=Completed`, { headers });
    let completedTasks = await res.json();
    if (res.status === 200 && completedTasks.results === 3) {
      console.log('✔ Bulk status verification confirmed (3 completed tasks in total).');
    } else {
      console.error('❌ Bulk status verification failed:', completedTasks);
      passed = false;
    }

    // Bulk Delete
    res = await fetch(`${TASKS_URL}/bulk-delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: [taskId1, taskId2] })
    });
    let bulkDeleteData = await res.json();
    if (res.status === 200 && bulkDeleteData.status === 'success') {
      console.log('✔ Bulk delete succeeded.');
    } else {
      console.error('❌ Bulk delete failed:', res.status, bulkDeleteData);
      passed = false;
    }

    // Verify deletion
    res = await fetch(TASKS_URL, { headers });
    let tasksRemaining = await res.json();
    if (res.status === 200 && tasksRemaining.results === 1 && tasksRemaining.data[0]._id === taskId3) {
      console.log('✔ Bulk delete verification confirmed (only task 3 remains).');
    } else {
      console.error('❌ Bulk delete verification failed:', tasksRemaining);
      passed = false;
    }

    // Step 8: Delete single task
    console.log('\nStep 8: Deleting final task...');
    res = await fetch(`${TASKS_URL}/${taskId3}`, {
      method: 'DELETE',
      headers
    });
    let deleteData = await res.json();
    if (res.status === 200 && deleteData.status === 'success') {
      console.log('✔ Deleted task 3 successfully.');
    } else {
      console.error('❌ Failed single task deletion:', res.status, deleteData);
      passed = false;
    }

    // Cleanup: Delete test user
    console.log('\nCleaning up database tester entries...');
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteOne({ email: testUser.email });
    await Task.deleteMany({ userId: authData.data._id }); // delete any stray tasks
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
      console.log('\n==== ALL TASK API VERIFICATION TESTS PASSED SUCCESSFULLY! ====\n');
      process.exit(0);
    } else {
      console.error('\n==== TESTS FAILED! PLEASE REVIEW ISSUES ENCOUNTERED. ====\n');
      process.exit(1);
    }
  }
};

startServer().then(async () => {
  await sleep(2000);
  runTests();
}).catch((err) => {
  console.error('Failed to spawn server process:', err);
  process.exit(1);
});
