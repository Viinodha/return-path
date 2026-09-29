import { RoleProfile, ResourceItem, JobPosting } from '../types';

export const SEEDED_ROLES: RoleProfile[] = [
  {
    id: 'data-analyst',
    roleName: 'Data Analyst',
    sector: 'Technology',
    description: 'Analyzes business and operational data to discover actionable insights, create visual dashboards, and inform strategic decisions.',
    requiredSkills: [
      { name: 'SQL Querying', level: 4, weight: 1.5, category: 'technical' },
      { name: 'Data Visualization & Dashboards', level: 4, weight: 1.4, category: 'technical' },
      { name: 'Exploratory Data Analysis', level: 3, weight: 1.2, category: 'core' },
      { name: 'Python for Data Analysis', level: 3, weight: 1.1, category: 'technical' },
      { name: 'Business Acumen & Storytelling', level: 3, weight: 1.0, category: 'core' },
      { name: 'Statistical Foundations', level: 3, weight: 1.0, category: 'core' },
    ],
    requiredTools: ['SQL', 'Power BI', 'Excel (Advanced)', 'Python (pandas)', 'Tableau'],
    typicalCareerGapsAccepted: true,
  },
  {
    id: 'jr-data-analyst',
    roleName: 'Junior Data Analyst',
    sector: 'Technology',
    description: 'Entry-level analytics role focused on querying databases, cleaning raw datasets, and producing weekly reporting dashboards.',
    requiredSkills: [
      { name: 'SQL Querying', level: 3, weight: 1.5, category: 'technical' },
      { name: 'Excel & Spreadsheet Modeling', level: 4, weight: 1.3, category: 'core' },
      { name: 'Data Visualization & Dashboards', level: 3, weight: 1.2, category: 'technical' },
      { name: 'Data Cleaning & Validation', level: 3, weight: 1.1, category: 'core' },
      { name: 'Business Communication', level: 2, weight: 0.9, category: 'soft' },
    ],
    requiredTools: ['SQL', 'Excel (Advanced)', 'Power BI', 'Google Sheets'],
    typicalCareerGapsAccepted: true,
  },
  {
    id: 'fin-analyst',
    roleName: 'Financial Analyst',
    sector: 'Finance',
    description: 'Evaluates financial performance, prepares 3-statement models, variance analyses, and assists in corporate capital budgeting.',
    requiredSkills: [
      { name: 'Financial Modeling', level: 4, weight: 1.6, category: 'technical' },
      { name: 'DCF & Valuation', level: 3, weight: 1.3, category: 'technical' },
      { name: 'Variance Analysis', level: 3, weight: 1.1, category: 'core' },
      { name: 'Financial Reporting (GAAP/IFRS)', level: 4, weight: 1.3, category: 'domain' },
      { name: 'Capital Budgeting', level: 2, weight: 0.9, category: 'domain' },
    ],
    requiredTools: ['Excel (Advanced)', 'Power BI', 'SAP ERP', 'Bloomberg Terminal'],
    typicalCareerGapsAccepted: true,
  },
  {
    id: 'fintech-bi',
    roleName: 'FinTech Data & BI Analyst',
    sector: 'FinTech',
    description: 'Bridges financial domains and modern cloud data stacks, building automated financial reconciliation and customer risk metrics.',
    requiredSkills: [
      { name: 'SQL Querying', level: 4, weight: 1.5, category: 'technical' },
      { name: 'Financial Analytics & Risk Metrics', level: 3, weight: 1.3, category: 'domain' },
      { name: 'Data Visualization & Dashboards', level: 4, weight: 1.2, category: 'technical' },
      { name: 'Python for Data Analysis', level: 3, weight: 1.1, category: 'technical' },
      { name: 'Data Cleaning & Validation', level: 3, weight: 1.0, category: 'core' },
    ],
    requiredTools: ['SQL', 'Power BI', 'Python (pandas)', 'Snowflake', 'Tableau'],
    typicalCareerGapsAccepted: true,
  },
  {
    id: 'jr-swe',
    roleName: 'Junior Software Engineer',
    sector: 'Technology',
    description: 'Builds and maintains web applications, writes clean tested code, integrates REST APIs, and collaborates via Git version control.',
    requiredSkills: [
      { name: 'TypeScript / JavaScript', level: 4, weight: 1.5, category: 'technical' },
      { name: 'Data Structures & Algorithms', level: 3, weight: 1.3, category: 'core' },
      { name: 'REST APIs & Backend Integration', level: 3, weight: 1.2, category: 'technical' },
      { name: 'Git Version Control', level: 3, weight: 1.1, category: 'technical' },
      { name: 'Testing (Unit & Integration)', level: 2, weight: 0.9, category: 'technical' },
    ],
    requiredTools: ['Git', 'Node.js', 'VS Code', 'PostgreSQL', 'Docker'],
    typicalCareerGapsAccepted: true,
  }
];

