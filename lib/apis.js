// lib/apis.js — External API wrappers for Mr. Pattedaara
// All keys come from LocalStorage settings. Graceful fallback when absent.

import { getSettings } from './store';

function keys() {
  const s = getSettings();
  return {
    virustotal: s.apiKeys?.virustotal || '',
    hibp:       s.apiKeys?.hibp || '',
    urlscan:    s.apiKeys?.urlscan || '',
    shodan:     s.apiKeys?.shodan || '',
  };
}

// ── VIRUSTOTAL ─────────────────────────────────────────────────────────────
export async function vtScanUrl(url) {
  const { virustotal } = keys();
  if (!virustotal) return { error: 'No VirusTotal API key configured. Add it in Settings.' };
  try {
    // Submit URL for analysis
    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: { 'x-apikey': virustotal, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`,
    });
    if (!submitRes.ok) throw new Error(`VT submit failed: ${submitRes.status}`);
    const submitData = await submitRes.json();
    const analysisId = submitData.data?.id;
    if (!analysisId) throw new Error('No analysis ID returned');

    // Get results
    await new Promise(r => setTimeout(r, 2000));
    const resultRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: { 'x-apikey': virustotal },
    });
    if (!resultRes.ok) throw new Error(`VT result failed: ${resultRes.status}`);
    const result = await resultRes.json();
    const stats  = result.data?.attributes?.stats || {};

    return {
      malicious:   stats.malicious   || 0,
      suspicious:  stats.suspicious  || 0,
      harmless:    stats.harmless    || 0,
      undetected:  stats.undetected  || 0,
      total:       (stats.malicious||0)+(stats.suspicious||0)+(stats.harmless||0)+(stats.undetected||0),
      score:       Math.round(((stats.malicious||0)+(stats.suspicious||0)) / Math.max(1,(stats.malicious||0)+(stats.suspicious||0)+(stats.harmless||0)+(stats.undetected||0)) * 100),
      permalink:   `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}`,
      raw: result,
    };
  } catch(e) {
    return { error: e.message };
  }
}

export async function vtScanDomain(domain) {
  const { virustotal } = keys();
  if (!virustotal) return { error: 'No VirusTotal API key configured.' };
  try {
    const res  = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`, {
      headers: { 'x-apikey': virustotal },
    });
    if (!res.ok) throw new Error(`VT domain failed: ${res.status}`);
    const data = await res.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    return {
      malicious:   stats.malicious   || 0,
      suspicious:  stats.suspicious  || 0,
      harmless:    stats.harmless    || 0,
      score:       Math.round(((stats.malicious||0)+(stats.suspicious||0)) / Math.max(1,(stats.malicious||0)+(stats.suspicious||0)+(stats.harmless||0)) * 100),
      categories:  data.data?.attributes?.categories || {},
      registrar:   data.data?.attributes?.registrar || 'Unknown',
      creationDate:data.data?.attributes?.creation_date,
      country:     data.data?.attributes?.country || 'Unknown',
    };
  } catch(e) {
    return { error: e.message };
  }
}

// ── URLSCAN ────────────────────────────────────────────────────────────────
export async function urlscanSubmit(url) {
  const { urlscan } = keys();
  if (!urlscan) return { error: 'No URLScan API key configured. Public scans may have limits.' };
  try {
    const res = await fetch('https://urlscan.io/api/v1/scan/', {
      method: 'POST',
      headers: { 'API-Key': urlscan, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, visibility: 'private' }),
    });
    if (!res.ok) throw new Error(`URLScan submit failed: ${res.status}`);
    const data = await res.json();
    return { uuid: data.uuid, result: data.result, api: data.api };
  } catch(e) {
    return { error: e.message };
  }
}

export async function urlscanResult(uuid) {
  try {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`https://urlscan.io/api/v1/result/${uuid}/`);
    if (!res.ok) throw new Error(`URLScan result failed: ${res.status}`);
    const data = await res.json();
    return {
      screenshot: data.screenshot,
      domain:     data.page?.domain,
      ip:         data.page?.ip,
      country:    data.page?.country,
      server:     data.page?.server,
      malicious:  data.verdicts?.overall?.malicious || false,
      score:      data.verdicts?.overall?.score || 0,
      tags:       data.verdicts?.overall?.tags || [],
    };
  } catch(e) {
    return { error: e.message };
  }
}

