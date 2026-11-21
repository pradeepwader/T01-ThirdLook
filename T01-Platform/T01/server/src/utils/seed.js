/** npm run seed  ->  creates the admin account, sample products and default landing content (safe to re-run). */
const env = require('../config/env');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Content = require('../models/Content');
const defaults = require('../services/defaultContent');

const t = (text) => ({ type: 'text', text });
const h = (text) => ({ type: 'heading', text });
const task = (text) => ({ type: 'task', text });
const activity = (text) => ({ type: 'activity', text });
const quiz = (text, options, correct, explanation) => ({ type: 'quiz', text, options, correct, explanation });
const link = (text, url) => ({ type: 'link', text, url });

// 3 example e-books. The admin can edit, add or remove all of this in Admin > Products > Content.
const products = [
  {
    title: 'Career Roadmap Starter Pack', slug: 'career-roadmap-starter-pack', category: 'roadmap', price: 199, compareAtPrice: 499, isFeatured: true,
    tagline: 'Know which career paths exist and what to learn first.',
    description: 'A step-by-step e-book that helps you pick a direction, understand the skills it needs and build a learning order you can actually follow.',
    audience: 'Students and fresh graduates who feel lost about which career to choose and what to learn first.',
    features: ['Chapter-wise reading with short activities', 'Skills checklist you can tick off', 'Quick tests after each topic', 'Suggested learning order'],
    chapters: [
      { title: 'Finding your direction', summary: 'Understand yourself before choosing a path.', topics: [
        { title: 'Why a roadmap matters', blocks: [
          t('Most students do not fail because they lack ability. They fail because they **never decide where they are going**, so effort is spread everywhere.\n\nA roadmap turns a vague wish ("I want a good job") into small steps you can finish one week at a time.'),
          h('How to use this e-book'),
          t('Read one topic, do the short activity, and tick the task when you finish. Your progress is saved automatically.'),
          task('I understand how this e-book works'),
          quiz('What does a roadmap mainly give you?', ['A guaranteed job', 'Small steps toward a clear goal', 'A list of companies'], 1, 'A roadmap breaks a big goal into steps you can complete.'),
        ] },
        { title: 'Know your interests and strengths', blocks: [
          t('Your best options usually sit where **what you enjoy**, **what you are good at** and **what the market pays for** overlap.'),
          activity('Write down 3 things you enjoy doing even when nobody is watching, and 3 things people often ask your help with.'),
          task('I wrote my 3 interests and 3 strengths'),
        ] },
      ] },
      { title: 'Building your plan', summary: 'Turn the direction into a learning order.', topics: [
        { title: 'Pick one target role', blocks: [
          t('Choose **one** role to aim at for the next 3 months. You can change it later, but a single target keeps you moving.'),
          task('I picked one target role'),
          quiz('Why pick only one role first?', ['It looks neat', 'Focus makes progress faster', 'Employers require it'], 1, 'Focus beats scattering your effort.'),
        ] },
        { title: 'Skills in the right order', blocks: [
          t('List the skills your role needs, then sort them: **basics first**, tools second, projects third.'),
          activity('Write the 5 skills your target role needs and number them in the order you will learn them.'),
          task('I ordered my 5 skills'),
          link('Browse more guides', '/products'),
        ] },
      ] },
    ],
  },
  {
    title: 'Interview Preparation Kit (Free)', slug: 'interview-preparation-kit-free', category: 'interview', price: 0, isFeatured: true,
    tagline: 'Free resources to prepare for your first interviews.',
    description: 'Common questions, answering frameworks and a self-evaluation checklist to practise before real interviews.',
    audience: 'Anyone preparing for a first job or internship interview.',
    features: ['Common HR questions', 'A simple answer framework', 'Practice tasks you can tick off', 'Short self-test'],
    chapters: [
      { title: 'Before the interview', topics: [
        { title: 'Research the company', blocks: [
          t('Spend 20 minutes learning what the company does, who its customers are and why you want this role.'),
          task('I read the company website'),
          task('I wrote 2 questions to ask the interviewer'),
        ] },
      ] },
      { title: 'Answering questions', topics: [
        { title: 'The STAR framework', blocks: [
          t('Answer experience questions in four parts: **Situation**, **Task**, **Action**, **Result**. Keep each answer under two minutes.'),
          activity('Pick one school or project experience and write it in STAR form.'),
          quiz('In STAR, what does the last letter stand for?', ['Result', 'Review', 'Reason'], 0, 'R is for Result: what changed because of your action.'),
          task('I wrote one STAR answer'),
        ] },
        { title: 'Tell me about yourself', blocks: [
          t('Give a 3-part answer: who you are now, what you have done, and what you want next. Practise it out loud until it feels natural.'),
          task('I practised my introduction out loud'),
        ] },
      ] },
    ],
  },
  {
    title: 'Career Planning Workbook', slug: 'career-planning-workbook', category: 'planning', price: 99,
    tagline: 'Plan the next 12 months with clarity.',
    description: 'An interactive workbook to map your goals and turn them into a monthly action plan, with tasks you tick off as you go.',
    audience: 'Students who want a simple, realistic plan for the next 12 months.',
    features: ['Self-assessment exercises', '12-month action planner', 'Goal tracking with tick-able tasks'],
    chapters: [
      { title: 'Where you are now', topics: [
        { title: 'Self-assessment', blocks: [
          t('Be honest about where you stand today: your skills, your habits and your free time each week.'),
          activity('Write how many hours per week you can realistically give to learning.'),
          task('I know my weekly learning hours'),
        ] },
      ] },
      { title: 'Where you want to be', topics: [
        { title: 'Set a 12-month goal', blocks: [
          t('A good goal is **specific** and **measurable**. "Get better at coding" is vague; "Build and publish 3 small projects" is a goal.'),
          quiz('Which is the better goal?', ['Get better at coding', 'Publish 3 small projects', 'Be successful'], 1, 'Specific and measurable goals are easier to track.'),
          task('I wrote my 12-month goal'),
        ] },
        { title: 'Break it into months', blocks: [
          t('Divide your goal into 12 small milestones, one per month. Review them on the first day of every month.'),
          task('I wrote my first 3 monthly milestones'),
        ] },
      ] },
    ],
  },
];

(async () => {
  await connectDB();

  let admin = await User.findOne({ email: env.admin.email.toLowerCase() });
  if (!admin) {
    admin = await User.create({ name: env.admin.name, email: env.admin.email, phone: env.admin.phone, password: env.admin.password, role: 'admin' });
    console.log(`Admin created: ${admin.email}  (change the password after first login)`);
  } else console.log(`Admin exists: ${admin.email}`);

  for (const p of products) {
    const exists = await Product.findOne({ slug: p.slug }).select('+chapters');
    if (!exists) await Product.create({ ...p, deliveryType: 'ebook' });
    else if (!exists.chapters?.length && exists.deliveryType !== 'file') { // upgrade an old placeholder product to the e-book format
      exists.chapters = p.chapters; exists.deliveryType = 'ebook'; exists.audience = exists.audience || p.audience;
      await exists.save();
    }
  }
  console.log(`Products ready: ${await Product.countDocuments()}`);

  await Content.updateOne({ key: 'home' }, { $setOnInsert: { key: 'home', data: defaults } }, { upsert: true });
  console.log('Landing content ready');

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