export const SEEDED_RESOURCES: ResourceItem[] = [
  {
    id: 'res-sql-1',
    skillName: 'SQL Querying',
    title: 'PostgreSQL & SQL for Data Science',
    provider: 'Coursera / UC Davis',
    effortHours: 28,
    officialUrl: 'https://www.coursera.org/learn/sql-for-data-science',
    description: 'Comprehensive SQL query design, multi-table joins, subqueries, aggregations, and query optimization for real analytical datasets.'
  },
  {
    id: 'res-sql-2',
    skillName: 'SQL Querying',
    title: 'Interactive Relational Database Course',
    provider: 'freeCodeCamp',
    effortHours: 35,
    officialUrl: 'https://www.freecodecamp.org/learn/relational-database/',
    description: 'Hands-on Linux terminal and PostgreSQL curriculum covering schema creation, foreign keys, window functions, and normalization.'
  },
  {
    id: 'res-pbi-1',
    skillName: 'Data Visualization & Dashboards',
    title: 'Microsoft Power BI Data Analyst Professional Certificate (PL-300)',
    provider: 'Microsoft / Coursera',
    effortHours: 45,
    officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/',
    description: 'Official Microsoft credential curriculum preparing candidates for end-to-end data modeling, DAX measure creation, and report publishing.'
  },
  {
    id: 'res-py-1',
    skillName: 'Python for Data Analysis',
    title: 'Applied Data Science with Python',
    provider: 'Coursera / University of Michigan',
    effortHours: 40,
    officialUrl: 'https://www.coursera.org/specializations/data-science-python',
    description: 'Hands-on data wrangling, cleaning, and statistical exploration using pandas, numpy, and matplotlib.'
  },
  {
    id: 'res-excel-1',
    skillName: 'Excel & Spreadsheet Modeling',
    title: 'Excel Skills for Business: Advanced',
    provider: 'Coursera / Macquarie University',
    effortHours: 24,
    officialUrl: 'https://www.coursera.org/learn/excel-advanced',
    description: 'Master advanced lookups (XLOOKUP), dynamic array formulas, PivotCharts, power query imports, and audit macros.'
  },
  {
    id: 'res-stat-1',
    skillName: 'Statistical Foundations',
    title: 'Introduction to Statistics',
    provider: 'Stanford Online / Coursera',
    effortHours: 30,
    officialUrl: 'https://online.stanford.edu/courses/xfds115-introduction-statistics',
    description: 'Core concepts in descriptive statistics, hypothesis testing, confidence intervals, and regression analysis.'
  },
  {
    id: 'res-fin-1',
    skillName: 'Financial Modeling',
    title: 'Financial Modeling & Valuation Analyst (FMVA)',
    provider: 'Corporate Finance Institute (CFI)',
    effortHours: 50,
    officialUrl: 'https://corporatefinanceinstitute.com/certifications/financial-modeling-valuation-analyst-fmva/',
    description: 'Industry-standard dynamic 3-statement financial modeling, DCF valuation, scenario analysis, and M&A impact sheets.'
  },
  {
    id: 'res-fin-2',
    skillName: 'DCF & Valuation',
    title: 'Business Valuation & Financial Analysis',
    provider: 'edX / Wharton School',
    effortHours: 20,
    officialUrl: 'https://www.edx.org/school/wharton',
    description: 'Intrinsic valuation methodologies, cost of capital (WACC) computations, and sensitivity matrices.'
  },
  {
    id: 'res-sap-1',
    skillName: 'Financial Reporting (GAAP/IFRS)',
    title: 'Financial Accounting & Reporting in SAP S/4HANA',
    provider: 'SAP Learning Journeys',
    effortHours: 35,
    officialUrl: 'https://learning.sap.com/',
    description: 'Official enterprise learning path for General Ledger accounting, financial close cycles, and compliant balance sheet reporting.'
  },
  {
    id: 'res-risk-1',
    skillName: 'Financial Analytics & Risk Metrics',
    title: 'FinTech: Foundations, Payments, and Risk',
    provider: 'Coursera / Wharton',
    effortHours: 25,
    officialUrl: 'https://www.coursera.org/specializations/wharton-fintech',
    description: 'Analysis of digital ledger transactions, credit underwriting algorithms, and risk measurement models.'
  },
  {
    id: 'res-eda-1',
    skillName: 'Exploratory Data Analysis',
    title: 'Data Cleaning & Exploratory Analysis Masterclass',
    provider: 'Kaggle Learn',
    effortHours: 15,
    officialUrl: 'https://www.kaggle.com/learn/data-cleaning',
    description: 'Practical tactics for handling missing values, imputing anomalies, parsing timestamps, and detecting outliers in real distributions.'
  },
  {
    id: 'res-clean-1',
    skillName: 'Data Cleaning & Validation',
    title: 'Google Data Analytics Professional Certificate',
    provider: 'Google / Coursera',
    effortHours: 60,
    officialUrl: 'https://grow.google/certificates/data-analytics/',
    description: 'Structured data preparation lifecycle: ask, prepare, process, analyze, share, and act with rigorous validation techniques.'
  },
  {
    id: 'res-ts-1',
    skillName: 'TypeScript / JavaScript',
    title: 'Full Stack Open: Modern Web Development',
    provider: 'University of Helsinki',
    effortHours: 50,
    officialUrl: 'https://fullstackopen.com/en/',
    description: 'Deep dive into TypeScript, React, Node.js REST backends, automated test suites, and state management.'
  },
  {
    id: 'res-git-1',
    skillName: 'Git Version Control',
    title: 'Version Control with Git',
    provider: 'Atlassian / Coursera',
    effortHours: 12,
    officialUrl: 'https://www.coursera.org/learn/version-control-with-git',
    description: 'Branching models, merge conflict resolution, pull request etiquette, rebasing, and CI/CD collaboration fundamentals.'
  },
  {
    id: 'res-dsa-1',
    skillName: 'Data Structures & Algorithms',
    title: 'CS50: Introduction to Computer Science',
    provider: 'Harvard University / edX',
    effortHours: 60,
    officialUrl: 'https://cs50.harvard.edu/x/',
    description: 'Algorithmic thinking, memory allocation, arrays, hash tables, trees, graphs, and algorithmic complexity (Big O).'
  }
];

