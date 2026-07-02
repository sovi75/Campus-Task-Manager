const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Task = require('../models/Task');

// Load environment variables from backend/../.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
  try {
    // 1. Connect to Database
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_task_manager';
    console.log(`Connecting to database at ${dbUri}...`);
    await mongoose.connect(dbUri);
    console.log('Database connected successfully.');

    // 2. Clear existing collections
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('Collections cleared.');

    // 3. Create a dummy user
    console.log('Creating seed user...');
    const user = await User.create({
      name: 'Alex',
      email: 'alex@university.edu',
      password: 'password123' // Will be hashed automatically by pre-save hook
    });
    console.log(`Seed user created: ${user.name} (${user.email})`);

    // Helper to calculate relative times
    const getRelativeDate = (daysOffset, hours, minutes) => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // 4. Create sample tasks representing those seen in the UI prototypes
    console.log('Creating seed tasks...');
    const tasks = [
      {
        title: 'Advanced Calculus Problem Set 4',
        description: 'Complete all problems from Chapter 5. Focus on triple integrals and their applications in physics. Need to consult the textbook for question 7.',
        dueDate: getRelativeDate(0, 23, 59), // Today at 11:59 PM
        priority: 'High',
        status: 'Pending',
        category: 'Assignment',
        courseCode: 'MATH302',
        reminders: { enabled: true, option: '1 hour before' },
        userId: user._id
      },
      {
        title: 'Modern History Midterm Exam',
        description: 'Covers the industrial revolution to the Cold War. Prepare summary notes for the study session.',
        dueDate: getRelativeDate(1, 11, 30), // Tomorrow at 11:30 AM
        priority: 'High',
        status: 'Pending',
        category: 'Exam',
        courseCode: 'HIST110',
        reminders: { enabled: true, option: '1 day before' },
        userId: user._id
      },
      {
        title: 'UX Design Case Study Draft',
        description: 'Finalize the persona section and start working on the user flow diagrams. Export the final PDF.',
        dueDate: getRelativeDate(-1, 17, 0), // Yesterday at 5:00 PM (Overdue)
        priority: 'Medium',
        status: 'Pending',
        category: 'Project',
        courseCode: 'UXD305',
        reminders: { enabled: false, option: 'none' },
        userId: user._id
      },
      {
        title: 'Register for Spring Semester',
        description: 'Check credit requirements and available electives. Make sure to choose the morning sections.',
        dueDate: getRelativeDate(5, 12, 0), // In 5 days
        priority: 'Low',
        status: 'Completed',
        category: 'Personal',
        courseCode: 'Admin',
        reminders: { enabled: false, option: 'none' },
        userId: user._id
      },
      {
        title: 'Chemistry Lab Report: Titration',
        description: 'Write up the observations from Wednesday lab. Include the titration curves and error analysis.',
        dueDate: getRelativeDate(2, 15, 0), // In 2 days at 3:00 PM
        priority: 'Medium',
        status: 'Pending',
        category: 'Assignment',
        courseCode: 'CHEM101',
        reminders: { enabled: true, option: '1 hour before' },
        userId: user._id
      },
      {
        title: 'Discrete Math Quiz 3',
        description: 'Study propositional logic and set theory rules for the short quiz.',
        dueDate: getRelativeDate(0, 14, 0), // Today at 2:00 PM
        priority: 'High',
        status: 'Pending',
        category: 'Exam',
        courseCode: 'CS202',
        reminders: { enabled: true, option: 'At time of due' },
        userId: user._id
      },
      {
        title: 'English Essay First Draft',
        description: 'Draft the intro and first two body paragraphs discussing literature realism.',
        dueDate: getRelativeDate(4, 9, 0), // In 4 days at 9:00 AM
        priority: 'Medium',
        status: 'Pending',
        category: 'Assignment',
        courseCode: 'ENG112',
        reminders: { enabled: false, option: 'none' },
        userId: user._id
      },
      {
        title: 'Club Meeting',
        description: 'Monthly ACM Student Org planning session and project review.',
        dueDate: getRelativeDate(0, 16, 0), // Today at 4:00 PM
        priority: 'Low',
        status: 'Pending',
        category: 'Personal',
        courseCode: 'ACM Org',
        reminders: { enabled: false, option: 'none' },
        userId: user._id
      }
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log(`Successfully seeded ${createdTasks.length} tasks.`);
    
    // 5. Query validation
    console.log('\nValidating database queries...');
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    console.log(`Validation stats: Users count = ${userCount}, Tasks count = ${taskCount}`);
    
    const sampleUserTasks = await Task.find({ userId: user._id });
    console.log(`Sample fetch: User ${user.name} has ${sampleUserTasks.length} tasks in the database.`);

    mongoose.connection.close();
    console.log('Database connection closed safely. Seeding complete.');
  } catch (error) {
    console.error('Seeding error occurred:', error);
    process.exit(1);
  }
};

seedData();
