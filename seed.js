const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Team = require('./models/Team');
const Task = require('./models/Task');
const Resource = require('./models/Resource');
const Exam = require('./models/Exam');

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    phone: '1234567890',
    status: 'active'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'intern123',
    role: 'intern',
    phone: '9876543210',
    skills: ['JavaScript', 'React', 'Node.js'],
    status: 'active'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'intern123',
    role: 'intern',
    phone: '9876543211',
    skills: ['Python', 'Django', 'MySQL'],
    status: 'active'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'intern123',
    role: 'intern',
    phone: '9876543212',
    skills: ['HTML', 'CSS', 'Bootstrap'],
    status: 'pending'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    await Resource.deleteMany({});
    await Exam.deleteMany({});
    console.log('Existing data cleared');

    // Create users
    const users = await User.create(sampleUsers);
    console.log('Users created:', users.length);

    const admin = users.find(u => u.role === 'admin');
    const interns = users.filter(u => u.role === 'intern');

    // Create a team
    const team = await Team.create({
      name: 'Web Development Team',
      description: 'Full-stack web development internship team',
      admin: admin._id,
      members: interns.map(i => i._id),
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });
    console.log('Team created:', team.name);

    // Update users with team
    await User.updateMany(
      { _id: { $in: interns.map(i => i._id) } },
      { team: team._id }
    );

    // Create tasks
    const tasks = await Task.create([
      {
        title: 'Build a Landing Page',
        description: 'Create a responsive landing page using HTML, CSS, and Bootstrap',
        team: team._id,
        assignedTo: [interns[0]._id, interns[1]._id],
        createdBy: admin._id,
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Create REST API',
        description: 'Build a RESTful API using Node.js and Express',
        team: team._id,
        assignedTo: [interns[0]._id],
        createdBy: admin._id,
        priority: 'urgent',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Database Design',
        description: 'Design and implement a MongoDB database schema',
        team: team._id,
        assignedTo: [interns[1]._id, interns[2]._id],
        createdBy: admin._id,
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Tasks created:', tasks.length);

    // Create resources
    const resources = await Resource.create([
      {
        title: 'JavaScript Basics Tutorial',
        description: 'Comprehensive guide to JavaScript fundamentals',
        type: 'link',
        url: 'https://javascript.info',
        team: team._id,
        uploadedBy: admin._id,
        tags: ['javascript', 'tutorial', 'beginner'],
        isPublic: true
      },
      {
        title: 'React Documentation',
        description: 'Official React documentation and guides',
        type: 'link',
        url: 'https://react.dev',
        team: team._id,
        uploadedBy: admin._id,
        tags: ['react', 'documentation', 'frontend'],
        isPublic: true
      },
      {
        title: 'Node.js Best Practices',
        description: 'Best practices for Node.js development',
        type: 'document',
        team: team._id,
        uploadedBy: admin._id,
        tags: ['nodejs', 'backend', 'best-practices'],
        isPublic: false
      }
    ]);
    console.log('Resources created:', resources.length);

    // Create an exam
    const exam = await Exam.create({
      title: 'JavaScript Fundamentals Assessment',
      description: 'Test your knowledge of JavaScript basics',
      team: team._id,
      createdBy: admin._id,
      duration: 30,
      passingScore: 70,
      isActive: true,
      questions: [
        {
          question: 'What is the correct syntax for referring to an external script called "app.js"?',
          type: 'multiple-choice',
          options: [
            '<script src="app.js">',
            '<script name="app.js">',
            '<script href="app.js">',
            '<script file="app.js">'
          ],
          correctAnswer: '<script src="app.js">',
          points: 10
        },
        {
          question: 'JavaScript is a case-sensitive language.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 5
        },
        {
          question: 'Which company developed JavaScript?',
          type: 'multiple-choice',
          options: [
            'Microsoft',
            'Netscape',
            'Google',
            'Mozilla'
          ],
          correctAnswer: 'Netscape',
          points: 10
        },
        {
          question: 'What does DOM stand for?',
          type: 'short-answer',
          correctAnswer: 'Document Object Model',
          points: 15
        },
        {
          question: 'Which method is used to parse a string to an integer in JavaScript?',
          type: 'multiple-choice',
          options: [
            'parseInt()',
            'parseInteger()',
            'toInteger()',
            'int()'
          ],
          correctAnswer: 'parseInt()',
          points: 10
        }
      ]
    });
    console.log('Exam created:', exam.title);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Sample Login Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nInterns:');
    console.log('  Email: john@example.com | Password: intern123');
    console.log('  Email: jane@example.com | Password: intern123');
    console.log('  Email: mike@example.com | Password: intern123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
