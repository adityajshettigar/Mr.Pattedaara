// High-visibility, cyber-themed SVG icons for OSINT graph rendering
export const NODE_TYPES = [
  { type: 'person',       label: 'Person',       color: '#f59e0b' }, // Cyber Amber
  { type: 'email',        label: 'Email',        color: '#3b82f6' }, // Neon Blue
  { type: 'phone',        label: 'Phone',        color: '#10b981' }, // Matrix Green
  { type: 'ip',           label: 'IP Address',   color: '#8b5cf6' }, // Deep Purple
  { type: 'domain',       label: 'Domain / URL', color: '#06b6d4' }, // Cyan
  { type: 'bank',         label: 'Bank Account', color: '#eab308' }, // Gold
  { type: 'organisation', label: 'Organisation', color: '#6366f1' }, // Indigo
  { type: 'device',       label: 'Device',       color: '#94a3b8' }, // Slate
  { type: 'social',       label: 'Social Handle',color: '#ec4899' }, // Pink
];

export function getNodeColor(type) {
  const config = NODE_TYPES.find(n => n.type === type);
  return config ? config.color : '#94a3b8';
}

// 🟢 FIXED: Hardcoded 24x24 size forces Cytoscape to center the icon perfectly
function svgDataUri(svgPaths, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>`;
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function getNodeIcon(type, color) {
  switch (type) {
    case 'person': return svgDataUri('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>', color);
    case 'email': return svgDataUri('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>', color);
    case 'phone': return svgDataUri('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>', color);
    case 'ip': return svgDataUri('<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>', color);
    case 'domain': return svgDataUri('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>', color);
    case 'bank': return svgDataUri('<polygon points="12 2 2 7 22 7 12 2"></polygon><line x1="2" y1="22" x2="22" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line>', color);
    case 'organisation': return svgDataUri('<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>', color);
    case 'device': return svgDataUri('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>', color);
    case 'social': return svgDataUri('<circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>', color);
    default: return svgDataUri('<circle cx="12" cy="12" r="10"></circle>', color);
  }
}

export function buildCytoscapeStyles(theme = 'dark') {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e8eaf6' : '#1a1e35';
  const edgeColor = isDark ? '#3a4060' : '#adb5d0';
  const nodeBg    = isDark ? '#111420' : '#ffffff';
  
  return [
    {
      selector: 'node',
      style: {
        'background-color': nodeBg,
        'background-image': (ele) => {
           const color = getNodeColor(ele.data('type'));
           return getNodeIcon(ele.data('type'), color);
        },
        'background-fit': 'none', // Prevents stretching
        'background-width': '24px', 
        'background-height': '24px',
        // 🟢 FIXED: Mathematically locks the icon to the dead center
        'background-position-x': '50%',
        'background-position-y': '50%',
        
        'border-width': 2,
        'border-color': (ele) => getNodeColor(ele.data('type')),
        
        'label': 'data(label)',
        'color': textColor,
        'font-size': '11px',
        'font-family': "'IBM Plex Mono', monospace",
        'font-weight': '500',
        'text-valign': 'bottom',
        'text-margin-y': 8,
        
        // Cyber "Frosted Glass" Labels
        'text-background-opacity': 1,
        'text-background-color': isDark ? '#0b0d14' : '#f0f2f8',
        'text-background-padding': '4px',
        'text-border-opacity': 1,
        'text-border-width': 1,
        'text-border-color': isDark ? '#2a2f4a' : '#c8cde0',
        'text-background-shape': 'roundrectangle',
        
        'width': 48,
        'height': 48,
        
        // Dynamic Glowing Shadows
        'shadow-blur': 15,
        'shadow-color': (ele) => getNodeColor(ele.data('type')),
        'shadow-opacity': 0.25,
        
        'transition-property': 'width, height, shadow-opacity, shadow-blur, border-width',
        'transition-duration': '0.25s',
        'transition-timing-function': 'ease-out'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': edgeColor,
        'target-arrow-color': edgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'font-family': "'IBM Plex Mono', monospace",
        'color': textColor,
        'text-background-opacity': 1,
        'text-background-color': isDark ? '#111420' : '#ffffff',
        'text-background-padding': '3px',
        'text-border-opacity': 1,
        'text-border-width': 1,
        'text-border-color': edgeColor,
        'text-background-shape': 'roundrectangle',
        'text-rotation': 'autorotate'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'width': 58,  // Node pops out when clicked
        'height': 58,
        'border-width': 3,
        'shadow-blur': 30,
        'shadow-opacity': 0.8
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'width': 3,
        'line-color': '#f59e0b', // Cyber Amber Highlight
        'target-arrow-color': '#f59e0b',
        'text-border-color': '#f59e0b',
        'color': '#f59e0b'
      }
    },
    {
      selector: 'node:active',
      style: {
        'overlay-opacity': 0 // Removes ugly default grey tap box
      }
    }
  ];
}