// ── HAVE I BEEN PWNED ──────────────────────────────────────────────────────
export async function hibpCheckEmail(email) {
  const { hibp } = keys();
  if (!hibp) return { error: 'No HIBP API key configured. Add it in Settings.' };
  try {
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: { 'hibp-api-key': hibp, 'User-Agent': 'MrPattedaara-Investigator' },
    });
    if (res.status === 404) return { breaches: [], count: 0, pwned: false };
    if (!res.ok) throw new Error(`HIBP failed: ${res.status}`);
    const data = await res.json();
    return {
      pwned:    true,
      count:    data.length,
      breaches: data.map(b => ({
        name:        b.Name,
        domain:      b.Domain,
        date:        b.BreachDate,
        count:       b.PwnCount,
        dataClasses: b.DataClasses,
        description: b.Description?.replace(/<[^>]*>/g,''),
      })),
    };
  } catch(e) {
    return { error: e.message };
  }
}

export async function hibpCheckPassword(password) {
  // k-Anonymity model — only sends first 5 chars of SHA1
  try {
    const enc  = new TextEncoder();
    const buf  = await crypto.subtle.digest('SHA-1', enc.encode(password));
    const hash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const prefix = hash.slice(0,5);
    const suffix = hash.slice(5);
    const res  = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error('HIBP password check failed');
    const text = await res.text();
    const line = text.split('\n').find(l => l.startsWith(suffix));
    const count = line ? parseInt(line.split(':')[1]) : 0;
    return { pwned: count > 0, count };
  } catch(e) {
    return { error: e.message };
  }
}

// ── SHODAN ─────────────────────────────────────────────────────────────────
export async function shodanLookupIp(ip) {
  const { shodan } = keys();
  if (!shodan) return { error: 'No Shodan API key configured.' };
  try {
    const res = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${shodan}`);
    if (!res.ok) throw new Error(`Shodan failed: ${res.status}`);
    const data = await res.json();
    return {
      ip:           data.ip_str,
      org:          data.org,
      isp:          data.isp,
      country:      data.country_name,
      city:         data.city,
      os:           data.os,
      ports:        data.ports || [],
      hostnames:    data.hostnames || [],
      tags:         data.tags || [],
      vulns:        data.vulns ? Object.keys(data.vulns) : [],
      lastUpdate:   data.last_update,
    };
  } catch(e) {
    return { error: e.message };
  }
}

// ── TEST CONNECTION ────────────────────────────────────────────────────────
export async function testApiKey(service) {
  try {
    switch(service) {
      case 'virustotal': {
        const { virustotal } = keys();
        if (!virustotal) return { ok: false, msg: 'No key set' };
        const r = await fetch('https://www.virustotal.com/api/v3/urls', {
          method:'POST', headers:{'x-apikey':virustotal,'Content-Type':'application/x-www-form-urlencoded'},
          body:'url=https://www.google.com'
        });
        return r.status === 200 || r.status === 400 ? { ok:true, msg:'Connected' } : { ok:false, msg:`HTTP ${r.status}` };
      }
      case 'hibp': {
        const { hibp } = keys();
        if (!hibp) return { ok: false, msg: 'No key set' };
        const r = await fetch('https://haveibeenpwned.com/api/v3/breachedaccount/test%40example.com', {
          headers: { 'hibp-api-key': hibp, 'User-Agent': 'MrPattedaara' }
        });
        return r.status === 404 || r.status === 200 ? { ok:true, msg:'Connected' } : { ok:false, msg:`HTTP ${r.status}` };
      }
      case 'urlscan':
        return { ok: true, msg: 'Key stored (will verify on first scan)' };
      case 'shodan': {
        const { shodan } = keys();
        if (!shodan) return { ok:false, msg:'No key set' };
        const r = await fetch(`https://api.shodan.io/api-info?key=${shodan}`);
        return r.ok ? { ok:true, msg:'Connected' } : { ok:false, msg:`HTTP ${r.status}` };
      }
      default:
        return { ok:false, msg:'Unknown service' };
    }
  } catch(e) {
    return { ok:false, msg: e.message };
  }
}
