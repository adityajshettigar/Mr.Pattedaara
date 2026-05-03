// lib/apiClient.js — browser-side fetch wrapper with JWT

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pttdr_token');
}
export function setToken(t)    { typeof window !== 'undefined' && localStorage.setItem('pttdr_token', t); }
export function clearToken()   { typeof window !== 'undefined' && localStorage.removeItem('pttdr_token') && localStorage.removeItem('pttdr_user'); }
export function getStoredUser(){ try { return JSON.parse(localStorage.getItem('pttdr_user')||'null'); } catch { return null; } }
export function setStoredUser(u){ localStorage.setItem('pttdr_user', JSON.stringify(u)); }

async function apiFetch(path, opts={}) {
  const token = getToken();
  const headers = { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}), ...(opts.headers||{}) };
  const res = await fetch(path, { ...opts, headers });
  
  // 🛑 REMOVED window.location.href FROM HERE
  if (res.status === 401) { 
    clearToken(); 
    return null; 
  }
  
  return res;
}

// Auth
export async function login(email, password) {
  const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||'Login failed');
  setToken(data.token); setStoredUser(data.user); return data.user;
}
export async function logout() { await fetch('/api/auth/logout',{method:'POST'}); clearToken(); }
export async function getMe()  { const res=await apiFetch('/api/auth/me'); if(!res?.ok) return null; const d=await res.json(); setStoredUser(d.user); return d.user; }

// Cases
export async function fetchCases(params={})  { const qs=new URLSearchParams(params).toString(); const res=await apiFetch(`/api/cases${qs?'?'+qs:''}`); if(!res?.ok) return []; return (await res.json()).cases||[]; }
export async function fetchCase(id)          { const res=await apiFetch(`/api/cases/${id}`); if(!res?.ok) return null; return (await res.json()).case||null; }
export async function createCase(body)       { const res=await apiFetch('/api/cases',{method:'POST',body:JSON.stringify(body)}); const d=await res.json(); if(!res.ok) throw new Error(d.error); return d.case; }
export async function updateCase(id,body)    { const res=await apiFetch(`/api/cases/${id}`,{method:'PATCH',body:JSON.stringify(body)}); const d=await res.json(); if(!res.ok) throw new Error(d.error); return d.case; }
export async function deleteCase(id)         { const res=await apiFetch(`/api/cases/${id}`,{method:'DELETE'}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }

// Graph
export async function fetchGraph(caseId)           { const res=await apiFetch(`/api/graph/${caseId}`); if(!res?.ok) return {nodes:[],edges:[]}; return (await res.json()).graph||{nodes:[],edges:[]}; }
export async function saveGraphItem(caseId,item)   { const res=await apiFetch(`/api/graph/${caseId}`,{method:'POST',body:JSON.stringify(item)}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }
export async function deleteGraphItem(caseId,{nodeId,edgeId}) { const qs=nodeId?`nodeId=${nodeId}`:`edgeId=${edgeId}`; const res=await apiFetch(`/api/graph/${caseId}?${qs}`,{method:'DELETE'}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }

// Timeline
export async function fetchTimeline(caseId)        { const res=await apiFetch(`/api/timeline/${caseId}`); if(!res?.ok) return []; return (await res.json()).entries||[]; }
export async function addTimelineEntry(caseId,e)   { const res=await apiFetch(`/api/timeline/${caseId}`,{method:'POST',body:JSON.stringify(e)}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }
export async function deleteTimelineEntry(caseId,eid){ const res=await apiFetch(`/api/timeline/${caseId}?entryId=${eid}`,{method:'DELETE'}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }

// Forensics
export async function fetchForensics(caseId)       { const res=await apiFetch(`/api/forensics/${caseId}`); if(!res?.ok) return []; return (await res.json()).forensics||[]; }
export async function saveForensicResult(caseId,item){ const res=await apiFetch(`/api/forensics/${caseId}`,{method:'POST',body:JSON.stringify(item)}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return await res.json(); }
export async function deleteForensicResult(caseId,fid){ const res=await apiFetch(`/api/forensics/${caseId}?forensicId=${fid}`,{method:'DELETE'}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }

// Users
export async function fetchUsers()     { const res=await apiFetch('/api/users'); if(!res?.ok) return []; return (await res.json()).users||[]; }
export async function createUser(body) { const res=await apiFetch('/api/users',{method:'POST',body:JSON.stringify(body)}); const d=await res.json(); if(!res.ok) throw new Error(d.error); return d.user; }
export async function updateUser(id,body){ const res=await apiFetch(`/api/users/${id}`,{method:'PATCH',body:JSON.stringify(body)}); const d=await res.json(); if(!res.ok) throw new Error(d.error); return d.user; }
export async function deactivateUser(id){ const res=await apiFetch(`/api/users/${id}`,{method:'DELETE'}); if(!res?.ok){const d=await res?.json();throw new Error(d?.error);} return true; }

// ... Keep all your existing functions exactly as they are ...

// --- ADD THIS AT THE BOTTOM OF lib/apiClient.js ---

export const authApi = {
  login,
  logout,
  me: getMe
};

export const casesApi = {
  list: fetchCases,
  get: fetchCase,
  create: createCase,
  update: updateCase,
  delete: deleteCase
};

export const usersApi = {
  list: fetchUsers,
  create: createUser,
  update: updateUser,
  delete: deactivateUser
};

// Also export these for the Graph and Forensics modules if they use the grouped pattern
export const forensicsApi = {
  list: fetchForensics,
  save: saveForensicResult,
  delete: deleteForensicResult
};

export const graphApi = {
  get: fetchGraph,
  save: saveGraphItem,
  delete: deleteGraphItem
};

// Add this to the bottom of your existing apiClient.js file

export const osintApi = {
  // Query VirusTotal for an IP address
  checkVirusTotal: async (ipAddress) => {
    try {
      const res = await fetch(`/api/osint/virustotal?ip=${ipAddress}`);
      if (!res.ok) throw new Error("VirusTotal scan failed");
      
      const data = await res.json();
      
      // Extract just the malicious vote count for easy use
      const stats = data.data.attributes.last_analysis_stats;
      return {
        maliciousCount: stats.malicious,
        suspiciousCount: stats.suspicious,
        harmlessCount: stats.harmless,
        networkOwner: data.data.attributes.as_owner
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  // Query Shodan for open ports and vulnerabilities
  checkShodan: async (ipAddress) => {
    try {
      const res = await fetch(`/api/osint/shodan?ip=${ipAddress}`);
      if (!res.ok) throw new Error("Shodan scan failed");
      
      const data = await res.json();
      
      return {
        openPorts: data.ports || [],
        os: data.os || 'Unknown',
        isp: data.isp,
        vulnerabilities: data.vulns || [] // Only available on higher Shodan tiers, but good to check
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
};