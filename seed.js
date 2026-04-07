import mongoose from 'mongoose';
import Job from './src/models/Job.model.js';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = 'mongodb+srv://np03cs4a230066_db_user:iwFgzN1MKWoYIhGL@cluster0.r9xxpgb.mongodb.net/?appName=Cluster0';

const seedJobs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing jobs (optional - comment out to keep existing data)
    // await Job.deleteMany({});
    // console.log('Cleared existing jobs');

    const jobs = [
      // 5 Jobs
      {
        title: 'Senior Full Stack Developer',
        company: 'Herald College Kathmandu',
        type: 'Job',
        location: 'Kathmandu',
        duration: 'Full-time',
        postDate: new Date(),
        description: 'Looking for an experienced full stack developer to lead our development team. You will work on cutting-edge technologies and manage a team of junior developers.',
        salary: 'NPR 100,000 - 150,000/month',
        skills: ['Node.js', 'React', 'MongoDB', 'AWS', 'Docker', 'TypeScript'],
        deadline: '2026-04-30',
        requirements: [
          '5+ years of experience in full stack development',
          'Strong knowledge of Node.js and React',
          'Experience with AWS and cloud services',
          'Leadership and team management skills',
          'Bachelor\'s degree in Computer Science or related field',
          'Excellent communication skills'
        ],
        responsibilities: [
          'Lead a team of developers',
          'Develop and maintain full stack applications',
          'Conduct code reviews and improve code quality',
          'Collaborate with product managers and designers',
          'Mentor junior developers',
          'Implement best practices and technical standards'
        ],
        benefits: [
          'Competitive salary',
          'Health insurance and life insurance',
          'Performance bonus',
          'Professional development allowance',
          'Flexible working hours',
          'Remote work options'
        ],
        applicants: 0
      },
      {
        title: 'DevOps Engineer',
        company: 'Herald College Kathmandu',
        type: 'Job',
        location: 'Lalitpur',
        duration: 'Full-time',
        postDate: new Date(),
        description: 'We are seeking a DevOps engineer to manage our cloud infrastructure and ensure smooth deployment pipelines.',
        salary: 'NPR 80,000 - 120,000/month',
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Jenkins'],
        deadline: '2026-04-25',
        requirements: [
          '3+ years of DevOps experience',
          'Experience with Docker and Kubernetes',
          'AWS certification preferred',
          'Strong Linux administration skills',
          'Experience with CI/CD tools',
          'Problem-solving mindset'
        ],
        responsibilities: [
          'Manage cloud infrastructure',
          'Implement and maintain CI/CD pipelines',
          'Monitor system performance',
          'Handle infrastructure security',
          'Troubleshoot deployment issues',
          'Automate repetitive tasks'
        ],
        benefits: [
          'Competitive salary',
          'AWS certification sponsorship',
          'Remote-first culture',
          'Learning and development budget',
          'Health insurance',
          'Work-life balance'
        ],
        applicants: 0
      },
      {
        title: 'Data Scientist',
        company: 'Herald College Kathmandu',
        type: 'Job',
        location: 'Bhaktapur',
        duration: 'Full-time',
        postDate: new Date(),
        description: 'Join our data science team to solve complex business problems using machine learning and data analytics.',
        salary: 'NPR 90,000 - 130,000/month',
        skills: ['Python', 'Machine Learning', 'Pandas', 'TensorFlow', 'SQL', 'Tableau'],
        deadline: '2026-05-01',
        requirements: [
          'Master\'s in Computer Science, Statistics or Mathematics',
          'Strong Python programming skills',
          'Machine learning and deep learning experience',
          'Statistical analysis expertise',
          'SQL and data manipulation skills',
          'Communication skills for presenting insights'
        ],
        responsibilities: [
          'Develop machine learning models',
          'Analyze large datasets',
          'Create data visualizations',
          'Collaborate with business teams',
          'Optimize models for production',
          'Document methodologies and findings'
        ],
        benefits: [
          'Research allowance',
          'Conference attendance support',
          'Hardware allowance',
          'Health insurance',
          'Flexible work environment',
          'Competitive compensation'
        ],
        applicants: 0
      },
      {
        title: 'Mobile App Developer (iOS)',
        company: 'Herald College Kathmandu',
        type: 'Job',
        location: 'Pokhara',
        duration: 'Full-time',
        postDate: new Date(),
        description: 'Develop iOS applications using Swift and create amazing user experiences for millions of users.',
        salary: 'NPR 85,000 - 125,000/month',
        skills: ['Swift', 'iOS Development', 'Objective-C', 'SwiftUI', 'Xcode', 'Firebase'],
        deadline: '2026-04-28',
        requirements: [
          '3+ years of iOS development experience',
          'Proficiency in Swift',
          'Knowledge of iOS design patterns',
          'App Store deployment experience',
          'Understanding of mobile optimization',
          'Problem-solving skills'
        ],
        responsibilities: [
          'Develop iOS applications',
          'Implement UI/UX designs',
          'Optimize app performance',
          'Debug and fix issues',
          'Collaborate with backend developers',
          'Submit apps to App Store'
        ],
        benefits: [
          'Latest Apple devices',
          'Professional development',
          'Competitive salary',
          'Health and wellness benefits',
          'Flexible schedule',
          'Creative work environment'
        ],
        applicants: 0
      },
      {
        title: 'Project Manager',
        company: 'Herald College Kathmandu',
        type: 'Job',
        location: 'Kathmandu',
        duration: 'Full-time',
        postDate: new Date(),
        description: 'Lead software development projects and manage teams to deliver quality solutions on time.',
        salary: 'NPR 75,000 - 110,000/month',
        skills: ['Project Management', 'Agile', 'Leadership', 'Communication', 'Risk Management'],
        deadline: '2026-04-26',
        requirements: [
          '4+ years of project management experience',
          'Agile/Scrum certification preferred',
          'Leadership and team management skills',
          'Technical background beneficial',
          'Excellent planning abilities',
          'Strong communication skills'
        ],
        responsibilities: [
          'Manage project timelines and budgets',
          'Lead development teams',
          'Communicate with stakeholders',
          'Handle project risks',
          'Ensure quality deliverables',
          'Conduct team meetings and reviews'
        ],
        benefits: [
          'Competitive salary',
          'Performance incentives',
          'Professional certifications',
          'Health insurance',
          'Team building allowance',
          'Career growth opportunities'
        ],
        applicants: 0
      },

      // 5 Internships
      {
        title: 'Frontend Developer Intern',
        company: 'Herald College Kathmandu',
        type: 'Internship',
        location: 'Kathmandu',
        duration: '3 months',
        postDate: new Date(),
        description: 'Join our frontend team to work on modern React applications. Learn from experienced developers and contribute to real-world projects.',
        salary: 'NPR 15,000 - 25,000/month',
        skills: ['React', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Git'],
        deadline: '2026-04-20',
        requirements: [
          'Currently pursuing or recently completed Bachelor\'s in Computer Science',
          'Basic React knowledge',
          'Familiarity with JavaScript',
          'Knowledge of Git',
          'Enthusiasm to learn',
          'Good communication skills'
        ],
        responsibilities: [
          'Develop React components',
          'Implement UI designs',
          'Participate in code reviews',
          'Write clean, maintainable code',
          'Collaborate with the team',
          'Debug and fix issues'
        ],
        benefits: [
          'Mentorship from senior developers',
          'Hands-on learning experience',
          'Certificate upon completion',
          'Possibility of full-time offer',
          'Flexible schedule',
          'Modern work environment'
        ],
        applicants: 0
      },
      {
        title: 'Backend Developer Intern',
        company: 'Herald College Kathmandu',
        type: 'Internship',
        location: 'Lalitpur',
        duration: '6 months',
        postDate: new Date(),
        description: 'Build scalable backend systems using Node.js and MongoDB. Gain experience in database design and API development.',
        salary: 'NPR 20,000 - 30,000/month',
        skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript'],
        deadline: '2026-04-22',
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          'Basic Node.js knowledge',
          'Understanding of databases',
          'Problem-solving skills',
          'Eager to learn new technologies',
          'Team player mindset'
        ],
        responsibilities: [
          'Develop REST APIs',
          'Design database schemas',
          'Write backend logic',
          'Collaborate with frontend developers',
          'Write unit tests',
          'Document code and APIs'
        ],
        benefits: [
          'Real-world experience',
          'Mentorship',
          'Flexible working hours',
          'Certificate',
          'Possibility of conversion',
          'Learning resources'
        ],
        applicants: 0
      },
      {
        title: 'UI/UX Design Intern',
        company: 'Herald College Kathmandu',
        type: 'Internship',
        location: 'Kathmandu',
        duration: '3 months',
        postDate: new Date(),
        description: 'Design beautiful user interfaces and conduct UX research. Work with Figma and create design systems.',
        salary: 'NPR 12,000 - 20,000/month',
        skills: ['Figma', 'UI Design', 'UX Research', 'Adobe XD', 'Prototyping'],
        deadline: '2026-04-18',
        requirements: [
          'Pursuing or completed degree in Design or related field',
          'Proficiency in Figma or Adobe XD',
          'Portfolio with design samples',
          'Understanding of design principles',
          'Attention to detail',
          'Creativity and innovation'
        ],
        responsibilities: [
          'Create UI mockups',
          'Conduct user research',
          'Design prototypes',
          'Participate in design reviews',
          'Create design documentation',
          'Implement feedback'
        ],
        benefits: [
          'Portfolio building',
          'Industry experience',
          'Design mentorship',
          'Certificate',
          'Creative environment',
          'Networking opportunities'
        ],
        applicants: 0
      },
      {
        title: 'Data Analytics Intern',
        company: 'Herald College Kathmandu',
        type: 'Internship',
        location: 'Bhaktapur',
        duration: '4 months',
        postDate: new Date(),
        description: 'Analyze data and create insights using Python and SQL. Build dashboards and reports for stakeholders.',
        salary: 'NPR 18,000 - 28,000/month',
        skills: ['Python', 'SQL', 'Excel', 'Tableau', 'Data Analysis'],
        deadline: '2026-04-24',
        requirements: [
          'Bachelor\'s student in Statistics, Mathematics, or Computer Science',
          'Basic Python knowledge',
          'SQL fundamentals',
          'Excel skills',
          'Analytical thinking',
          'Attention to detail'
        ],
        responsibilities: [
          'Collect and clean data',
          'Perform data analysis',
          'Create visualizations',
          'Build dashboards',
          'Generate insights and reports',
          'Support business decisions'
        ],
        benefits: [
          'Practical experience',
          'Industry tools training',
          'Mentorship',
          'Certificate',
          'Potential for full-time role',
          'Professional growth'
        ],
        applicants: 0
      },
      {
        title: 'QA Engineer Intern',
        company: 'Herald College Kathmandu',
        type: 'Internship',
        location: 'Lalitpur',
        duration: '3 months',
        postDate: new Date(),
        description: 'Test software applications, identify bugs, and ensure quality standards. Learn automation testing tools.',
        salary: 'NPR 14,000 - 22,000/month',
        skills: ['Manual Testing', 'Selenium', 'Test Planning', 'Bug Reporting', 'JIRA'],
        deadline: '2026-04-19',
        requirements: [
          'Pursuing degree in Computer Science or related field',
          'Understanding of software testing',
          'Attention to detail',
          'Problem-solving skills',
          'Basic knowledge of Selenium (optional)',
          'Good communication skills'
        ],
        responsibilities: [
          'Execute test cases',
          'Report bugs and issues',
          'Test new features',
          'Participate in code reviews',
          'Document test results',
          'Suggest improvements'
        ],
        benefits: [
          'Testing tools training',
          'Real project experience',
          'Mentorship',
          'Certificate',
          'Conversion opportunity',
          'Quality-focused culture'
        ],
        applicants: 0
      },

      // 5 Traineeships
      {
        title: 'Full Stack Development Trainee',
        company: 'Herald College Kathmandu',
        type: 'Traineeship',
        location: 'Kathmandu',
        duration: '6 months',
        postDate: new Date(),
        description: 'Comprehensive training program covering both frontend and backend development. Hands-on projects and real-world scenarios.',
        salary: 'NPR 10,000 - 18,000/month',
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'HTML/CSS'],
        deadline: '2026-05-05',
        requirements: [
          'High School Diploma or equivalent',
          'Basic programming knowledge',
          'Willingness to learn',
          'Problem-solving interest',
          'Computer with internet access',
          'Dedication for 6 months'
        ],
        responsibilities: [
          'Complete training modules',
          'Build practical projects',
          'Participate in group projects',
          'Attend workshops',
          'Submit assignments',
          'Present final project'
        ],
        benefits: [
          'Comprehensive curriculum',
          'Certified trainers',
          'Project portfolio building',
          'Certificate of completion',
          'Potential job placement',
          'Industry exposure'
        ],
        applicants: 0
      },
      {
        title: 'Mobile Development Trainee',
        company: 'Herald College Kathmandu',
        type: 'Traineeship',
        location: 'Pokhara',
        duration: '4 months',
        postDate: new Date(),
        description: 'Learn Android and iOS development from scratch. Build real mobile applications and publish on app stores.',
        salary: 'NPR 12,000 - 20,000/month',
        skills: ['Flutter', 'Dart', 'Mobile Development', 'UI/UX', 'Firebase'],
        deadline: '2026-05-02',
        requirements: [
          'Basic programming knowledge',
          'Interest in mobile development',
          'Laptop with development tools',
          'Self-motivated learner',
          'Time commitment of 4 months',
          'Passion for building apps'
        ],
        responsibilities: [
          'Learn Flutter and Dart',
          'Develop mobile applications',
          'Complete coding challenges',
          'Build capstone project',
          'Join study groups',
          'Present projects'
        ],
        benefits: [
          'Hands-on training',
          'Live projects',
          'Industry mentorship',
          'Certification',
          'Portfolio building',
          'Networking opportunities'
        ],
        applicants: 0
      },
      {
        title: 'Web Design Trainee',
        company: 'Herald College Kathmandu',
        type: 'Traineeship',
        location: 'Kathmandu',
        duration: '3 months',
        postDate: new Date(),
        description: 'Master modern web design principles. Work with design tools and create stunning websites.',
        salary: 'NPR 8,000 - 15,000/month',
        skills: ['Figma', 'Web Design', 'Adobe XD', 'Typography', 'Color Theory'],
        deadline: '2026-04-29',
        requirements: [
          'Interest in design and creativity',
          'Basic computer skills',
          'Eye for design',
          'Willingness to learn design tools',
          'Portfolio (can be beginner)',
          'Dedication to learn'
        ],
        responsibilities: [
          'Learn design principles',
          'Master design tools',
          'Create web designs',
          'Get design feedback',
          'Iterate on designs',
          'Build portfolio'
        ],
        benefits: [
          'Professional training',
          'Tool licenses provided',
          'Design portfolio development',
          'Certification',
          'Freelance opportunities',
          'Industry connections'
        ],
        applicants: 0
      },
      {
        title: 'Digital Marketing Trainee',
        company: 'Herald College Kathmandu',
        type: 'Traineeship',
        location: 'Lalitpur',
        duration: '3 months',
        postDate: new Date(),
        description: 'Learn SEO, SEM, and social media marketing. Execute real campaigns and analyze results.',
        salary: 'NPR 9,000 - 16,000/month',
        skills: ['SEO', 'SEM', 'Social Media Marketing', 'Analytics', 'Content Marketing'],
        deadline: '2026-05-03',
        requirements: [
          'Bachelor\'s degree (any stream)',
          'Interest in marketing',
          'Strong communication skills',
          'Digital-savvy mindset',
          'Analytical thinking',
          'Time management'
        ],
        responsibilities: [
          'Learn marketing fundamentals',
          'Execute social media campaigns',
          'Analyze marketing metrics',
          'Create content',
          'Optimize ads',
          'Report on performance'
        ],
        benefits: [
          'Marketing tool training',
          'Real campaign experience',
          'Mentorship',
          'Certification',
          'Career opportunities',
          'Industry exposure'
        ],
        applicants: 0
      },
      {
        title: 'Cloud Computing Trainee',
        company: 'Herald College Kathmandu',
        type: 'Traineeship',
        location: 'Bhaktapur',
        duration: '5 months',
        postDate: new Date(),
        description: 'Get certified in AWS and cloud infrastructure. Hands-on labs and real-world scenarios included.',
        salary: 'NPR 11,000 - 19,000/month',
        skills: ['AWS', 'Cloud Computing', 'Linux', 'Networking', 'Docker'],
        deadline: '2026-05-04',
        requirements: [
          'Basic IT knowledge',
          'Linux fundamentals',
          'Networking basics',
          'Technical interest',
          'Laptop for setup',
          '5 months commitment'
        ],
        responsibilities: [
          'Study AWS services',
          'Complete hands-on labs',
          'Compile case studies',
          'Build infrastructure',
          'Prepare for certification',
          'Document learning'
        ],
        benefits: [
          'AWS certification prep',
          'Exam voucher included',
          'Hands-on experience',
          'Lab environment access',
          'Certification upon completion',
          'High-demand skills training'
        ],
        applicants: 0
      }
    ];

    // Insert jobs into database
    const result = await Job.insertMany(jobs);
    console.log(`Successfully created ${result.length} opportunities:`);
    console.log(`- 5 Jobs`);
    console.log(`- 5 Internships`);
    console.log(`- 5 Traineeships`);
    console.log('\nAll opportunities are now available in the system!');

  } catch (error) {
    console.error('Error seeding jobs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed
seedJobs();
