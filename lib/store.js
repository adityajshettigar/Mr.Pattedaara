// lib/store.js — Mr. Pattedaara LocalStorage data layer v2

import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  CASES:'pttdr_cases', GRAPHS:'pttdr_graphs',
  TIMELINES:'pttdr_timelines', FORENSICS:'pttdr_forensics', SETTINGS:'pttdr_settings',
};

function load(key, fallback=[]) {
  if (typeof window==='undefined') return fallback;
  try { const r=localStorage.getItem(key); return r?JSON.parse(r):fallback; } catch { return fallback; }
}
function save(key,data) { if (typeof window==='undefined') return; localStorage.setItem(key,JSON.stringify(data)); }

const SEED_CASES = [
  { id:'pttdr-2026-0001', title:'UPI Fraud — Vijayawada Victim', fir:'FIR/VJW/2026/1142', classification:'UPI Fraud', subClassification:'OTP Phishing', priority:'critical', status:'under-investigation', dateOpened:'2026-03-01', lastUpdated:'2026-03-14', officer:'Sub-Inspector Ramesh K.', district:'Vijayawada',
    victim:{ name:'Srinivasa Rao P.', age:52, gender:'Male', phone:'+91-9876543210', email:'srinivasa.rao@gmail.com', address:'Benz Circle, Vijayawada', occupation:'Retired Government Employee', lossAmount:485000, bank:'SBI Vijayawada Main Branch', attackChannel:'Phone Call + WhatsApp', incidentDate:'2026-02-28', complaintDate:'2026-03-01' },
    suspect:{ name:'Unknown', aliases:['KBC Lottery Agent'], phones:['+91-8800112233','+91-7700998877'], emails:['kbc.lottery.official@gmail.com'], bankAccounts:['HDFC-XXXX-8821'], location:'Suspected Jharkhand' },
    notes:'Victim received a call claiming he won KBC lottery. Three UPI transactions before realising fraud.', evidence:[], tags:['KBC Scam','OTP','UPI'] },
  { id:'pttdr-2026-0002', title:'Phishing — Fake Bank Portal Campaign', fir:'FIR/GTR/2026/0887', classification:'Phishing', subClassification:'Bulk Phishing', priority:'high', status:'under-investigation', dateOpened:'2026-02-20', lastUpdated:'2026-03-10', officer:'Inspector Kavitha M.', district:'Guntur',
    victim:{ name:'Multiple Victims (14 reported)', age:null, gender:null, phone:'Multiple', email:'Multiple', address:'Guntur District', occupation:'Various', lossAmount:1240000, bank:'Multiple Banks', attackChannel:'SMS + Fake Website', incidentDate:'2026-02-18', complaintDate:'2026-02-20' },
    suspect:{ name:'Unknown', aliases:[], phones:[], emails:['support@securebank-portal.in'], bankAccounts:[], location:'Unknown' },
    notes:'Bulk SMS campaign with a cloned bank login portal. Domain registered 3 days before attack.', evidence:[], tags:['Bulk SMS','Fake Domain','Bank Fraud'] },
  { id:'pttdr-2026-0003', title:'Romance Scam — Army Officer Impersonation', fir:'FIR/VZG/2026/0334', classification:'Romance Scam', subClassification:'Impersonation', priority:'medium', status:'new', dateOpened:'2026-03-12', lastUpdated:'2026-03-12', officer:'Sub-Inspector Lakshmi D.', district:'Visakhapatnam',
    victim:{ name:'Padmavathi S.', age:38, gender:'Female', phone:'+91-9988776655', email:'padmavathi.s@yahoo.com', address:'Dwaraka Nagar, Visakhapatnam', occupation:'School Teacher', lossAmount:320000, bank:'Axis Bank', attackChannel:'Facebook + WhatsApp', incidentDate:'2026-01-10', complaintDate:'2026-03-12' },
    suspect:{ name:'Unknown (Profile: Col. Robert Wilson)', aliases:['Col. Robert Wilson','Dr. James Carter'], phones:[], emails:['col.robertwilson.un@gmail.com'], bankAccounts:[], location:'Unknown — possibly Nigeria' },
    notes:'Suspect posed as US Army Colonel on Facebook. Built relationship over 2 months. ₹3.2L transferred in 4 instalments.', evidence:[], tags:['Romance Scam','Facebook','Army Impersonation'] },
];

