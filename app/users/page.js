'use client';
import { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deactivateUser, getStoredUser } from '../../lib/apiClient';
import { useRouter } from 'next/navigation';

const ROLES      = ['superintendent','investigating_officer','analyst','viewer'];
const ROLE_LABEL = { superintendent:'Superintendent', investigating_officer:'Investigating Officer', analyst:'Analyst', viewer:'Viewer' };
const ROLE_BADGE = { superintendent:'badge-amber', investigating_officer:'badge-blue', analyst:'badge-purple', viewer:'badge-gray' };

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user?.id;
  const [form,setForm] = useState(isEdit
    ? {name:user.name,email:user.email,role:user.role,unit:user.unit||'',password:''}
    : {name:'',email:'',role:'investigating_officer',unit:'Cyber Investigation Unit',password:''});
  const [loading,setLoading] = useState(false);
  const [err,setErr]         = useState('');
  const set = (f,v) => setForm(p=>({...p,[f]:v}));

  const handleSave = async () => {
    setErr(''); setLoading(true);
    try {
      const payload={...form};
      if(isEdit&&!payload.password) delete payload.password;
      const saved=isEdit?await updateUser(user.id,payload):await createUser(payload);
      onSave(saved);
    } catch(e){setErr(e.message);}
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{isEdit?'Edit Officer':'Add Officer'}<button className="modal-close" onClick={onClose}>×</button></div>
        <div className="form-group"><label className="form-label">Full Name</label><input value={form.name} onChange={e=>set('name',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} disabled={isEdit}/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Role</label>
            <select value={form.role} onChange={e=>set('role',e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Unit</label><input value={form.unit} onChange={e=>set('unit',e.target.value)}/></div>
        </div>
        <div className="form-group"><label className="form-label">{isEdit?'New Password (blank = keep current)':'Password'}</label>
          <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder={isEdit?'Leave blank to keep':'Min 8 chars'}/>
        </div>
        {err&&<div style={{color:'var(--red)',fontSize:13,marginBottom:12}}>⚠ {err}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading?'Saving…':isEdit?'Save Changes':'Create Officer'}</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users,setUsers]     = useState([]);
  const [modal,setModal]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const u=getStoredUser();
    if(!u||u.role!=='superintendent'){router.replace('/dashboard');return;}
    fetchUsers().then(u=>{setUsers(u);setLoading(false);});
  },[]);

  const handleSave = (saved) => {
    setUsers(prev=>{const i=prev.findIndex(u=>u.id===saved.id);if(i>=0){const n=[...prev];n[i]={...n[i],...saved};return n;}return[saved,...prev];});
    setModal(null);
  };

  const handleDeactivate = async (id) => {
    if(!confirm('Deactivate this officer?')) return;
    try{await deactivateUser(id);setUsers(prev=>prev.map(u=>u.id===id?{...u,is_active:false}:u));}catch(e){alert(e.message);}
  };

  if(loading) return <div className="content"><div className="empty"><div className="empty-icon">⟳</div><div className="empty-text">Loading…</div></div></div>;

  return (
    <div className="content animate-in">
      <div className="page-header">
        <div>
          <div className="page-title font-display">Officer Management</div>
          <div className="page-sub font-mono">{users.length} officers · Superintendent only</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setModal('add')}>+ Add Officer</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {users.map(u=>(
          <div key={u.id} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius2)',padding:'14px 18px',display:'flex',alignItems:'center',gap:14,opacity:u.is_active?1:0.55}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,flexShrink:0}}>{u.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:15,marginBottom:3}}>{u.name}</div>
              <div style={{fontSize:12,color:'var(--text3)',fontFamily:'var(--font-mono)',marginBottom:5}}>{u.email}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                <span className={`badge ${ROLE_BADGE[u.role]||'badge-gray'}`}>{ROLE_LABEL[u.role]||u.role}</span>
                {u.unit&&<span style={{fontSize:12,color:'var(--text3)'}}>{u.unit}</span>}
                {!u.is_active&&<span className="badge badge-red">Deactivated</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(u)}>Edit</button>
              {u.is_active&&<button className="btn btn-danger btn-sm" onClick={()=>handleDeactivate(u.id)}>Deactivate</button>}
            </div>
          </div>
        ))}
        {users.length===0&&<div className="empty"><div className="empty-icon">👥</div><div className="empty-text">No officers yet.</div></div>}
      </div>
      {(modal==='add'||modal?.id)&&<UserModal user={modal==='add'?null:modal} onClose={()=>setModal(null)} onSave={handleSave}/>}
    </div>
  );
}
