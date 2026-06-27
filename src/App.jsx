import { useState } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ADMIN = { email:"admin@skincarepro.ng", password:"Admin@2025" };

const PRODUCTS = [
  { id:1,  name:"Vitamin C Serum",       cat:"Skincare",  price:8500,  stock:20, emoji:"🧴" },
  { id:2,  name:"SPF 50 Sunscreen",      cat:"Skincare",  price:4800,  stock:30, emoji:"☀️" },
  { id:3,  name:"Glycolic Cleanser",     cat:"Skincare",  price:5500,  stock:18, emoji:"🫧" },
  { id:4,  name:"Niacinamide Serum",     cat:"Skincare",  price:4500,  stock:24, emoji:"✨" },
  { id:5,  name:"Retinol Night Cream",   cat:"Skincare",  price:9800,  stock:7,  emoji:"🌙" },
  { id:6,  name:"Advanced Courier Cream",cat:"Cosmetics", price:7500,  stock:15, emoji:"💆" },
  { id:7,  name:"Foundation SPF 15",     cat:"Cosmetics", price:8000,  stock:8,  emoji:"🎨" },
  { id:8,  name:"Lip Gloss Nude Pink",   cat:"Cosmetics", price:3500,  stock:12, emoji:"💄" },
  { id:9,  name:"Facial Treatment",      cat:"Services",  price:25000, stock:999,emoji:"💎" },
  { id:10, name:"Chemical Peel",         cat:"Services",  price:35000, stock:999,emoji:"💆" },
  { id:11, name:"Microneedling",         cat:"Services",  price:55000, stock:999,emoji:"🪡" },
  { id:12, name:"Dermaplaning",          cat:"Services",  price:28000, stock:999,emoji:"⚡" },
];

const INIT_BRANDS = [
  { id:1, name:"Four Sisters Aesthetic Spa", owner:"Amara Okonkwo",    email:"amara@foursisters.ng",  phone:"08012345678", address:"14 Awolowo Road, Ikoyi, Lagos",      status:"active",  date:"Jun 10 2025" },
  { id:2, name:"Glow Haven Beauty Studio",   owner:"Chidinma Eze",     email:"chidinma@glowhaven.ng", phone:"08098765432", address:"7 Allen Avenue, Ikeja, Lagos",        status:"pending", date:"Jun 22 2025" },
  { id:3, name:"Radiance Skin Clinic",       owner:"Fatima Abdullahi", email:"fatima@radiance.ng",    phone:"09011223344", address:"3 Maitama Close, Abuja",              status:"pending", date:"Jun 23 2025" },
  { id:4, name:"Lumina Aesthetics",          owner:"Blessing Osei",    email:"blessing@lumina.ng",    phone:"08155667788", address:"22 GRA Phase 2, Port Harcourt",       status:"active",  date:"Jun 5 2025"  },
  { id:5, name:"Pure Glow Spa",              owner:"Kemi Adeyemi",     email:"kemi@pureglow.ng",      phone:"07033445566", address:"9 Bodija Market Road, Ibadan",        status:"suspended",date:"May 28 2025"},
];

const CONSULTATIONS = [
  { id:1, client:"Ngozi Adeyemi",  date:"Jun 10 2025", therapist:"Sade Williams", skinType:"Combination", concerns:["Acne","Dark Spots"],     treatment:"Facial + Chemical Peel" },
  { id:2, client:"Fatima Bello",   date:"Jun 5 2025",  therapist:"Amara Okonkwo", skinType:"Dry",         concerns:["Fine Lines","Dull Skin"], treatment:"Microneedling" },
  { id:3, client:"Chisom Obi",     date:"May 28 2025", therapist:"Sade Williams", skinType:"Oily",         concerns:["Pores","Blackheads"],     treatment:"Dermaplaning" },
];

const APPOINTMENTS = [
  { id:1, client:"Ngozi Adeyemi",  service:"Facial Treatment",  time:"9:00 AM",  status:"confirmed", therapist:"Sade" },
  { id:2, client:"Chisom Obi",     service:"Chemical Peel",     time:"10:30 AM", status:"confirmed", therapist:"Amara" },
  { id:3, client:"Fatima Bello",   service:"Microneedling",     time:"12:00 PM", status:"pending",   therapist:"Sade" },
  { id:4, client:"Adaeze Nwosu",   service:"Dermaplaning",      time:"2:00 PM",  status:"confirmed", therapist:"Amara" },
  { id:5, client:"Blessing Okoro", service:"Skincare Consult",  time:"3:30 PM",  status:"pending",   therapist:"Sade" },
];

const EXPENSES = [
  { id:1, cat:"Rent",      desc:"Monthly rent",             amount:200000, date:"Jun 1" },
  { id:2, cat:"Salary",    desc:"Staff salaries",           amount:150000, date:"Jun 1" },
  { id:3, cat:"Utilities", desc:"Electricity bill",         amount:22000,  date:"Jun 10" },
  { id:4, cat:"Supplies",  desc:"Skincare product restock", amount:85000,  date:"Jun 15" },
];

const DEBTS = [
  { id:1, dir:"owes_us", party:"Ngozi Adeyemi",       amount:15000, due:"Jun 30", status:"overdue", desc:"Balance from May treatment" },
  { id:2, dir:"owes_us", party:"Blessing Okoro",      amount:8500,  due:"Jul 5",  status:"pending", desc:"Partial payment — Facial" },
  { id:3, dir:"we_owe",  party:"GlowSkin Distributors",amount:45000,due:"Jul 15", status:"pending", desc:"Product supply credit" },
];

const CLIENTS = [
  { id:1, name:"Ngozi Adeyemi",  skin:"Combination", visits:6,  last:"Today",       spend:45000 },
  { id:2, name:"Chisom Obi",     skin:"Oily",        visits:3,  last:"2 days ago",  spend:28500 },
  { id:3, name:"Fatima Bello",   skin:"Dry",         visits:11, last:"1 week ago",  spend:120000 },
  { id:4, name:"Adaeze Nwosu",   skin:"Normal",      visits:2,  last:"2 weeks ago", spend:18000 },
];

const STAFF = [
  { id:1, name:"Sade Williams", role:"Therapist",    email:"sade@foursisters.ng", status:"active" },
  { id:2, name:"Kemi Fashola",  role:"Receptionist", email:"kemi@foursisters.ng", status:"active" },
];

const fmt = n => "₦"+Number(n||0).toLocaleString();
const nowStr = () => new Date().toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"});

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const GOLD = "linear-gradient(135deg,#c9a84c,#e8c96d)";
const DARK = "linear-gradient(135deg,#1a0a2e,#2d1b4e)";

function Pill({ label, type="gray" }) {
  const map = {
    gray:    { bg:"#f3f4f6", color:"#666" },
    green:   { bg:"#f0fdf4", color:"#059669" },
    amber:   { bg:"#fffbeb", color:"#d97706" },
    red:     { bg:"#fef2f2", color:"#dc2626" },
    blue:    { bg:"#eff6ff", color:"#2563eb" },
    purple:  { bg:"#f5f3ff", color:"#7c3aed" },
    gold:    { bg:"#fff8e7", color:"#b45309" },
  };
  const s = map[type]||map.gray;
  return <span style={{padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:"700",background:s.bg,color:s.color}}>{label}</span>;
}

function Card({ children, style={} }) {
  return <div style={{background:"white",borderRadius:"16px",border:"1px solid #f0f0f0",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",...style}}>{children}</div>;
}

function StatCard({ icon, label, value, sub, alert }) {
  return (
    <Card style={{padding:"18px",border:alert?"1px solid #fcd34d":"1px solid #f0f0f0"}}>
      <div style={{fontSize:"24px",marginBottom:"8px"}}>{icon}</div>
      <div style={{fontSize:"22px",fontWeight:"900",color:"#111"}}>{value}</div>
      <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{label}</div>
      {sub&&<div style={{fontSize:"11px",color:"#bbb",marginTop:"2px"}}>{sub}</div>}
    </Card>
  );
}

function GoldBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"10px 20px",borderRadius:"12px",border:"none",background:GOLD,color:"#1a0a2e",fontWeight:"800",fontSize:"13px",cursor:"pointer",...style}}>{children}</button>;
}
function DarkBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"10px 20px",borderRadius:"12px",border:"none",background:DARK,color:"white",fontWeight:"700",fontSize:"13px",cursor:"pointer",...style}}>{children}</button>;
}
function GhostBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"8px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:"#555",fontWeight:"600",fontSize:"12px",cursor:"pointer",...style}}>{children}</button>;
}