const SEED_GRAPHS = {
  'pttdr-2026-0001': {
    nodes:[
      {id:'n1',type:'person',label:'Srinivasa Rao P.',value:'Victim',confidence:'confirmed',notes:'Primary victim',x:300,y:250},
      {id:'n2',type:'phone', label:'+91-9876543210', value:'+919876543210',confidence:'confirmed',notes:'Victim phone',x:180,y:380},
      {id:'n3',type:'phone', label:'+91-8800112233', value:'+918800112233',confidence:'confirmed',notes:'Attacker primary',x:480,y:160},
      {id:'n4',type:'phone', label:'+91-7700998877', value:'+917700998877',confidence:'suspected',notes:'Attacker secondary',x:580,y:280},
      {id:'n5',type:'email', label:'kbc.lottery@gmail',value:'kbc.lottery.official@gmail.com',confidence:'confirmed',notes:'Sent fake certificate',x:420,y:380},
      {id:'n6',type:'bank',  label:'HDFC-XXXX-8821', value:'HDFC Account ending 8821',confidence:'confirmed',notes:'Received ₹4,85,000',x:300,y:460},
      {id:'n7',type:'person',label:'Unknown Suspect',value:'KBC Lottery Agent',confidence:'suspected',notes:'Suspected Jharkhand',x:500,y:90},
    ],
    edges:[
      {id:'e1',source:'n7',target:'n3',label:'uses',type:'owns'},
      {id:'e2',source:'n7',target:'n4',label:'uses',type:'owns'},
      {id:'e3',source:'n7',target:'n5',label:'controls',type:'owns'},
      {id:'e4',source:'n3',target:'n2',label:'called',type:'contacted'},
      {id:'e5',source:'n1',target:'n6',label:'transferred ₹4.85L',type:'transferred'},
      {id:'e6',source:'n5',target:'n1',label:'sent phishing email',type:'contacted'},
    ],
  },
  'pttdr-2026-0002':{nodes:[],edges:[]},
  'pttdr-2026-0003':{nodes:[],edges:[]},
};

const SEED_TIMELINES = {
  'pttdr-2026-0001':[
    {id:'t1',date:'2026-02-28',time:'10:15',event:'Initial phone call received',detail:'Victim receives call from +91-8800112233 claiming to be KBC lottery agent',type:'attack',mitreTag:'Phishing via Service'},
    {id:'t2',date:'2026-02-28',time:'11:30',event:'WhatsApp — fake certificate sent',detail:'Official-looking KBC winner certificate sent via WhatsApp',type:'attack',mitreTag:'Spearphishing Attachment'},
    {id:'t3',date:'2026-02-28',time:'14:00',event:'First UPI transaction',detail:'Victim transfers ₹1,50,000 as GST payment via PhonePe',type:'financial',mitreTag:''},
    {id:'t4',date:'2026-02-28',time:'16:45',event:'Second UPI transaction',detail:'₹1,85,000 transferred — told government processing fee required',type:'financial',mitreTag:''},
    {id:'t5',date:'2026-02-28',time:'18:20',event:'Third UPI transaction + suspicion',detail:'₹1,50,000 transferred. Victim suspects fraud and calls bank.',type:'financial',mitreTag:''},
    {id:'t6',date:'2026-03-01',time:'09:00',event:'Complaint filed',detail:'Victim files FIR/VJW/2026/1142. Total loss ₹4,85,000.',type:'investigation',mitreTag:''},
    {id:'t7',date:'2026-03-05',time:'11:00',event:'Bank account traced',detail:'Receiving account HDFC-XXXX-8821 traced to Dhanbad, Jharkhand.',type:'investigation',mitreTag:''},
  ],
};

