// scripts/seedDb.js — run with: npm run db:seed
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEMO_USERS = [
  { name:'Admin Superintendent', email:'admin@pattedaara.local', password:'Admin@1234', role:'superintendent',        unit:'Cyber Investigation Unit' },
  { name:'Sub-Inspector Ramesh K.', email:'ramesh.k@pattedaara.local', password:'Officer@1234', role:'investigating_officer', unit:'Cyber Investigation Unit' },
  { name:'Inspector Kavitha M.', email:'kavitha.m@pattedaara.local', password:'Officer@1234', role:'investigating_officer', unit:'Cyber Investigation Unit' },
  { name:'Analyst Deepa R.', email:'deepa.r@pattedaara.local', password:'Analyst@1234', role:'analyst', unit:'Cyber Investigation Unit' },
];

const DEMO_CASES = [
  {
    id:'pttdr-2026-0001', title:'UPI Fraud — Vijayawada Victim',
    fir:'FIR/VJW/2026/1142', classification:'UPI Fraud', sub_classification:'OTP Phishing',
    priority:'critical', status:'under-investigation', district:'Vijayawada',
    officer_name:'Sub-Inspector Ramesh K.',
    victim: JSON.stringify({ name:'Srinivasa Rao P.', age:52, gender:'Male', phone:'+91-9876543210', email:'srinivasa.rao@gmail.com', address:'Benz Circle, Vijayawada', occupation:'Retired Government Employee', lossAmount:485000, bank:'SBI Vijayawada Main Branch', attackChannel:'Phone Call + WhatsApp', incidentDate:'2026-02-28', complaintDate:'2026-03-01' }),
    suspect: JSON.stringify({ name:'Unknown', aliases:['KBC Lottery Agent'], phones:['+91-8800112233','+91-7700998877'], emails:['kbc.lottery.official@gmail.com'], bankAccounts:['HDFC-XXXX-8821'], location:'Suspected Jharkhand' }),
    notes:'Victim received a call claiming he won KBC lottery. Three UPI transactions before realising fraud.',
    tags: ['KBC Scam','OTP','UPI'],
  },
  {
    id:'pttdr-2026-0002', title:'Phishing — Fake Bank Portal Campaign',
    fir:'FIR/GTR/2026/0887', classification:'Phishing', sub_classification:'Bulk Phishing',
    priority:'high', status:'under-investigation', district:'Guntur',
    officer_name:'Inspector Kavitha M.',
    victim: JSON.stringify({ name:'Multiple Victims (14 reported)', lossAmount:1240000, bank:'Multiple Banks', attackChannel:'SMS + Fake Website', incidentDate:'2026-02-18', complaintDate:'2026-02-20' }),
    suspect: JSON.stringify({ name:'Unknown', emails:['support@securebank-portal.in'], location:'Unknown' }),
    notes:'Bulk SMS campaign with a cloned bank login portal.',
    tags: ['Bulk SMS','Fake Domain','Bank Fraud'],
  },
  {
    id:'pttdr-2026-0003', title:'Romance Scam — Army Officer Impersonation',
    fir:'FIR/VZG/2026/0334', classification:'Romance Scam', sub_classification:'Impersonation',
    priority:'medium', status:'new', district:'Visakhapatnam',
    officer_name:'Sub-Inspector Lakshmi D.',
    victim: JSON.stringify({ name:'Padmavathi S.', age:38, gender:'Female', phone:'+91-9988776655', email:'padmavathi.s@yahoo.com', address:'Dwaraka Nagar, Visakhapatnam', occupation:'School Teacher', lossAmount:320000, bank:'Axis Bank', attackChannel:'Facebook + WhatsApp', incidentDate:'2026-01-10', complaintDate:'2026-03-12' }),
    suspect: JSON.stringify({ name:'Unknown (Profile: Col. Robert Wilson)', aliases:['Col. Robert Wilson'], emails:['col.robertwilson.un@gmail.com'], location:'Unknown — possibly Nigeria' }),
    notes:'Suspect posed as US Army Colonel on Facebook. ₹3.2L transferred in 4 instalments.',
    tags: ['Romance Scam','Facebook','Army Impersonation'],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding Mr. Pattedaara database…\n');

    // Users
    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash(u.password, 12);
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, unit)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (email) DO UPDATE
          SET name=$1, role=$4, updated_at=NOW()
      `, [u.name, u.email, hash, u.role, u.unit]);
      console.log(`  ✓ ${u.role.padEnd(22)} ${u.email}  (password: ${u.password})`);
    }

    // Cases
    for (const c of DEMO_CASES) {
      await client.query(`
        INSERT INTO cases (id,title,fir,classification,sub_classification,priority,status,district,officer_name,victim,suspect,notes,tags,date_opened,last_updated)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_DATE,CURRENT_DATE)
        ON CONFLICT (id) DO NOTHING
      `, [c.id,c.title,c.fir,c.classification,c.sub_classification,c.priority,c.status,c.district,c.officer_name,c.victim,c.suspect,c.notes,c.tags]);
      console.log(`  ✓ Case ${c.id} — ${c.title}`);
    }

    console.log('\n✅ Seed complete.\n');
    console.log('  Default admin login:');
    console.log('  Email:    admin@pattedaara.local');
    console.log('  Password: Admin@1234\n');
    console.log('  ⚠️  Change all passwords before deploying to production.\n');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