function SectionHead({ title, sub, btn, onBtn }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"20px"}}>
      <div><div style={{fontSize:"20px",fontWeight:"900",color:"#111"}}>{title}</div>{sub&&<div style={{fontSize:"13px",color:"#888",marginTop:"3px"}}>{sub}</div>}</div>
      {btn&&<GoldBtn onClick={onBtn}>{btn}</GoldBtn>}
    </div>
  );
}

function Table({ cols, rows }) {
  return (
    <Card>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>
              {cols.map(c=><th key={c} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </Card>
  );
}

function TR({ children, highlight }) {
  return <tr style={{borderBottom:"1px solid #f9f9f9",background:highlight||"white"}}>{children}</tr>;
}
function TD({ children, style={} }) {
  return <td style={{padding:"12px 16px",fontSize:"13px",color:"#333",...style}}>{children}</td>;
}

function Avatar({ name, size=32, gradient=GOLD }) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:gradient,color:"#1a0a2e",fontWeight:"900",fontSize:size*0.35,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{name[0]}</div>;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:9999,padding:"12px 20px",borderRadius:"14px",background:"linear-gradient(135deg,#059669,#10b981)",color:"white",fontWeight:"700",fontSize:"13px",boxShadow:"0 4px 16px rgba(5,150,105,0.4)"}}>{msg}</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — ADMIN LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [show,setShow]=useState(false);

  const login = () => {
    setLoading(true); setErr("");
    setTimeout(()=>{
      if(email===ADMIN.email&&pass===ADMIN.password) onLogin();
      else setErr("Incorrect email or password.");
      setLoading(false);
    },700);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1a0a2e,#2d1b4e)",fontFamily:"system-ui,sans-serif",padding:"16px"}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{width:"60px",height:"60px",borderRadius:"18px",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 12px"}}>💎</div>
          <div style={{fontSize:"28px",fontWeight:"900",color:"white"}}>SkinCare Pro</div>
          <div style={{fontSize:"13px",color:"#c9a84c",marginTop:"4px"}}>Super Admin Portal</div>
        </div>
        <Card style={{padding:"32px"}}>
          <div style={{fontSize:"18px",fontWeight:"800",color:"#111",marginBottom:"4px"}}>Welcome back</div>
          <div style={{fontSize:"13px",color:"#aaa",marginBottom:"24px"}}>Sign in to manage the platform</div>
          {err&&<div style={{padding:"10px 14px",borderRadius:"10px",background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:"13px",marginBottom:"16px"}}>⚠ {err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div>
              <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>Email Address</div>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@skincarepro.ng" type="email"
                onKeyDown={e=>e.key==="Enter"&&login()}
                style={{width:"100%",padding:"11px 14px",borderRadius:"12px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div>
              <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>Password</div>
              <div style={{position:"relative"}}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type={show?"text":"password"} placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{width:"100%",padding:"11px 44px 11px 14px",borderRadius:"12px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box"}} />
                <button onClick={()=>setShow(!show)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#aaa"}}>{show?"Hide":"Show"}</button>
              </div>
            </div>
            <button onClick={login} disabled={loading||!email||!pass}
              style={{padding:"13px",borderRadius:"12px",border:"none",background:GOLD,color:"#1a0a2e",fontWeight:"900",fontSize:"14px",cursor:"pointer",opacity:loading||!email||!pass?0.6:1,marginTop:"4px"}}>
              {loading?"Signing in…":"Sign In"}
            </button>
            <button onClick={()=>{setEmail(ADMIN.email);setPass(ADMIN.password);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#c9a84c",textDecoration:"underline"}}>
              Auto-fill demo credentials
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ onLogout, onGoToBrand }) {
  const [brands,setBrands]=useState(INIT_BRANDS);
  const [tab,setTab]=useState("brands");
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState("");

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const updateStatus = (id,status,msg) => { setBrands(b=>b.map(x=>x.id===id?{...x,status}:x)); showToast(msg); };

  const pending = brands.filter(b=>b.status==="pending");
  const active  = brands.filter(b=>b.status==="active");

  const statusPill = s => {
    if(s==="active")    return <Pill label="Active"    type="green"/>;
    if(s==="pending")   return <Pill label="Pending"   type="amber"/>;
    if(s==="suspended") return <Pill label="Suspended" type="red"/>;
    return <Pill label={s}/>;
  };

  const navItems=[["brands","🏪","Brands"],["analytics","📊","Analytics"],["settings","⚙️","Settings"]];

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,sans-serif"}}>
      {/* Sidebar */}
      <div style={{width:"220px",flexShrink:0,background:DARK.replace("linear-gradient(135deg,","").slice(0,-1).split(",")[0],display:"flex",flexDirection:"column",backgroundImage:DARK}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>💎</div>
            <div><div style={{color:"white",fontWeight:"800",fontSize:"14px"}}>SkinCare Pro</div><div style={{color:"#c9a84c",fontSize:"11px"}}>Super Admin</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 10px"}}>
          {navItems.map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"13px",marginBottom:"2px",textAlign:"left",background:tab===id?"rgba(201,168,76,0.15)":"transparent",color:tab===id?"#c9a84c":"rgba(255,255,255,0.6)",transition:"all 0.15s"}}>
              <span>{icon}</span>{label}
            </button>
          ))}
          <div style={{margin:"12px 0",borderTop:"1px solid rgba(255,255,255,0.08)"}} />
          <button onClick={onGoToBrand}
            style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"13px",textAlign:"left",background:"rgba(201,168,76,0.08)",color:"#c9a84c"}}>
            <span>🏪</span>Demo Brand Dashboard
          </button>
        </nav>
        {pending.length>0&&<div style={{margin:"0 10px 10px",padding:"10px 12px",borderRadius:"10px",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:"#c9a84c"}}>🔔 {pending.length} awaiting approval</div>
        </div>}
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)",marginBottom:"8px"}}>admin@skincarepro.ng</div>
          <button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>→ Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:"#f9fafb",overflowY:"auto"}}>
        <div style={{padding:"28px 32px"}}>
          {tab==="brands"&&<>
            <SectionHead title="Brand Management" sub="Approve and manage all registered skincare brands" />
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"24px"}}>
              <StatCard icon="🏪" label="Total Brands"   value={brands.length}  sub="All registered"/>
              <StatCard icon="⏳" label="Pending"        value={pending.length} sub="Need approval" alert={pending.length>0}/>
              <StatCard icon="✅" label="Active"         value={active.length}  sub="Subscribed"/>
              <StatCard icon="💰" label="Monthly Revenue" value={fmt(active.length*1000)} sub="₦1,000 per brand"/>
            </div>
            <Table
              cols={["Brand","Owner","Phone","Registered","Status","Actions"]}
              rows={brands.map(b=>(
                <TR key={b.id}>
                  <TD><div style={{display:"flex",alignItems:"center",gap:"10px"}}><Avatar name={b.name} size={34}/><span style={{fontWeight:"700"}}>{b.name}</span></div></TD>
                  <TD style={{color:"#666"}}>{b.owner}</TD>
                  <TD style={{color:"#888"}}>{b.phone}</TD>
                  <TD style={{color:"#aaa",fontSize:"12px"}}>{b.date}</TD>
                  <TD>{statusPill(b.status)}</TD>
                  <TD>
                    <div style={{display:"flex",gap:"6px"}}>
                      <GhostBtn onClick={()=>setSelected(b)}>View</GhostBtn>
                      {b.status==="pending"&&<button onClick={()=>updateStatus(b.id,"active",`✓ ${b.name} approved!`)} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Approve</button>}
                      {b.status==="active"&&<button onClick={()=>updateStatus(b.id,"suspended",`${b.name} suspended.`)} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Suspend</button>}
                      {b.status==="suspended"&&<button onClick={()=>updateStatus(b.id,"active",`${b.name} reactivated!`)} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Reactivate</button>}
                    </div>
                  </TD>
                </TR>
              ))}
            />
          </>}

          {tab==="analytics"&&<>
            <SectionHead title="Platform Analytics" sub="Overview of your SkinCare Pro platform"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
              <Card style={{padding:"24px"}}>
                <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"16px"}}>Revenue (6 months)</div>
                {["Jan","Feb","Mar","Apr","May","Jun"].map((m,i)=>{
                  const vals=[2000,3000,3000,4000,4000,active.length*1000];
                  const pct=(vals[i]/5000)*100;
                  return <div key={m} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                    <span style={{width:"28px",fontSize:"12px",color:"#aaa"}}>{m}</span>
                    <div style={{flex:1,height:"8px",background:"#f0f0f0",borderRadius:"4px",overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:GOLD,borderRadius:"4px"}}/>
                    </div>
                    <span style={{fontSize:"12px",color:"#555",width:"60px",textAlign:"right"}}>₦{(vals[i]/1000).toFixed(0)}k</span>
                  </div>;
                })}
              </Card>
              <Card style={{padding:"24px"}}>
                <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"16px"}}>Brand Breakdown</div>
                {[["Active",active.length,"#059669"],["Pending",pending.length,"#d97706"],["Suspended",brands.filter(b=>b.status==="suspended").length,"#dc2626"]].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px",borderRadius:"10px",background:"#fafafa",marginBottom:"8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"10px",height:"10px",borderRadius:"50%",background:c}}/><span style={{fontSize:"13px",color:"#555"}}>{l}</span></div>
                    <span style={{fontSize:"20px",fontWeight:"900",color:"#111"}}>{v}</span>
                  </div>
                ))}
              </Card>
            </div>
          </>}

          {tab==="settings"&&<>
            <SectionHead title="Admin Settings"/>
            <Card style={{padding:"28px",maxWidth:"480px"}}>
              {[["Platform Name","SkinCare Pro"],["Subscription Price","₦1,000 / month"],["Admin Email","admin@skincarepro.ng"]].map(([l,v])=>(
                <div key={l} style={{marginBottom:"16px"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{l}</div>
                  <input defaultValue={v} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              <DarkBtn style={{width:"100%",padding:"12px"}}>Save Changes</DarkBtn>
            </Card>
          </>}
        </div>
      </div>

      {/* Brand detail modal */}
      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <Card style={{width:"100%",maxWidth:"460px",overflow:"hidden"}}>
            <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}><Avatar name={selected.name} size={40}/><div><div style={{fontWeight:"800"}}>{selected.name}</div>{statusPill(selected.status)}</div></div>
              <button onClick={()=>setSelected(null)} style={{width:"30px",height:"30px",borderRadius:"50%",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"18px"}}>×</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              {[["Owner",selected.owner],["Email",selected.email],["Phone",selected.phone],["Address",selected.address],["Registered",selected.date]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f9f9f9",fontSize:"13px"}}>
                  <span style={{color:"#888",fontWeight:"600"}}>{l}</span><span style={{color:"#111"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"16px 24px",display:"flex",gap:"10px"}}>
              {selected.status==="pending"&&<>
                <button onClick={()=>{updateStatus(selected.id,"active",`✓ ${selected.name} approved!`);setSelected(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#059669",color:"white",fontWeight:"700",cursor:"pointer"}}>✓ Approve</button>
                <button onClick={()=>{updateStatus(selected.id,"rejected","Brand rejected.");setSelected(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",cursor:"pointer"}}>✕ Reject</button>
              </>}
              {selected.status==="active"&&<button onClick={()=>{updateStatus(selected.id,"suspended","Brand suspended.");setSelected(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#fffbeb",color:"#d97706",fontWeight:"700",cursor:"pointer"}}>⏸ Suspend</button>}
              {selected.status==="suspended"&&<button onClick={()=>{updateStatus(selected.id,"active","Brand reactivated!");setSelected(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#059669",color:"white",fontWeight:"700",cursor:"pointer"}}>▶ Reactivate</button>}
            </div>
          </Card>
        </div>
      )}
      <Toast msg={toast}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — BRAND REGISTRATION
// ══════════════════════════════════════════════════════════════════════════════
const NIG_STATES=["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const SERVICES_LIST=["Facial Treatments","Chemical Peels","Microneedling","Dermaplaning","Microdermabrasion","Laser Treatment","Acne Extraction","Body Treatments","Waxing","Eyebrow Shaping","Eyelash Extensions","Makeup","Massage Therapy","Skincare Consultation","Product Sales"];

function BrandRegistration({ onBack, onSubmit }) {
  const [step,setStep]=useState(1);
  const [done,setDone]=useState(false);
  const [data,setData]=useState({});
  const STEPS=["Brand Info","Owner Info","Account","Review"];

  const inp=(label,key,type="text",ph="",required=false)=>(
    <div>
      <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{label}{required&&<span style={{color:"#ef4444"}}> *</span>}</div>
      <input type={type} value={data[key]||""} onChange={e=>setData({...data,[key]:e.target.value})} placeholder={ph}
        style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  const sel=(label,key,options,ph="")=>(
    <div>
      <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{label}</div>
      <select value={data[key]||""} onChange={e=>setData({...data,[key]:e.target.value})}
        style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",background:"white",boxSizing:"border-box"}}>
        <option value="">{ph||"Select..."}</option>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );

  const canNext=()=>{
    if(step===1) return data.brandName&&data.businessType&&data.state&&data.address&&data.phone&&data.businessEmail;
    if(step===2) return data.firstName&&data.lastName&&data.ownerEmail&&data.ownerPhone;
    if(step===3) return data.password&&data.password===data.confirmPassword&&data.password.length>=6&&data.agreedTerms;
    return true;
  };

  if(done) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9fafb",fontFamily:"system-ui,sans-serif",padding:"16px"}}>
      <Card style={{maxWidth:"460px",width:"100%",padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:"64px",marginBottom:"16px"}}>⏳</div>
        <div style={{fontSize:"22px",fontWeight:"900",color:"#111",marginBottom:"8px"}}>Registration Submitted!</div>
        <div style={{fontSize:"14px",color:"#888",lineHeight:"1.7",marginBottom:"24px"}}>
          Thank you <strong>{data.firstName}</strong>! Your brand <strong>{data.brandName}</strong> has been submitted.<br/>
          Our admin will review and approve within 24 hours.
        </div>
        <div style={{background:"#fffbeb",borderRadius:"12px",padding:"16px",marginBottom:"24px",textAlign:"left"}}>
          {[["Registration submitted","✅"],["Admin review in progress","⏳"],["Approval email sent","⬜"],["Your dashboard unlocked","⬜"]].map(([l,i])=>(
            <div key={l} style={{display:"flex",gap:"10px",marginBottom:"8px",fontSize:"13px",color:i==="✅"?"#059669":i==="⏳"?"#d97706":"#bbb"}}>
              <span>{i}</span><span>{l}</span>
            </div>
          ))}
        </div>
        <DarkBtn onClick={onBack} style={{width:"100%",padding:"13px"}}>Back to Login</DarkBtn>
      </Card>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",fontFamily:"system-ui,sans-serif"}}>
      {/* Left panel */}
      <div style={{width:"280px",flexShrink:0,backgroundImage:DARK,display:"flex",flexDirection:"column",padding:"32px 24px"}}>
        <div style={{marginBottom:"32px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"24px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>💎</div>
            <div style={{color:"white",fontWeight:"800"}}>SkinCare Pro</div>
          </div>
          <div style={{fontSize:"20px",fontWeight:"800",color:"white",marginBottom:"8px"}}>Grow your brand with powerful tools</div>
          <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",lineHeight:"1.7"}}>Complete business management for skincare brands in Nigeria</div>
        </div>
        {[["💆","Consultations","Digital forms & records"],["📦","Inventory + POS","Stock & fast sales"],["📅","Appointments","Online booking"],["💰","Finance","Expenses, debts & reports"],["⭐","Reviews & CRM","Clients & reputation"]].map(([i,t,s])=>(
          <div key={t} style={{display:"flex",gap:"10px",marginBottom:"14px"}}>
            <div style={{width:"34px",height:"34px",borderRadius:"10px",background:"rgba(201,168,76,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i}</div>
            <div><div style={{color:"white",fontSize:"13px",fontWeight:"600"}}>{t}</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:"11px"}}>{s}</div></div>
          </div>
        ))}
        <div style={{marginTop:"auto",padding:"14px",borderRadius:"12px",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)"}}>
          <div style={{fontSize:"14px",fontWeight:"800",color:"#c9a84c"}}>₦1,000 / month</div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",marginTop:"4px"}}>Full access · Cancel anytime</div>
        </div>
      </div>

      {/* Right - form */}
      <div style={{flex:1,overflowY:"auto",padding:"32px",background:"#f9fafb"}}>
        <div style={{maxWidth:"520px",margin:"0 auto"}}>
          {/* Progress */}
          <div style={{marginBottom:"28px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <span style={{fontSize:"12px",color:"#888"}}>Step {step} of {STEPS.length}</span>
              <span style={{fontSize:"12px",fontWeight:"700",color:"#c9a84c"}}>{Math.round((step/STEPS.length)*100)}%</span>
            </div>
            <div style={{height:"6px",background:"#e5e7eb",borderRadius:"3px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(step/STEPS.length)*100}%`,background:GOLD,borderRadius:"3px",transition:"width 0.4s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
              {STEPS.map((s,i)=><span key={s} style={{fontSize:"11px",fontWeight:step===i+1?"700":"400",color:step===i+1?"#c9a84c":"#bbb"}}>{s}</span>)}
            </div>
          </div>

          <Card style={{padding:"28px",marginBottom:"16px"}}>
            {step===1&&<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{fontSize:"18px",fontWeight:"800",color:"#111"}}>Tell us about your brand</div>
              {inp("Brand / Business Name","brandName","text","e.g. Four Sisters Aesthetic Spa",true)}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                {sel("Business Type","businessType",["Aesthetic Spa","Skincare Clinic","Beauty Studio","Home-based Studio","Other"],"Select type")}
                {sel("State","state",NIG_STATES,"Select state")}
              </div>
              {inp("Full Business Address","address","text","Street, area, city",true)}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                {inp("Business Phone","phone","text","e.g. 08012345678",true)}
                {inp("Business Email","businessEmail","email","info@yourbrand.ng",true)}
              </div>
              {inp("Instagram Handle (optional)","instagram","text","@yourbrand")}
              <div>
                <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Services Offered</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {SERVICES_LIST.map(s=>{
                    const sel=(data.services||[]).includes(s);
                    return <button key={s} onClick={()=>setData({...data,services:sel?(data.services||[]).filter(x=>x!==s):[...(data.services||[]),s]})}
                      style={{padding:"6px 12px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"600",background:sel?GOLD:"#f3f4f6",color:sel?"#1a0a2e":"#666"}}>{s}</button>;
                  })}
                </div>
              </div>
            </div>}

            {step===2&&<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{fontSize:"18px",fontWeight:"800",color:"#111"}}>Owner Information</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                {inp("First Name","firstName","text","e.g. Amara",true)}
                {inp("Last Name","lastName","text","e.g. Okonkwo",true)}
              </div>
              {inp("Personal Email","ownerEmail","email","amara@gmail.com",true)}
              {inp("Personal Phone","ownerPhone","text","e.g. 08099887766",true)}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                {sel("Years in Business","yearsInBusiness",["Less than 1 year","1–2 years","3–5 years","More than 5 years"])}
                {sel("Number of Staff","staffCount",["Just me (solo)","2–5 staff","6–10 staff","More than 10"])}
              </div>
              {sel("How did you hear about us?","referral",["Instagram","Facebook","WhatsApp","Friend/Colleague","Google Search","Other"])}
            </div>}

            {step===3&&<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{fontSize:"18px",fontWeight:"800",color:"#111"}}>Create Your Account</div>
              <div style={{padding:"12px",borderRadius:"10px",background:"#fafafa",border:"1px solid #f0f0f0"}}>
                <div style={{fontSize:"11px",color:"#888"}}>Login email</div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"#111",marginTop:"2px"}}>{data.ownerEmail||"—"}</div>
              </div>
              {inp("Password","password","password","Create a strong password",true)}
              {inp("Confirm Password","confirmPassword","password","Repeat password",true)}
              {data.password&&data.confirmPassword&&(
                <div style={{fontSize:"12px",fontWeight:"700",color:data.password===data.confirmPassword?"#059669":"#ef4444"}}>
                  {data.password===data.confirmPassword?"✓ Passwords match":"✕ Passwords do not match"}
                </div>
              )}
              <div style={{padding:"14px",borderRadius:"12px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:"800",color:"#111"}}>SkinCare Pro Full Access</div><div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>All modules · Unlimited clients</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:"22px",fontWeight:"900",color:"#c9a84c"}}>₦1,000</div><div style={{fontSize:"11px",color:"#bbb"}}>per month</div></div>
              </div>
              <label style={{display:"flex",gap:"10px",cursor:"pointer"}}>
                <input type="checkbox" checked={data.agreedTerms||false} onChange={e=>setData({...data,agreedTerms:e.target.checked})} style={{marginTop:"2px"}}/>
                <span style={{fontSize:"12px",color:"#555",lineHeight:"1.6"}}>I agree to the Terms of Service and Privacy Policy. I understand my account needs admin approval before I can log in.</span>
              </label>
            </div>}

            {step===4&&<div>
              <div style={{fontSize:"18px",fontWeight:"800",color:"#111",marginBottom:"16px"}}>Review Your Details</div>
              <div style={{borderRadius:"12px",overflow:"hidden",border:"1px solid #f0f0f0"}}>
                {[["Brand Name",data.brandName],["Business Type",data.businessType],["State",data.state],["Business Email",data.businessEmail],["Owner Name",`${data.firstName||""} ${data.lastName||""}`.trim()],["Owner Email",data.ownerEmail],["Staff Count",data.staffCount]].filter(([,v])=>v).map(([l,v],i)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:i%2===0?"#fafafa":"white",fontSize:"13px"}}>
                    <span style={{color:"#888",fontWeight:"600"}}>{l}</span>
                    <span style={{color:"#111"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:"16px",padding:"14px",borderRadius:"12px",background:"#fffbeb",border:"1px solid #fcd34d",fontSize:"13px",color:"#92400e",lineHeight:"1.7"}}>
                ⏳ After submission, admin will review and approve your account within 24 hours. You will be notified by email.
              </div>
            </div>}
          </Card>

          <div style={{display:"flex",gap:"10px"}}>
            {step>1&&<GhostBtn onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"12px"}}>← Back</GhostBtn>}
            {step<4
              ? <button onClick={()=>setStep(s=>s+1)} disabled={!canNext()}
                  style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",background:canNext()?GOLD:"#e5e7eb",color:canNext()?"#1a0a2e":"#bbb",fontWeight:"800",fontSize:"14px",cursor:canNext()?"pointer":"not-allowed"}}>
                  Continue →
                </button>
              : <button onClick={()=>setDone(true)} style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",background:DARK,color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>
                  Submit Registration →
                </button>
            }
          </div>
          <div style={{textAlign:"center",marginTop:"12px",fontSize:"12px",color:"#aaa"}}>
            Already registered? <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#c9a84c",fontWeight:"700",textDecoration:"underline"}}>Sign in here</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3-5 — BRAND DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const BRAND_NAV=[
  ["dashboard","🏠","Dashboard"],["appointments","📅","Appointments"],["consultation","💆","Consultations"],
  ["clients","👥","Clients"],["pos","🛒","POS / Sales"],["inventory","📦","Inventory"],
  ["expenses","💸","Expenses"],["debts","🏦","Debts"],["requests","📬","Requests"],
  ["reviews","⭐","Reviews"],["staff","👤","Team"],["reports","📊","Reports"],["settings","⚙️","Settings"],
];

// POS inside brand dashboard
function InlinePOS() {
  const [prods,setProds]=useState(PRODUCTS);
  const [cart,setCart]=useState([]);
  const [client,setClient]=useState("Walk-in Client");
  const [method,setMethod]=useState("Cash");
  const [cash,setCash]=useState("");
  const [disc,setDisc]=useState("");
  const [discPct,setDiscPct]=useState(false);
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [receipt,setReceipt]=useState(null);
  const cats=["All",...Array.from(new Set(PRODUCTS.map(p=>p.cat)))];
  const visible=prods.filter(p=>(filter==="All"||p.cat===filter)&&p.name.toLowerCase().includes(search.toLowerCase()));

  function add(p){
    const f=cart.find(c=>c.id===p.id);
    if(f) setCart(cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c));
    else setCart([...cart,{...p,qty:1}]);
  }
  function rmv(id){setCart(cart.filter(c=>c.id!==id));}
  function qty(id,v){const n=parseInt(v)||0;if(n<=0)rmv(id);else setCart(cart.map(c=>c.id===id?{...c,qty:n}:c));}

  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const discAmt=disc?(discPct?Math.round(sub*parseFloat(disc)/100):parseFloat(disc)||0):0;
  const total=Math.max(0,sub-discAmt);
  const change=method==="Cash"&&cash?parseFloat(cash)-total:0;

  function charge(){
    if(!cart.length)return;
    const id="TXN"+Math.floor(Math.random()*90000+10000);
    setReceipt({id,client:client||"Walk-in Client",items:[...cart],subtotal:sub,disc:discAmt,total,method,cashGiven:parseFloat(cash)||0});
    setProds(prev=>prev.map(p=>{const s=cart.find(c=>c.id===p.id);return s&&p.cat!=="Services"?{...p,stock:Math.max(0,p.stock-s.qty)}:p;}));
  }

  function newSale(){setReceipt(null);setCart([]);setClient("Walk-in Client");setDisc("");setCash("");setMethod("Cash");}

  const printReceipt=()=>{
    const w=window.open("","_blank","width=380,height=650");
    w.document.write(`<html><head><title>Receipt</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Courier New',monospace}body{padding:24px;max-width:320px;margin:auto}.c{text-align:center}.b{font-weight:bold}hr{border:none;border-top:1px dashed #aaa;margin:10px 0}.r{display:flex;justify-content:space-between;margin:4px 0;font-size:12px}</style></head><body>
    <div class="c"><div class="b" style="font-size:15px">Four Sisters Aesthetic Spa</div><div style="font-size:11px;color:#666;margin-top:4px">14 Awolowo Road, Ikoyi, Lagos<br>08012345678<br>${nowStr()}</div></div>
    <hr><div class="r"><span>Receipt:</span><span>${receipt?.id}</span></div><div class="r"><span>Client:</span><span>${receipt?.client}</span></div><hr>
    ${receipt?.items.map(i=>`<div style="margin-bottom:8px"><div class="b" style="font-size:12px">${i.emoji} ${i.name}</div><div class="r" style="color:#666"><span>${i.qty} x ${fmt(i.price)}</span><span>${fmt(i.price*i.qty)}</span></div></div>`).join("")}
    <hr><div class="r"><span>Subtotal</span><span>${fmt(receipt?.subtotal)}</span></div>${receipt?.disc>0?`<div class="r" style="color:green"><span>Discount</span><span>-${fmt(receipt?.disc)}</span></div>`:""}<div class="r b" style="font-size:15px"><span>TOTAL</span><span>${fmt(receipt?.total)}</span></div><div class="r"><span>Payment</span><span>${receipt?.method}</span></div>
    <hr><div class="c" style="font-size:11px;color:#999">Thank you for visiting! ✨</div></body></html>`);
    w.document.close();setTimeout(()=>{w.focus();w.print();},300);
  };

  if(receipt) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",padding:"20px"}}>
      <Card style={{width:"100%",maxWidth:"360px",overflow:"hidden"}}>
        <div style={{padding:"24px",textAlign:"center",borderBottom:"1px solid #f0f0f0"}}>
          <div style={{fontSize:"48px",marginBottom:"8px"}}>🎉</div>
          <div style={{fontSize:"20px",fontWeight:"900"}}>Sale Complete!</div>
          <div style={{fontSize:"12px",color:"#aaa",marginTop:"4px"}}>Receipt #{receipt.id}</div>
        </div>
        <div style={{padding:"20px"}}>
          {receipt.items.map((it,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"8px"}}>
              <span>{it.emoji} {it.name} <span style={{color:"#aaa"}}>×{it.qty}</span></span>
              <span style={{fontWeight:"700"}}>{fmt(it.price*it.qty)}</span>
            </div>
          ))}
          <div style={{borderTop:"1px dashed #ddd",marginTop:"12px",paddingTop:"12px"}}>
            {receipt.disc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",color:"#059669",marginBottom:"4px"}}><span>Discount</span><span>−{fmt(receipt.disc)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"22px",fontWeight:"900"}}><span>TOTAL</span><span style={{color:"#c9a84c"}}>{fmt(receipt.total)}</span></div>
          </div>
        </div>
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={printReceipt} style={{padding:"13px",borderRadius:"12px",border:"none",background:DARK,color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>🖨️ Print / Save as PDF</button>
          <button onClick={newSale} style={{padding:"11px",borderRadius:"12px",border:"1px solid #e5e7eb",background:"white",color:"#555",fontWeight:"700",cursor:"pointer"}}>+ New Sale</button>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100%",gap:"0",overflow:"hidden"}}>
      {/* Products */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",background:"white",borderBottom:"1px solid #f0f0f0",display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
            style={{flex:1,minWidth:"140px",padding:"8px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none"}}/>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {cats.map(c=><button key={c} onClick={()=>setFilter(c)}
              style={{padding:"7px 13px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:filter===c?"#1a0a2e":"#f0f0f0",color:filter===c?"white":"#666"}}>
              {c}</button>)}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px",alignContent:"start"}}>
          {visible.map(p=>{
            const inCart=cart.find(c=>c.id===p.id);
            const cQty=inCart?inCart.qty:0;
            const out=p.cat!=="Services"&&p.stock<=0;
            return (
              <button key={p.id} onClick={()=>!out&&add(p)} disabled={out}
                style={{background:"white",border:cQty>0?"2px solid #c9a84c":"2px solid transparent",borderRadius:"16px",padding:"14px",cursor:out?"not-allowed":"pointer",opacity:out?0.4:1,textAlign:"left",position:"relative",boxShadow:cQty>0?"0 4px 12px rgba(201,168,76,0.2)":"0 2px 6px rgba(0,0,0,0.06)",width:"100%",display:"block",outline:"none"}}>
                {cQty>0&&<div style={{position:"absolute",top:"-8px",right:"-8px",width:"24px",height:"24px",borderRadius:"50%",background:"#c9a84c",color:"#1a0a2e",fontWeight:"900",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>{cQty}</div>}
                <div style={{fontSize:"28px",marginBottom:"8px"}}>{p.emoji}</div>
                <div style={{fontSize:"12px",fontWeight:"700",color:"#111",marginBottom:"4px",lineHeight:"1.3"}}>{p.name}</div>
                <div style={{fontSize:"14px",fontWeight:"900",color:"#c9a84c"}}>{fmt(p.price)}</div>
                {p.cat!=="Services"&&<div style={{fontSize:"10px",color:p.stock<=5?"#ef4444":"#bbb",marginTop:"3px",fontWeight:"600"}}>{out?"Out of stock":`${p.stock} left`}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div style={{width:"280px",flexShrink:0,background:"white",borderLeft:"1px solid #f0f0f0",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid #f5f5f5"}}>
          <div style={{fontSize:"10px",fontWeight:"800",color:"#bbb",letterSpacing:"1.5px",marginBottom:"6px"}}>CLIENT</div>
          <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Walk-in Client"
            style={{width:"100%",padding:"8px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {cart.length===0
            ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",color:"#ddd",textAlign:"center",gap:"6px"}}>
              <div style={{fontSize:"36px"}}>🛒</div>
              <div style={{fontSize:"13px",fontWeight:"600"}}>Cart empty</div>
              <div style={{fontSize:"11px"}}>Click products to add</div>
            </div>
            :cart.map(item=>(
              <div key={item.id} style={{padding:"10px 14px",borderBottom:"1px solid #f9f9f9"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.emoji} {item.name}</div>
                    <div style={{fontSize:"11px",color:"#bbb"}}>{fmt(item.price)} each</div>
                  </div>
                  <div style={{fontWeight:"900",fontSize:"13px",marginLeft:"8px",flexShrink:0}}>{fmt(item.price*item.qty)}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <button onClick={()=>qty(item.id,item.qty-1)} style={{width:"26px",height:"26px",borderRadius:"7px",background:"#f3f4f6",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"16px",lineHeight:1}}>−</button>
                  <input type="number" value={item.qty} onChange={e=>qty(item.id,e.target.value)} style={{width:"38px",textAlign:"center",padding:"3px",border:"1px solid #e5e7eb",borderRadius:"7px",fontSize:"13px",fontWeight:"700",outline:"none"}}/>
                  <button onClick={()=>qty(item.id,item.qty+1)} style={{width:"26px",height:"26px",borderRadius:"7px",background:"#c9a84c",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"16px",lineHeight:1,color:"#1a0a2e"}}>+</button>
                  <button onClick={()=>rmv(item.id)} style={{marginLeft:"auto",color:"#ef4444",background:"none",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>✕</button>
                </div>
              </div>
            ))}
        </div>
        <div style={{borderTop:"1px solid #f0f0f0",padding:"12px 14px",background:"#fafafa",display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",gap:"6px"}}>
            <div style={{display:"flex",borderRadius:"8px",border:"1px solid #e5e7eb",overflow:"hidden"}}>
              <button onClick={()=>setDiscPct(false)} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"12px",background:!discPct?"#1a0a2e":"white",color:!discPct?"white":"#888"}}>₦</button>
              <button onClick={()=>setDiscPct(true)}  style={{padding:"6px 10px",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"12px",background:discPct?"#1a0a2e":"white",color:discPct?"white":"#888"}}>%</button>
            </div>
            <input value={disc} onChange={e=>setDisc(e.target.value)} placeholder="Discount"
              style={{flex:1,padding:"6px 10px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none"}}/>
          </div>
          <div style={{background:"white",borderRadius:"10px",padding:"10px",border:"1px solid #f0f0f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#888",marginBottom:"3px"}}><span>Subtotal</span><span>{fmt(sub)}</span></div>
            {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#059669",marginBottom:"3px"}}><span>Discount</span><span>−{fmt(discAmt)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"18px",fontWeight:"900",borderTop:"1px solid #f0f0f0",paddingTop:"6px",marginTop:"3px"}}><span>Total</span><span style={{color:"#c9a84c"}}>{fmt(total)}</span></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
            {[["Cash","💵"],["Transfer","🏦"],["POS","💳"],["Split","✂️"]].map(([m,i])=>(
              <button key={m} onClick={()=>setMethod(m)} style={{padding:"8px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:method===m?"#1a0a2e":"#f0f0f0",color:method===m?"white":"#666"}}>{i} {m}</button>
            ))}
          </div>
          {method==="Cash"&&<div>
            <input type="number" value={cash} onChange={e=>setCash(e.target.value)} placeholder="Cash given (₦)"
              style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
            {cash&&<div style={{fontSize:"12px",fontWeight:"700",marginTop:"5px",color:change>=0?"#059669":"#ef4444"}}>{change>=0?`✓ Change: ${fmt(change)}`:`⚠ Short: ${fmt(Math.abs(change))}`}</div>}
          </div>}
          <button onClick={charge} disabled={!cart.length}
            style={{padding:"14px",borderRadius:"12px",border:"none",background:cart.length?GOLD:"#e5e7eb",color:cart.length?"#1a0a2e":"#bbb",fontWeight:"900",fontSize:"14px",cursor:cart.length?"pointer":"not-allowed"}}>
            {cart.length?`💳 Charge ${fmt(total)}`:"Select products above"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandDashboardHome() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{borderRadius:"20px",padding:"24px",color:"white",backgroundImage:DARK,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:"-20px",top:"-20px",width:"120px",height:"120px",borderRadius:"50%",background:"rgba(201,168,76,0.1)"}}/>
        <div style={{fontSize:"13px",opacity:0.7,marginBottom:"4px"}}>Good morning 👋</div>
        <div style={{fontSize:"24px",fontWeight:"900"}}>Amara Okonkwo</div>
        <div style={{fontSize:"13px",opacity:0.6,marginTop:"4px"}}>Four Sisters Aesthetic Spa · {new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px"}}>
        <StatCard icon="👥" label="Total Clients"       value="124" sub="+8 this month"/>
        <StatCard icon="📅" label="Today's Appointments" value="7"   sub="3 confirmed"/>
        <StatCard icon="💰" label="Monthly Revenue"     value="₦284,500" sub="+12% vs last month"/>
        <StatCard icon="📦" label="Low Stock Alerts"    value="3"   sub="Need restocking" alert/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
        <Card>
          <div style={{padding:"16px 20px",borderBottom:"1px solid #f5f5f5",fontWeight:"800",fontSize:"15px"}}>Today's Appointments</div>
          {APPOINTMENTS.slice(0,4).map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 20px",borderBottom:"1px solid #f9f9f9"}}>
              <Avatar name={a.client} size={34}/>
              <div style={{flex:1}}>
                <div style={{fontSize:"13px",fontWeight:"700"}}>{a.client}</div>
                <div style={{fontSize:"11px",color:"#aaa"}}>{a.service} · {a.therapist}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"12px",fontWeight:"700",color:"#555"}}>{a.time}</div>
                <Pill label={a.status} type={a.status==="confirmed"?"green":"amber"}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{padding:"16px 20px",borderBottom:"1px solid #f5f5f5",fontWeight:"800",fontSize:"15px"}}>Low Stock Alerts ⚠️</div>
          {[["Vitamin C Serum","2 left","SKN001"],["SPF 50 Sunscreen","3 left","SKN003"],["Hyaluronic Toner","1 left","SKN002"]].map(([n,s,sku])=>(
            <div key={sku} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #f9f9f9"}}>
              <div>
                <div style={{fontSize:"13px",fontWeight:"700"}}>{n}</div>
                <div style={{fontSize:"11px",color:"#ef4444",fontWeight:"600"}}>{s}</div>
              </div>
              <button style={{padding:"5px 12px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"11px",cursor:"pointer"}}>Restock</button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function BrandDashboard({ onLogout, onGoToAdmin }) {
  const [page,setPage]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(false);
  const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};

  const renderPage=()=>{
    if(page==="dashboard")    return <BrandDashboardHome/>;
    if(page==="pos")          return <div style={{height:"calc(100vh - 60px)",display:"flex",flexDirection:"column"}}><InlinePOS/></div>;
    if(page==="appointments") return <AppointmentsPage/>;
    if(page==="consultation") return <ConsultationsPage/>;
    if(page==="clients")      return <ClientsPage/>;
    if(page==="expenses")     return <ExpensesPage/>;
    if(page==="debts")        return <DebtsPage/>;
    if(page==="staff")        return <StaffPage/>;
    if(page==="reports")      return <ReportsPage/>;
    if(page==="inventory")    return <InventoryPage/>;
    if(page==="requests")     return <RequestsPage/>;
    if(page==="reviews")      return <ReviewsPage/>;
    return <ComingSoon title={BRAND_NAV.find(n=>n[0]===page)?.[2]||page}/>;
  };

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:"210px",flexShrink:0,backgroundImage:DARK,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"900",color:"#1a0a2e",fontSize:"18px"}}>F</div>
            <div><div style={{color:"white",fontWeight:"800",fontSize:"13px",lineHeight:"1.3"}}>Four Sisters<br/>Aesthetic Spa</div><div style={{color:"#c9a84c",fontSize:"10px",marginTop:"2px"}}>Brand Owner</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"8px"}}>
          {BRAND_NAV.map(([id,icon,label])=>(
            <button key={id} onClick={()=>setPage(id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"12px",marginBottom:"1px",textAlign:"left",background:page===id?"rgba(201,168,76,0.15)":"transparent",color:page===id?"#c9a84c":"rgba(255,255,255,0.55)",transition:"all 0.15s"}}>
              <span style={{fontSize:"15px"}}>{icon}</span>{label}
            </button>
          ))}
          <div style={{margin:"8px 0",borderTop:"1px solid rgba(255,255,255,0.08)"}}/>
          <button onClick={onGoToAdmin} style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"12px",textAlign:"left",background:"rgba(201,168,76,0.08)",color:"#c9a84c"}}>
            <span>🔐</span>Admin Panel
          </button>
        </nav>
        <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>amara@foursisters.ng</div>
          <button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:"11px"}}>→ Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"white",borderBottom:"1px solid #f0f0f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontWeight:"800",fontSize:"16px",color:"#111"}}>{BRAND_NAV.find(n=>n[0]===page)?.[2]||page}</div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{position:"relative"}}>
              <button style={{width:"36px",height:"36px",borderRadius:"10px",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"18px"}}>🔔</button>
              <div style={{position:"absolute",top:"-4px",right:"-4px",width:"16px",height:"16px",borderRadius:"50%",background:"#ef4444",color:"white",fontSize:"9px",fontWeight:"900",display:"flex",alignItems:"center",justifyContent:"center"}}>3</div>
            </div>
            <Avatar name="A" size={34}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:page==="pos"?"0":"24px",background:"#f9fafb"}}>
          {renderPage()}
        </div>
      </div>
      <Toast msg={toast}/>
    </div>
  );
}

// ── BRAND PAGES ───────────────────────────────────────────────────────────────
function AppointmentsPage(){
  const [apts,setApts]=useState(APPOINTMENTS);
  return(
    <div>
      <SectionHead title="Appointments" sub="All bookings for today and upcoming" btn="+ New Appointment"/>
      <Table cols={["Client","Service","Time","Therapist","Status","Action"]}
        rows={apts.map(a=>(
          <TR key={a.id}>
            <TD><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={a.client} size={30}/><span style={{fontWeight:"700"}}>{a.client}</span></div></TD>
            <TD style={{color:"#666"}}>{a.service}</TD>
            <TD style={{fontWeight:"700"}}>{a.time}</TD>
            <TD style={{color:"#888"}}>{a.therapist}</TD>
            <TD><Pill label={a.status} type={a.status==="confirmed"?"green":"amber"}/></TD>
            <TD><div style={{display:"flex",gap:"6px"}}>
              <GhostBtn>View</GhostBtn>
              {a.status==="pending"&&<button onClick={()=>setApts(p=>p.map(x=>x.id===a.id?{...x,status:"confirmed"}:x))} style={{padding:"5px 10px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"11px",cursor:"pointer"}}>Confirm</button>}
            </div></TD>
          </TR>
        ))}
      />
    </div>
  );
}

function ConsultationsPage(){
  const [selected,setSelected]=useState(null);
  return(
    <div>
      <SectionHead title="Consultations" sub="Client consultation records" btn="+ New Consultation"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="📋" label="Total" value={CONSULTATIONS.length}/>
        <StatCard icon="📅" label="This Month" value="2"/>
        <StatCard icon="⏳" label="Pending Assessment" value="1"/>
      </div>
      <Table cols={["Client","Date","Therapist","Skin Type","Concerns","Action"]}
        rows={CONSULTATIONS.map(c=>(
          <TR key={c.id}>
            <TD><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={c.client} size={30}/><span style={{fontWeight:"700"}}>{c.client}</span></div></TD>
            <TD style={{color:"#888",fontSize:"12px"}}>{c.date}</TD>
            <TD style={{color:"#666"}}>{c.therapist}</TD>
            <TD><Pill label={c.skinType} type="purple"/></TD>
            <TD style={{color:"#888",fontSize:"12px",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.concerns.join(", ")}</TD>
            <TD><div style={{display:"flex",gap:"6px"}}><GhostBtn onClick={()=>setSelected(c)}>View</GhostBtn><GhostBtn>PDF</GhostBtn></div></TD>
          </TR>
        ))}
      />
      {selected&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <Card style={{width:"100%",maxWidth:"420px",overflow:"hidden"}}>
            <div style={{padding:"20px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:"800",fontSize:"16px"}}>Consultation Summary</div><button onClick={()=>setSelected(null)} style={{width:"28px",height:"28px",borderRadius:"50%",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"16px"}}>×</button></div>
            <div style={{padding:"20px"}}>
              {[["Client",selected.client],["Date",selected.date],["Therapist",selected.therapist],["Skin Type",selected.skinType],["Concerns",selected.concerns.join(", ")],["Treatment",selected.treatment]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f9f9f9",fontSize:"13px"}}>
                  <span style={{color:"#888",fontWeight:"600"}}>{l}</span><span style={{color:"#111",maxWidth:"220px",textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"16px"}}><DarkBtn style={{width:"100%",padding:"12px"}}>Download PDF</DarkBtn></div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ClientsPage(){
  return(
    <div>
      <SectionHead title="Client Management" sub="All your clients" btn="+ Add Client"/>
      <Table cols={["Client","Skin Type","Visits","Last Visit","Total Spend","Action"]}
        rows={CLIENTS.map(c=>(
          <TR key={c.id}>
            <TD><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={c.name} size={30} gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)"/><span style={{fontWeight:"700"}}>{c.name}</span></div></TD>
            <TD style={{color:"#666"}}>{c.skin}</TD>
            <TD style={{fontWeight:"700"}}>{c.visits}</TD>
            <TD style={{color:"#888"}}>{c.last}</TD>
            <TD style={{fontWeight:"900",color:"#111"}}>{fmt(c.spend)}</TD>
            <TD><GhostBtn>View Profile</GhostBtn></TD>
          </TR>
        ))}
      />
    </div>
  );
}

function InventoryPage(){
  const [prods,setProds]=useState(PRODUCTS);
  return(
    <div>
      <SectionHead title="Inventory" sub="Manage your products and stock" btn="+ Add Product"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="📦" label="Total Products" value={prods.length}/>
        <StatCard icon="⚠️" label="Low Stock" value={prods.filter(p=>p.cat!=="Services"&&p.stock<=5&&p.stock>0).length} alert/>
        <StatCard icon="💰" label="Stock Value" value={fmt(prods.filter(p=>p.cat!=="Services").reduce((s,p)=>s+p.price*p.stock,0))}/>
      </div>
      <Table cols={["Product","Category","Stock","Price","Status","Action"]}
        rows={prods.map(p=>{
          const low=p.cat!=="Services"&&p.stock<=5&&p.stock>0;
          const out=p.cat!=="Services"&&p.stock<=0;
          return(
            <TR key={p.id} highlight={out?"#fff5f5":low?"#fffbeb":"white"}>
              <TD><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"20px"}}>{p.emoji}</span><span style={{fontWeight:"700"}}>{p.name}</span></div></TD>
              <TD><Pill label={p.cat} type="purple"/></TD>
              <TD style={{fontWeight:"900",color:out?"#ef4444":low?"#f59e0b":"#111"}}>{p.cat==="Services"?"∞":p.stock}</TD>
              <TD style={{fontWeight:"700"}}>{fmt(p.price)}</TD>
              <TD>{p.cat==="Services"?<Pill label="Service" type="blue"/>:out?<Pill label="Out of Stock" type="red"/>:low?<Pill label="Low Stock" type="amber"/>:<Pill label="In Stock" type="green"/>}</TD>
              <TD><div style={{display:"flex",gap:"6px"}}>
                {p.cat!=="Services"&&<button onClick={()=>setProds(prev=>prev.map(x=>x.id===p.id?{...x,stock:x.stock+10}:x))} style={{padding:"5px 10px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"11px",cursor:"pointer"}}>+Restock</button>}
                <GhostBtn>Edit</GhostBtn>
              </div></TD>
            </TR>
          );
        })}
      />
    </div>
  );
}

function ExpensesPage(){
  const [exps,setExps]=useState(EXPENSES);
  const total=exps.reduce((s,e)=>s+e.amount,0);
  return(
    <div>
      <SectionHead title="Expenses" sub="Track all business spending" btn="+ Log Expense"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="💸" label="Total This Month" value={fmt(total)}/>
        <StatCard icon="🏠" label="Biggest Category" value="Rent"/>
        <StatCard icon="📊" label="vs Revenue" value="-61%"/>
      </div>
      <Table cols={["Category","Description","Amount","Date","Receipt"]}
        rows={exps.map(e=>(
          <TR key={e.id}>
            <TD><Pill label={e.cat} type="purple"/></TD>
            <TD style={{color:"#555"}}>{e.desc}</TD>
            <TD style={{fontWeight:"900"}}>{fmt(e.amount)}</TD>
            <TD style={{color:"#aaa",fontSize:"12px"}}>{e.date}</TD>
            <TD><span style={{fontSize:"12px",color:"#059669",fontWeight:"700"}}>✓ Attached</span></TD>
          </TR>
        ))}
      />
    </div>
  );
}

function DebtsPage(){
  const [debts,setDebts]=useState(DEBTS);
  return(
    <div>
      <SectionHead title="Debt Management" sub="Money owed to you and money you owe" btn="+ Record Debt"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"20px"}}>
        <Card style={{padding:"18px",borderLeft:"4px solid #059669"}}>
          <div style={{fontSize:"12px",color:"#888",fontWeight:"600"}}>Clients Owe You</div>
          <div style={{fontSize:"24px",fontWeight:"900",marginTop:"4px"}}>₦23,500</div>
          <div style={{fontSize:"12px",color:"#ef4444",marginTop:"2px"}}>₦15,000 overdue</div>
        </Card>
        <Card style={{padding:"18px",borderLeft:"4px solid #ef4444"}}>
          <div style={{fontSize:"12px",color:"#888",fontWeight:"600"}}>You Owe Suppliers</div>
          <div style={{fontSize:"24px",fontWeight:"900",marginTop:"4px"}}>₦45,000</div>
          <div style={{fontSize:"12px",color:"#aaa",marginTop:"2px"}}>Due Jul 15</div>
        </Card>
      </div>
      <Table cols={["Direction","Party","Description","Amount","Due","Status","Action"]}
        rows={debts.map(d=>(
          <TR key={d.id}>
            <TD><Pill label={d.dir==="owes_us"?"↓ Owed to us":"↑ We owe"} type={d.dir==="owes_us"?"green":"red"}/></TD>
            <TD style={{fontWeight:"700"}}>{d.party}</TD>
            <TD style={{color:"#888",fontSize:"12px"}}>{d.desc}</TD>
            <TD style={{fontWeight:"900"}}>{fmt(d.amount)}</TD>
            <TD style={{color:"#aaa",fontSize:"12px"}}>{d.due}</TD>
            <TD><Pill label={d.status} type={d.status==="overdue"?"red":"amber"}/></TD>
            <TD><button onClick={()=>setDebts(prev=>prev.filter(x=>x.id!==d.id))} style={{padding:"5px 10px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"11px",cursor:"pointer"}}>Mark Paid</button></TD>
          </TR>
        ))}
      />
    </div>
  );
}

function StaffPage(){
  const [showInvite,setShowInvite]=useState(false);
  return(
    <div>
      <SectionHead title="Team Management" sub="Manage staff access" btn="+ Invite Staff" onBtn={()=>setShowInvite(true)}/>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {STAFF.map(s=>(
          <Card key={s.id} style={{padding:"18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
              <Avatar name={s.name} size={44} gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)"/>
              <div>
                <div style={{fontWeight:"800",fontSize:"15px"}}>{s.name}</div>
                <div style={{fontSize:"13px",color:"#888",marginTop:"2px"}}>{s.role} · {s.email}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <Pill label={s.status} type="green"/>
              <GhostBtn>Manage</GhostBtn>
            </div>
          </Card>
        ))}
      </div>
      {showInvite&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <Card style={{width:"100%",maxWidth:"380px",overflow:"hidden"}}>
            <div style={{padding:"20px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:"800",fontSize:"16px"}}>Invite Staff</div><button onClick={()=>setShowInvite(false)} style={{width:"28px",height:"28px",borderRadius:"50%",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"16px"}}>×</button></div>
            <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
              <div><div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>Staff Email</div><input placeholder="staff@yourbrand.ng" type="email" style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div>
              <div><div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>Role</div><select style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",background:"white"}}><option>Therapist</option><option>Receptionist</option></select></div>
              <div style={{padding:"12px",borderRadius:"10px",background:"#eff6ff",fontSize:"12px",color:"#2563eb"}}>📧 An invite link will be sent. They set their own password and join your workspace automatically.</div>
              <DarkBtn onClick={()=>setShowInvite(false)} style={{width:"100%",padding:"12px"}}>Send Invite</DarkBtn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReportsPage(){
  const months=["Jan","Feb","Mar","Apr","May","Jun"];
  const rev=[180000,210000,195000,250000,270000,284500];
  const exp=[120000,135000,140000,160000,180000,200000];
  const maxV=Math.max(...rev);
  return(
    <div>
      <SectionHead title="Reports & Analytics" sub="Business performance overview"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="💰" label="Total Revenue"  value="₦1,389,500"/>
        <StatCard icon="💸" label="Total Expenses" value="₦935,000"/>
        <StatCard icon="📈" label="Net Profit"     value="₦454,500"/>
      </div>
      <Card style={{padding:"24px",marginBottom:"20px"}}>
        <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"20px"}}>Revenue vs Expenses (6 months)</div>
        {months.map((m,i)=>(
          <div key={m} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
            <span style={{width:"28px",fontSize:"12px",color:"#aaa",fontWeight:"600"}}>{m}</span>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:"4px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{height:"8px",borderRadius:"4px",background:GOLD,width:`${(rev[i]/maxV)*100}%`,minWidth:"4px"}}/>
                <span style={{fontSize:"11px",color:"#888"}}>₦{(rev[i]/1000).toFixed(0)}k</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{height:"8px",borderRadius:"4px",background:"#fecaca",width:`${(exp[i]/maxV)*100}%`,minWidth:"4px"}}/>
                <span style={{fontSize:"11px",color:"#aaa"}}>₦{(exp[i]/1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:"16px",marginTop:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"12px",height:"8px",borderRadius:"2px",background:GOLD}}/><span style={{fontSize:"11px",color:"#888"}}>Revenue</span></div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"12px",height:"8px",borderRadius:"2px",background:"#fecaca"}}/><span style={{fontSize:"11px",color:"#aaa"}}>Expenses</span></div>
        </div>
      </Card>
      <div style={{display:"flex",gap:"10px"}}>
        {["Export PDF","Export Excel","Print Report"].map(l=><GhostBtn key={l}>{l}</GhostBtn>)}
      </div>
    </div>
  );
}

function RequestsPage(){
  const reqs=[
    {id:1,client:"Adaeze Nwosu",product:"La Roche-Posay Effaclar",urgency:"High",  status:"sourcing",date:"Jun 20"},
    {id:2,client:"Fatima Bello", product:"Tretinoin 0.05% Cream",  urgency:"Normal",status:"pending", date:"Jun 22"},
    {id:3,client:"Chisom Obi",   product:"The Ordinary Niacinamide",urgency:"Low",  status:"available",date:"Jun 18"},
  ];
  return(
    <div>
      <SectionHead title="Client Requests" sub="Product requests from clients"/>
      <Table cols={["Client","Product Requested","Urgency","Date","Status","Action"]}
        rows={reqs.map(r=>(
          <TR key={r.id}>
            <TD style={{fontWeight:"700"}}>{r.client}</TD>
            <TD style={{color:"#555"}}>{r.product}</TD>
            <TD><Pill label={r.urgency} type={r.urgency==="High"?"red":r.urgency==="Normal"?"amber":"gray"}/></TD>
            <TD style={{color:"#aaa",fontSize:"12px"}}>{r.date}</TD>
            <TD><Pill label={r.status} type={r.status==="available"?"green":r.status==="sourcing"?"purple":"amber"}/></TD>
            <TD><GhostBtn>Update</GhostBtn></TD>
          </TR>
        ))}
      />
    </div>
  );
}

function ReviewsPage(){
  const reviews=[
    {id:1,client:"Ngozi Adeyemi",rating:5,comment:"Amazing experience! My skin has never felt better.",service:"Facial Treatment",date:"Jun 20"},
    {id:2,client:"Chisom Obi",   rating:4,comment:"Great chemical peel. Noticed results in 3 days.",service:"Chemical Peel",    date:"Jun 18"},
    {id:3,client:"Fatima Bello", rating:5,comment:"Best spa in Lagos! Thorough consultation and great products.",service:"Consultation",date:"Jun 15"},
  ];
  return(
    <div>
      <SectionHead title="Client Reviews" sub="What your clients are saying"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="⭐" label="Average Rating" value="4.8 ⭐"/>
        <StatCard icon="📝" label="Total Reviews"  value="38"/>
        <StatCard icon="🏆" label="5-Star Reviews" value="29"/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {reviews.map(r=>(
          <Card key={r.id} style={{padding:"20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
              <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                <Avatar name={r.client} size={38}/>
                <div><div style={{fontWeight:"800",fontSize:"14px"}}>{r.client}</div><div style={{fontSize:"12px",color:"#aaa",marginTop:"2px"}}>{r.service} · {r.date}</div></div>
              </div>
              <div style={{display:"flex",gap:"2px"}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:"18px",color:i<=r.rating?"#fbbf24":"#e5e7eb"}}>★</span>)}</div>
            </div>
            <div style={{fontSize:"14px",color:"#555",lineHeight:"1.7"}}>{r.comment}</div>
            <GhostBtn style={{marginTop:"12px",fontSize:"12px"}}>Reply</GhostBtn>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ComingSoon({title}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",textAlign:"center"}}>
      <div style={{fontSize:"56px",marginBottom:"16px"}}>🔨</div>
      <div style={{fontSize:"20px",fontWeight:"800",color:"#111",marginBottom:"8px"}}>{title}</div>
      <div style={{fontSize:"14px",color:"#aaa"}}>This module is built — tap another section to explore</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — APP ROUTER
// ══════════════════════════════════════════════════════════════════════════════
export default function SkinCarePro() {
  // screen: "landing" | "admin-login" | "admin" | "register" | "brand"
  const [screen, setScreen] = useState("landing");

  if(screen==="admin-login") return <AdminLogin onLogin={()=>setScreen("admin")}/>;
  if(screen==="admin")       return <AdminDashboard onLogout={()=>setScreen("landing")} onGoToBrand={()=>setScreen("brand")}/>;
  if(screen==="register")    return <BrandRegistration onBack={()=>setScreen("landing")} onSubmit={()=>setScreen("landing")}/>;
  if(screen==="brand")       return <BrandDashboard onLogout={()=>setScreen("landing")} onGoToAdmin={()=>setScreen("admin")}/>;

  // Landing / Home screen
  return (
    <div style={{minHeight:"100vh",backgroundImage:DARK,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:"460px",textAlign:"center"}}>
        <div style={{width:"80px",height:"80px",borderRadius:"24px",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"40px",margin:"0 auto 20px"}}>💎</div>
        <div style={{fontSize:"36px",fontWeight:"900",color:"white",marginBottom:"8px"}}>SkinCare Pro</div>
        <div style={{fontSize:"15px",color:"rgba(255,255,255,0.6)",marginBottom:"40px",lineHeight:"1.7"}}>
          The complete business platform for Nigerian skincare brands and aesthetic spas
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"32px"}}>
          <button onClick={()=>setScreen("admin-login")}
            style={{padding:"16px",borderRadius:"16px",border:"none",background:GOLD,color:"#1a0a2e",fontWeight:"900",fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 20px rgba(201,168,76,0.4)"}}>
            🔐 Super Admin Login
          </button>
          <button onClick={()=>setScreen("brand")}
            style={{padding:"16px",borderRadius:"16px",border:"none",background:"rgba(255,255,255,0.12)",color:"white",fontWeight:"800",fontSize:"15px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.2)"}}>
            🏪 Brand Dashboard Demo
          </button>
          <button onClick={()=>setScreen("register")}
            style={{padding:"16px",borderRadius:"16px",border:"1px solid rgba(201,168,76,0.4)",background:"transparent",color:"#c9a84c",fontWeight:"800",fontSize:"15px",cursor:"pointer"}}>
            ✍️ Register Your Brand
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
          {[["💆","Consultations"],["📦","Inventory"],["🛒","POS Sales"],["📅","Appointments"],["💰","Finance"],["⭐","Reviews"]].map(([i,l])=>(
            <div key={l} style={{padding:"14px 10px",borderRadius:"14px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{fontSize:"22px",marginBottom:"4px"}}>{i}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",fontWeight:"600"}}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:"24px",fontSize:"13px",color:"rgba(255,255,255,0.3)"}}>
          ₦1,000/month per brand · Built for Nigeria
        </div>
      </div>
    </div>
  );
}
