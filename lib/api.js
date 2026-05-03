// lib/api.js — Mr. Pattedaara Phase 2 API integrations

import { getSettings } from './store';

function keys() {
  const s = getSettings();
  return {
    virustotal: s.apiKeys?.virustotal || '',
    shodan:     s.apiKeys?.shodan     || '',
    hibp:       s.apiKeys?.hibp       || '',
  };
}

// ── VIRUSTOTAL ─────────────────────────────────────────────────────────────

export async function vtScanUrl(url) {
  const k = keys().virustotal;
  if (!k) return { error: 'VirusTotal API key not configured. Add it in Settings.' };
  try {
    // Submit URL for analysis
    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: { 'x-apikey': k, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`,
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) return { error: submitData.error?.message || 'VT submission failed' };

    const analysisId = submitData.data?.id;
    if (!analysisId) return { error: 'No analysis ID returned' };

    // Poll for result (max 3 tries)
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const res = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': k },
      });
      const data = await res.json();
      const status = data.data?.attributes?.status;
      if (status === 'completed') {
        const stats = data.data.attributes.stats;
        return {
          malicious:   stats.malicious   || 0,
          suspicious:  stats.suspicious  || 0,
          harmless:    stats.harmless    || 0,
          undetected:  stats.undetected  || 0,
          total:       Object.values(stats).reduce((a,b)=>a+b,0),
          threatScore: Math.round(((stats.malicious+stats.suspicious) / Math.max(Object.values(stats).reduce((a,b)=>a+b,0),1)) * 100),
          permalink:   `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}`,
        };
      }
    }
    return { error: 'Analysis timed out — check VirusTotal directly' };
  } catch (e) {
    return { error: e.message };
  }
}

export async function vtScanIp(ip) {
  const k = keys().virustotal;
  if (!k) return { error: 'VirusTotal API key not configured.' };
  try {
    const res  = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
      headers: { 'x-apikey': k },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error?.message || 'VT IP lookup failed' };
    const attrs = data.data?.attributes || {};
    return {
      country:     attrs.country || 'Unknown',
      asOwner:     attrs.as_owner || 'Unknown',
      asn:         attrs.asn,
      malicious:   attrs.last_analysis_stats?.malicious   || 0,
      suspicious:  attrs.last_analysis_stats?.suspicious  || 0,
      harmless:    attrs.last_analysis_stats?.harmless    || 0,
      reputation:  attrs.reputation || 0,
      threatScore: Math.min(100, Math.max(0, -(attrs.reputation || 0))),
    };
  } catch (e) {
    return { error: e.message };
  }
}

export async function vtScanDomain(domain) {
  const k = keys().virustotal;
  if (!k) return { error: 'VirusTotal API key not configured.' };
  try {
    const res  = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
      headers: { 'x-apikey': k },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error?.message || 'VT domain lookup failed' };
    const attrs = data.data?.attributes || {};
    return {
      creationDate: attrs.creation_date ? new Date(attrs.creation_date*1000).toLocaleDateString() : 'Unknown',
      registrar:    attrs.registrar || 'Unknown',
      reputation:   attrs.reputation || 0,
      malicious:    attrs.last_analysis_stats?.malicious  || 0,
      suspicious:   attrs.last_analysis_stats?.suspicious || 0,
      harmless:     attrs.last_analysis_stats?.harmless   || 0,
      categories:   attrs.categories ? Object.values(attrs.categories).join(', ') : '',
      threatScore:  Math.min(100, Math.max(0, -(attrs.reputation || 0) + (attrs.last_analysis_stats?.malicious||0)*5)),
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── HAVE I BEEN PWNED ──────────────────────────────────────────────────────

export async function hibpCheckEmail(email) {
  const k = keys().hibp;
  if (!k) return { error: 'HIBP API key not configured. Add it in Settings.' };
  try {
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: { 'hibp-api-key': k, 'User-Agent': 'MrPattedaara-Investigation' },
    });
    if (res.status === 404) return { breaches: [], count: 0, safe: true };
    if (!res.ok) {
      const t = await res.text();
      return { error: `HIBP error ${res.status}: ${t}` };
    }
    const breaches = await res.json();
    return {
      count:    breaches.length,
      safe:     false,
      breaches: breaches.map(b => ({
        name:         b.Name,
        domain:       b.Domain,
        date:         b.BreachDate,
        dataClasses:  b.DataClasses?.join(', '),
        pwnCount:     b.PwnCount?.toLocaleString(),
        description:  b.Description?.replace(/<[^>]+>/g,'').substring(0,200),
      })),
    };
  } catch (e) {
    return { error: e.message };
  }
}

export async function hibpCheckPassword(password) {
  // Uses k-anonymity — only first 5 chars of SHA-1 sent
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const prefix  = hashHex.slice(0,5);
    const suffix  = hashHex.slice(5);
    const res     = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text    = await res.text();
    const match   = text.split('\n').find(line => line.startsWith(suffix));
    const count   = match ? parseInt(match.split(':')[1]) : 0;
    return { count, compromised: count > 0 };
  } catch (e) {
    return { error: e.message };
  }
}

// ── SHODAN ─────────────────────────────────────────────────────────────────

export async function shodanLookupIp(ip) {
  const k = keys().shodan;
  if (!k) return { error: 'Shodan API key not configured. Add it in Settings.' };
  try {
    const res  = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${k}`);
    const data = await res.json();
    if (data.error) return { error: data.error };
    return {
      ip:           data.ip_str,
      org:          data.org || 'Unknown',
      isp:          data.isp || 'Unknown',
      country:      data.country_name || 'Unknown',
      city:         data.city || 'Unknown',
      os:           data.os || 'Unknown',
      openPorts:    data.ports || [],
      hostnames:    data.hostnames || [],
      tags:         data.tags || [],
      vulns:        data.vulns ? Object.keys(data.vulns) : [],
      lastUpdate:   data.last_update,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── WHOIS / RDAP ───────────────────────────────────────────────────────────

export async function whoisLookup(domain) {
  // Uses RDAP — public, no API key needed
  try {
    const clean = domain.replace(/^https?:\/\//,'').replace(/\/.*/,'').toLowerCase();
    const res   = await fetch(`https://rdap.org/domain/${clean}`);
    if (!res.ok) throw new Error(`RDAP returned ${res.status}`);
    const data  = await res.json();

    // Parse dates
    const getDate = (type) => {
      const ev = data.events?.find(e => e.eventAction === type);
      return ev ? new Date(ev.eventDate).toLocaleDateString('en-IN') : 'Unknown';
    };

    // Parse registrar
    const registrar = data.entities?.find(e => e.roles?.includes('registrar'));
    const registrarName = registrar?.vcardArray?.[1]?.find(v=>v[0]==='fn')?.[3] || 'Unknown';

    // Domain age in days
    const created = data.events?.find(e=>e.eventAction==='registration')?.eventDate;
    const ageDays = created ? Math.floor((Date.now()-new Date(created).getTime())/(1000*60*60*24)) : null;

    return {
      domain:     clean,
      registered: getDate('registration'),
      expires:    getDate('expiration'),
      updated:    getDate('last changed'),
      registrar:  registrarName,
      status:     data.status || [],
      ageDays,
      ageLabel:   ageDays != null ? (ageDays < 30 ? '⚠ Very new domain' : ageDays < 180 ? 'Recent domain' : 'Established domain') : 'Unknown',
      nameservers: data.nameservers?.map(n=>n.ldhName) || [],
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── COMBINED FORENSICS SCAN ────────────────────────────────────────────────

export async function fullScan(target, type) {
  const results = {};
  if (type === 'url' || type === 'domain') {
    const domain = target.replace(/^https?:\/\//,'').split('/')[0];
    const [vt, whois] = await Promise.all([
      vtScanUrl(target),
      whoisLookup(domain),
    ]);
    results.virustotal = vt;
    results.whois = whois;
  }
  if (type === 'ip') {
    const [vt, shodan] = await Promise.all([
      vtScanIp(target),
      shodanLookupIp(target),
    ]);
    results.virustotal = vt;
    results.shodan = shodan;
  }
  if (type === 'email') {
    results.hibp = await hibpCheckEmail(target);
  }
  return results;
}

// A centralized risk calculator for the platform
export function calculateRisk(vtStats, ageDays = null, reputation = 0) {
  const { malicious = 0, suspicious = 0, total = 70 } = vtStats;
  
  // 1. Detection Weight (capped at 80)
  const detectionWeight = ((malicious * 1.0 + suspicious * 0.35) / Math.max(total, 1)) * 80;
  
  // 2. Reputation Penalty
  const reputationPenalty = reputation < 0 ? Math.abs(reputation) * 0.2 : 0;
  
  // 3. Temporal (Age) Penalty
  let temporalPenalty = 0;
  if (ageDays !== null) {
    if (ageDays < 30) temporalPenalty = 15;
    else if (ageDays < 180) temporalPenalty = 5;
  }
  
  // Final Score (0-100)
  return Math.round(Math.min(100, detectionWeight + reputationPenalty + temporalPenalty));
}