export function initStore() {
  if (!localStorage.getItem(KEYS.CASES)) {
    save(KEYS.CASES,SEED_CASES); save(KEYS.GRAPHS,SEED_GRAPHS); save(KEYS.TIMELINES,SEED_TIMELINES);
  }
}

export const getCases  = ()     => load(KEYS.CASES,[]);
export const getCase   = (id)   => getCases().find(c=>c.id===id)||null;
export const saveCase  = (data) => {
  const cases=getCases(); const u={...data,lastUpdated:new Date().toISOString().split('T')[0]};
  const i=cases.findIndex(c=>c.id===u.id); if(i>=0) cases[i]=u; else cases.unshift(u);
  save(KEYS.CASES,cases); return u;
};
export const deleteCase = (id) => {
  save(KEYS.CASES,getCases().filter(c=>c.id!==id));
  ['GRAPHS','TIMELINES','FORENSICS'].forEach(k=>{ const o=load(KEYS[k],{}); delete o[id]; save(KEYS[k],o); });
};
export const newCaseId = () => {
  const y=new Date().getFullYear();
  const n=Math.max(0,...getCases().map(c=>parseInt(c.id.split('-')[2])||0))+1;
  return `pttdr-${y}-${String(n).padStart(4,'0')}`;
};

export const getGraph   = (id)    => load(KEYS.GRAPHS,{})[id]||{nodes:[],edges:[]};
export const saveGraph  = (id,g)  => { const a=load(KEYS.GRAPHS,{}); a[id]=g; save(KEYS.GRAPHS,a); };
export const addNode    = (id,n)  => { const g=getGraph(id); g.nodes.push({...n,id:n.id||uuidv4()}); saveGraph(id,g); return g; };
export const updateNode = (id,nid,u) => { const g=getGraph(id); g.nodes=g.nodes.map(n=>n.id===nid?{...n,...u}:n); saveGraph(id,g); return g; };
export const deleteNode = (id,nid)   => { const g=getGraph(id); g.nodes=g.nodes.filter(n=>n.id!==nid); g.edges=g.edges.filter(e=>e.source!==nid&&e.target!==nid); saveGraph(id,g); return g; };
export const addEdge    = (id,e)  => { const g=getGraph(id); g.edges.push({...e,id:e.id||uuidv4()}); saveGraph(id,g); return g; };
export const deleteEdge = (id,eid)=> { const g=getGraph(id); g.edges=g.edges.filter(e=>e.id!==eid); saveGraph(id,g); return g; };

export const getTimeline       = (id)    => load(KEYS.TIMELINES,{})[id]||[];
export const saveTimeline      = (id,arr)=> { const t=load(KEYS.TIMELINES,{}); t[id]=arr; save(KEYS.TIMELINES,t); };
export const addTimelineEntry  = (id,e)  => { const arr=[...getTimeline(id),{...e,id:e.id||uuidv4()}]; arr.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); saveTimeline(id,arr); return arr; };
export const deleteTimelineEntry = (id,eid) => { const arr=getTimeline(id).filter(e=>e.id!==eid); saveTimeline(id,arr); return arr; };

export const getForensics  = (id)      => load(KEYS.FORENSICS,{})[id]||[];
export const saveForensic  = (id,item) => { const a=load(KEYS.FORENSICS,{}); const arr=a[id]||[]; arr.unshift({...item,id:uuidv4(),timestamp:new Date().toISOString()}); a[id]=arr; save(KEYS.FORENSICS,a); };
export const deleteForensic= (id,fid)  => { const a=load(KEYS.FORENSICS,{}); a[id]=(a[id]||[]).filter(f=>f.id!==fid); save(KEYS.FORENSICS,a); };

export const getSettings  = ()  => load(KEYS.SETTINGS,{theme:'dark',officer:'Officer',unit:'Cyber Investigation Unit',apiKeys:{virustotal:'',shodan:'',hibp:''}});
export const saveSettings = (s) => save(KEYS.SETTINGS,s);