export const SEEDED_JOBS: JobPosting[] = [
  {
    id: 'job-sap-india-1',
    title: 'Associate Data & Analytics Consultant (Back-to-Work Program)',
    company: 'SAP Labs India',
    location: 'Whitefield, Bengaluru, Karnataka, India (Hybrid)',
    city: 'Bengaluru',
    country: 'India',
    isIndia: true,
    sector: 'Technology',
    url: 'https://jobs.sap.com/location/bengaluru-jobs/1029384801/',
    fullText: `SAP Labs India is hiring an Associate Data & Analytics Consultant under our dedicated 'Back-to-Work' Diversity and Inclusive Workforce initiative at our Whitefield campus in Bengaluru.
This program is specifically designed to support professionals re-entering the technology sector after a career break of 12+ months (for caregiving, maternity/parental leave, personal transitions, or health).
What you will do:
- Query large-scale enterprise telemetry data using SQL across SAP HANA Cloud and modern data lakes.
- Build executive reporting dashboards and operational KPI views using Power BI and SAP Analytics Cloud.
- Cleanse, transform, and validate analytical data feeds in collaboration with functional product teams.
- Re-skill through structured SAP mentoring, pair-programming, and internal enablement bootcamps.
Qualifications:
- Prior foundational familiarity with SQL querying and relational databases.
- Hands-on comfort with spreadsheet modeling (Excel/Sheets) and data visualization tools (Power BI, Tableau, or SAC).
- Career break of 1 year or more welcomed with no penalty or continuous employment requirement.
- Strong motivation to refresh technical competencies in enterprise data analytics.`,
    requiredSkills: ['SQL Querying', 'Data Visualization & Dashboards', 'Excel & Spreadsheet Modeling'],
    preferredSkills: ['Python for Data Analysis', 'Data Cleaning & Validation'],
    requiredTools: ['SQL', 'Power BI', 'Excel (Advanced)', 'SAP ERP'],
    experienceYears: 1,
    education: "Bachelor's degree in Engineering, Computer Applications, Science, or Commerce with analytical aptitude",
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'SAP Labs India Back-to-Work program explicitly welcomes candidates with career breaks (12+ months). Zero continuous employment penalties; includes onboarding mentorship in Bengaluru.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-msft-hyd-1',
    title: 'Business Intelligence & Data Analyst (Springboard Re-Entry)',
    company: 'Microsoft India Development Centre',
    location: 'Gachibowli, Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
    isIndia: true,
    sector: 'Technology',
    url: 'https://careers.microsoft.com/v2/global/en/locations/hyderabad.html',
    fullText: `Microsoft India Development Centre (IDC) in Hyderabad invites applications from experienced professionals looking to transition back into full-time careers via our Springboard / Tech Re-Entry channel.
Key Responsibilities:
- Design SQL pipelines and develop automated Power BI dashboards tracking product usage telemetry across global cloud tenants.
- Conduct exploratory data analysis to surface anomaly patterns and user retention funnels.
- Partner with product managers and engineers to establish data validation rules.
Requirements:
- Proven previous experience or self-directed project portfolio in SQL query optimization and dashboard creation.
- Experience with Power BI, Excel DAX, or Python analytics packages.
- Career gaps are warmly welcomed; selection focuses on current demonstrated analytical thinking and project evidence.`,
    requiredSkills: ['SQL Querying', 'Data Visualization & Dashboards', 'Exploratory Data Analysis'],
    preferredSkills: ['Python for Data Analysis', 'Data Cleaning & Validation'],
    requiredTools: ['SQL', 'Power BI', 'Excel (Advanced)', 'Python (pandas)'],
    experienceYears: 2,
    education: 'B.Tech/B.E., MCA, B.Sc or equivalent verified project portfolio',
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'Part of Microsoft India Springboard Re-Entry initiative at Hyderabad IDC campus. Tailored for candidates re-entering tech.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-tcs-restart-1',
    title: 'Corporate Financial Analyst - Re-Start Initiative',
    company: 'Tata Consultancy Services (TCS)',
    location: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra, India',
    city: 'Mumbai',
    country: 'India',
    isIndia: true,
    sector: 'Finance',
    url: 'https://www.tcs.com/careers/india/re-start-tcs-women-corporate-careers',
    fullText: `TCS 'Re-Start with TCS' is a flagship national initiative to help professionals re-enter the corporate workforce after career hiatuses of 6 months to 8+ years.
The Corporate Finance and FP&A team at TCS Mumbai is hiring Financial Analysts to support global business unit financial operations.
Responsibilities:
- Perform financial reporting under Indian Accounting Standards (Ind AS) and IFRS.
- Assist in departmental budget variance analysis, cash flow forecasting, and cost center allocation in Excel and SAP ERP.
- Analyze monthly revenue margins and summarize variance drivers for leadership reviews.
Candidate Profile:
- Background in Commerce, Finance, B.Com, M.Com, or MBA Finance.
- Solid understanding of financial statements, variance analysis, and advanced Excel formulas.
- Career break for caregiving, maternity, or relocation is fully welcomed.`,
    requiredSkills: ['Financial Modeling', 'Variance Analysis', 'Financial Reporting (GAAP/IFRS)'],
    preferredSkills: ['Capital Budgeting', 'Excel & Spreadsheet Modeling'],
    requiredTools: ['Excel (Advanced)', 'SAP ERP', 'Power BI'],
    experienceYears: 2,
    education: 'B.Com, M.Com, MBA Finance, or semi-qualified CA/CMA/CFA',
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'Official TCS Re-Start program in Mumbai. Purpose-built to eliminate career gap stigma and provide structured re-skilling.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-stripe-blr-1',
    title: 'FinTech Analytics & Risk Operations Specialist',
    company: 'Stripe India',
    location: 'Indiranagar, Bengaluru, Karnataka, India / Remote India',
    city: 'Bengaluru',
    country: 'India',
    isIndia: true,
    sector: 'FinTech',
    url: 'https://stripe.com/jobs/search?q=india',
    fullText: `Stripe's engineering and operations team in Bengaluru powers payment infrastructure across India and international markets.
We are looking for a FinTech Analytics Specialist to inspect transaction velocity, model chargeback risks, and create real-time monitoring dashboards for UPI, credit card, and digital payment gateways.
What you'll do:
- Query transaction ledgers with SQL to identify abnormal merchant dispute velocities.
- Formulate automated reporting dashboards in Tableau or Power BI.
- Collaborate with risk engineers on exploratory data analysis using Python.
Requirements:
- 1-3 years of data or finance analysis experience (academic, personal project portfolio, or prior professional roles).
- Strong SQL proficiency (CTEs, window functions) and risk metric intuition.
- Return-to-work professionals with refreshed project evidence are strongly encouraged to apply.`,
    requiredSkills: ['SQL Querying', 'Data Visualization & Dashboards', 'Financial Analytics & Risk Metrics'],
    preferredSkills: ['Python for Data Analysis', 'Exploratory Data Analysis'],
    requiredTools: ['SQL', 'Power BI', 'Python (pandas)', 'Snowflake'],
    experienceYears: 2,
    education: 'Degree in Engineering, Math, Finance, or equivalent practical portfolio',
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'Stripe India champions non-linear career journeys and return-to-work candidates with verifiable portfolio work. Remote option available.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-flipkart-blr-1',
    title: 'Business Intelligence & Operations Analyst',
    company: 'Flipkart (Walmart Group)',
    location: 'Bellandur, Outer Ring Road, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    country: 'India',
    isIndia: true,
    sector: 'Technology',
    url: 'https://www.flipkartcareers.com/',
    fullText: `Flipkart's Supply Chain & Marketplace analytics division is hiring a BI & Operations Analyst in Bengaluru.
Our team drives logistics optimization, merchant delivery performance, and marketplace telemetry.
Responsibilities:
- Write optimized SQL queries against high-volume operational clickstream and order databases.
- Develop interactive dashboards for category managers in Power BI and Google Data Studio.
- Perform root cause data cleaning and validation for fulfillment bottlenecks.
Requirements:
- Solid skills in SQL querying and business metric reporting.
- Advanced spreadsheet modeling (PivotTables, Lookups, Power Query).
- Candidates returning from career breaks are actively evaluated based on competency and test assignments.`,
    requiredSkills: ['SQL Querying', 'Data Visualization & Dashboards', 'Excel & Spreadsheet Modeling'],
    preferredSkills: ['Data Cleaning & Validation', 'Python for Data Analysis'],
    requiredTools: ['SQL', 'Power BI', 'Excel (Advanced)'],
    experienceYears: 1,
    education: "Bachelor's degree in any discipline",
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'No unbroken work history clause in Flipkart hiring guidelines. Evaluation is strictly portfolio and technical assessment based.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-infosys-pune-1',
    title: 'Junior Software Engineer (Restart with Infosys)',
    company: 'Infosys Limited',
    location: 'Hinjawadi Phase 2, Pune, Maharashtra, India',
    city: 'Pune',
    country: 'India',
    isIndia: true,
    sector: 'Technology',
    url: 'https://www.infosys.com/careers/restart-with-infosys.html',
    fullText: `'Restart with Infosys' is designed to provide women and returning professionals a smooth launchpad back into mainstream tech careers.
We are looking for Junior Software Engineers at our Hinjawadi, Pune development center.
What you'll do:
- Develop scalable web applications using TypeScript/JavaScript, React, and Node.js.
- Build RESTful APIs and integrate with PostgreSQL and cloud storage services.
- Write unit tests and participate in agile sprints with Git version control.
Requirements:
- Solid grasp of JavaScript or TypeScript and web fundamentals.
- Understanding of Git version control and relational databases.
- Prior career break of 12+ months welcomed under the Restart with Infosys program, with comprehensive upskilling provided.`,
    requiredSkills: ['TypeScript / JavaScript', 'REST APIs & Backend Integration', 'Git Version Control'],
    preferredSkills: ['Testing (Unit & Integration)', 'Data Structures & Algorithms'],
    requiredTools: ['Git', 'Node.js', 'PostgreSQL', 'VS Code'],
    experienceYears: 1,
    education: 'B.E./B.Tech/BCA/MCA/B.Sc or verified equivalent development portfolio',
    gapRestriction: 'returner_friendly',
    gapAnalysisNote: 'Official Restart with Infosys program in Pune. Built specifically for candidates with career breaks, featuring paid onboarding re-training.',
    sourceType: 'verified_seed'
  },
  {
    id: 'job-google-blr-1',
    title: 'Associate Data Analyst, Trust & Operations',
    company: 'Google India',
    location: 'RMZ Infinity, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    country: 'India',
    isIndia: true,
    sector: 'Technology',
    url: 'https://www.google.com/about/careers/applications/jobs/results/?location=India',
    fullText: `Google India in Bengaluru is seeking an Associate Data Analyst to analyze product trust operations, user safety telemetry, and partner ecosystem metrics.
Responsibilities:
- Write and optimize SQL queries across BigQuery datasets to monitor integrity metrics.
- Translate ambiguous operational questions into structured dashboards.
- Partner with policy managers and engineering teams to identify trend anomalies.
Requirements:
- Demonstrated experience querying large relational or columnar datasets with SQL.
- Strong visual communication skills and experience building dashboards.
- Google welcomes non-traditional candidate paths, career breaks, and diverse self-taught or upskilled returners.`,
    requiredSkills: ['SQL Querying', 'Data Visualization & Dashboards', 'Exploratory Data Analysis'],
    preferredSkills: ['Python for Data Analysis', 'Business Acumen & Storytelling'],
    requiredTools: ['SQL', 'Power BI', 'Python (pandas)', 'Tableau'],
    experienceYears: 2,
    education: 'Degree or equivalent practical experience',
    gapRestriction: 'none_found',
    gapAnalysisNote: 'Google evaluates candidates on cognitive ability and domain competency. No disqualifying career break clauses found.',
    sourceType: 'verified_seed'
  }
];
