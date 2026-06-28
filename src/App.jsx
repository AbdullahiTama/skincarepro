import { useState, useEffect } from "react";

const ADMIN_EMAIL = "admin@carehub.ng";
const ADMIN_PASS  = "Admin@2025";

// SUPABASE CONNECTION
const SB_URL = "https://szdybxmgmhndoytqanfb.supabase.co";
const SB_KEY = "sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz";

async function sbFetch(path, options) {
  const opts = options || {};
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    method: opts.method || "GET",
    headers: {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation"
    },
    body: opts.body || undefined
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function dbGetBusinesses() {
  return sbFetch("businesses?select=*&order=created_at.desc");
}
async function dbLoginBusiness(email, password) {
  const r = await sbFetch("businesses?email=eq." + encodeURIComponent(email) + "&password=eq." + encodeURIComponent(password) + "&select=*");
  return r[0] || null;
}
async function dbRegisterBusiness(data) {
  return sbFetch("businesses", { method: "POST", body: JSON.stringify(data) });
}
async function dbUpdateStatus(id, status) {
  return sbFetch("businesses?id=eq." + id, { method: "PATCH", body: JSON.stringify({ status: status }), prefer: "return=minimal" });
}
async function dbGetTeam() {
  return sbFetch("admin_team?select=*&order=created_at.desc");
}
async function dbInviteTeam(data) {
  return sbFetch("admin_team", { method: "POST", body: JSON.stringify(data) });
}
async function dbRemoveTeam(id) {
  return sbFetch("admin_team?id=eq." + id, { method: "DELETE", prefer: "return=minimal" });
}

const BUSINESS_TYPES = [
  { id:"skincare", icon:"🧴", name:"Skincare / Aesthetic Spa",   desc:"Client consultations, skin assessments, beauty treatments" },
  { id:"pharmacy", icon:"💊", name:"Community Pharmacy",          desc:"Patient consultations, dispensing, medication management" },
  { id:"hospital", icon:"🏥", name:"Hospital / Clinic",           desc:"Full hospital workflow, departments, lab, imaging" },
  { id:"dental",   icon:"🦷", name:"Dental Clinic",               desc:"Dental consultations, treatments, patient records" },
  { id:"optical",  icon:"👁", name:"Optical / Eye Clinic",        desc:"Eye examinations, prescriptions, optical dispensing" },
  { id:"wellness", icon:"🌿", name:"Wellness & Nutrition Center", desc:"Diet consultations, wellness programs, lifestyle coaching" },
];

const INIT_PRODUCTS = [
  { id:1,  name:"Vitamin C Serum",        genericName:"Ascorbic Acid Serum",  cat:"Skincare",    price:8500,  stock:20,  emoji:"🧴", listOnCareFind:true,  image:"" },
  { id:2,  name:"SPF 50 Sunscreen",       genericName:"Sunscreen SPF 50",     cat:"Skincare",    price:4800,  stock:30,  emoji:"☀️", listOnCareFind:true,  image:"" },
  { id:3,  name:"Amoxicillin 500mg",      genericName:"Amoxicillin",          cat:"Medicines",   price:1500,  stock:80,  emoji:"💊", listOnCareFind:true,  image:"" },
  { id:4,  name:"Paracetamol 500mg",      genericName:"Paracetamol",          cat:"Medicines",   price:800,   stock:200, emoji:"💊", listOnCareFind:true,  image:"" },
  { id:5,  name:"Metformin 500mg",        genericName:"Metformin",            cat:"Medicines",   price:2000,  stock:60,  emoji:"💊", listOnCareFind:true,  image:"" },
  { id:6,  name:"Ibuprofen 400mg",        genericName:"Ibuprofen",            cat:"Medicines",   price:900,   stock:0,   emoji:"💊", listOnCareFind:true,  image:"" },
  { id:7,  name:"Facial Treatment",       genericName:"Facial Treatment",     cat:"Services",    price:25000, stock:999, emoji:"💎", listOnCareFind:true,  image:"" },
  { id:8,  name:"Chemical Peel",          genericName:"Chemical Peel",        cat:"Services",    price:35000, stock:999, emoji:"💆", listOnCareFind:true,  image:"" },
  { id:9,  name:"Consultation Fee",       genericName:"Medical Consultation", cat:"Services",    price:5000,  stock:999, emoji:"🩺", listOnCareFind:true,  image:"" },
  { id:10, name:"Glucometer Strips",      genericName:"Blood Sugar Strips",   cat:"Consumables", price:3500,  stock:40,  emoji:"🩸", listOnCareFind:true,  image:"" },
  { id:11, name:"Surgical Gloves",        genericName:"Surgical Gloves",      cat:"Consumables", price:2500,  stock:100, emoji:"🧤", listOnCareFind:false, image:"" },
  { id:12, name:"Advanced Courier Cream", genericName:"Skin Lightening Cream",cat:"Skincare",    price:7500,  stock:15,  emoji:"💆", listOnCareFind:true,  image:"" },
];

const INIT_BRANDS = [
  { id:1, name:"Four Sisters Aesthetic Spa", owner:"Amara Okonkwo",    email:"amara@foursisters.ng",  phone:"08012345678", whatsapp:"2348012345678", address:"14 Awolowo Road, Ikoyi, Lagos",      state:"Lagos",  city:"Ikoyi",    lat:6.4474, lng:3.4359, hours:"Mon-Sat 9am-7pm", status:"active",   date:"Jun 10 2025", password:"brand123", type:"skincare", visibleOnCareFind:true,  mapsLink:"https://maps.google.com" },
  { id:2, name:"HealthPlus Pharmacy Ikeja",  owner:"Chidinma Eze",     email:"chidinma@healthplus.ng",phone:"08098765432", whatsapp:"2348098765432", address:"7 Allen Avenue, Ikeja, Lagos",         state:"Lagos",  city:"Ikeja",    lat:6.6018, lng:3.3515, hours:"Mon-Sun 8am-9pm", status:"pending",  date:"Jun 22 2025", password:"brand456", type:"pharmacy", visibleOnCareFind:true,  mapsLink:"" },
  { id:3, name:"Lagos City Clinic",          owner:"Dr. Fatima Bello", email:"fatima@lagoscity.ng",   phone:"09011223344", whatsapp:"2349011223344", address:"3 Marina Road, Lagos Island",          state:"Lagos",  city:"Lagos Island",lat:6.4541,lng:3.3947,hours:"Mon-Fri 8am-6pm", status:"pending",  date:"Jun 23 2025", password:"brand789", type:"hospital", visibleOnCareFind:true,  mapsLink:"" },
  { id:4, name:"Lumina Aesthetics",          owner:"Blessing Osei",    email:"blessing@lumina.ng",    phone:"08155667788", whatsapp:"2348155667788", address:"22 GRA Phase 2, Port Harcourt",        state:"Rivers", city:"Port Harcourt",lat:4.8156,lng:7.0498,hours:"Tue-Sun 10am-6pm",status:"active",  date:"Jun 5 2025",  password:"brand321", type:"skincare", visibleOnCareFind:true,  mapsLink:"" },
  { id:5, name:"CarePoint Pharmacy",         owner:"Kemi Adeyemi",     email:"kemi@carepoint.ng",     phone:"07033445566", whatsapp:"2347033445566", address:"9 Bodija Market Road, Ibadan",         state:"Oyo",    city:"Ibadan",   lat:7.3775, lng:3.9470, hours:"Mon-Sat 8am-8pm", status:"active",   date:"May 28 2025", password:"brand654", type:"pharmacy", visibleOnCareFind:true,  mapsLink:"" },
];

const APPOINTMENTS = [
  { id:1, client:"Ngozi Adeyemi",  service:"Consultation",  time:"9:00 AM",  status:"confirmed", staff:"Dr. Sade" },
  { id:2, client:"Chisom Obi",     service:"Follow-up",     time:"10:30 AM", status:"confirmed", staff:"Dr. Amara" },
  { id:3, client:"Fatima Bello",   service:"Treatment",     time:"12:00 PM", status:"pending",   staff:"Dr. Sade" },
  { id:4, client:"Adaeze Nwosu",   service:"Consultation",  time:"2:00 PM",  status:"confirmed", staff:"Dr. Amara" },
];

const EXPENSES = [
  { id:1, cat:"Rent",      desc:"Monthly rent",          amount:200000, date:"Jun 1" },
  { id:2, cat:"Salary",    desc:"Staff salaries",        amount:150000, date:"Jun 1" },
  { id:3, cat:"Utilities", desc:"Electricity bill",      amount:22000,  date:"Jun 10" },
  { id:4, cat:"Supplies",  desc:"Medical stock restock", amount:85000,  date:"Jun 15" },
];

const DEBTS = [
  { id:1, dir:"owes_us", party:"Ngozi Adeyemi",          amount:15000, due:"Jun 30", status:"overdue" },
  { id:2, dir:"owes_us", party:"Blessing Okoro",         amount:8500,  due:"Jul 5",  status:"pending" },
  { id:3, dir:"we_owe",  party:"MedSupply Distributors", amount:45000, due:"Jul 15", status:"pending" },
];

const CLIENTS = [
  { id:1, name:"Ngozi Adeyemi",  type:"Returning", visits:6,  last:"Today",       spend:45000 },
  { id:2, name:"Chisom Obi",     type:"Returning", visits:3,  last:"2 days ago",  spend:28500 },
  { id:3, name:"Fatima Bello",   type:"Returning", visits:11, last:"1 week ago",  spend:120000 },
  { id:4, name:"Adaeze Nwosu",   type:"New",       visits:2,  last:"2 weeks ago", spend:18000 },
];

const NIG_STATES=["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const fmt = n => "₦"+Number(n||0).toLocaleString();
const nowStr = () => new Date().toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"});
const todayDate = () => new Date().toISOString().split("T")[0];
const TEAL = "linear-gradient(135deg,#0f766e,#14b8a6)";
const DARK = "linear-gradient(135deg,#0f172a,#1e3a5f)";
const TEALC = "#0f766e";

const businessIcon = t => (BUSINESS_TYPES.find(b=>b.id===t)||{}).icon||"🏥";
const businessName = t => (BUSINESS_TYPES.find(b=>b.id===t)||{}).name||"Healthcare";

// SHARED UI
function Pill({ label, type="gray" }) {
  const map = { gray:{bg:"#f3f4f6",color:"#666"}, green:{bg:"#f0fdf4",color:"#059669"}, amber:{bg:"#fffbeb",color:"#d97706"}, red:{bg:"#fef2f2",color:"#dc2626"}, blue:{bg:"#eff6ff",color:"#2563eb"}, purple:{bg:"#f5f3ff",color:"#7c3aed"}, teal:{bg:"#f0fdfa",color:"#0f766e"} };
  const s=map[type]||map.gray;
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
function TealBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"10px 20px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"700",fontSize:"13px",cursor:"pointer",...style}}>{children}</button>;
}
function DarkBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"10px 20px",borderRadius:"12px",border:"none",background:DARK,color:"white",fontWeight:"700",fontSize:"13px",cursor:"pointer",...style}}>{children}</button>;
}
function GhostBtn({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{padding:"7px 13px",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:"#555",fontWeight:"600",fontSize:"12px",cursor:"pointer",...style}}>{children}</button>;
}
function SectionHead({ title, sub, btn, onBtn }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"20px"}}>
      <div><div style={{fontSize:"20px",fontWeight:"900",color:"#111"}}>{title}</div>{sub&&<div style={{fontSize:"13px",color:"#888",marginTop:"3px"}}>{sub}</div>}</div>
      {btn&&<TealBtn onClick={onBtn}>{btn}</TealBtn>}
    </div>
  );
}
function Avatar({ name, size=32, bg=TEAL }) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"white",fontWeight:"900",fontSize:size*0.35,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(name||"?")[0].toUpperCase()}</div>;
}
function Toast({ msg }) {
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:9999,padding:"12px 20px",borderRadius:"14px",background:TEAL,color:"white",fontWeight:"700",fontSize:"13px",boxShadow:"0 4px 16px rgba(15,118,110,0.4)"}}>{msg}</div>;
}
function Modal({ show, onClose, title, children, footer }) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <Card style={{width:"100%",maxWidth:"520px",overflow:"hidden",margin:"auto"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:"800",fontSize:"16px"}}>{title}</div>
          <button onClick={onClose} style={{width:"28px",height:"28px",borderRadius:"50%",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"16px"}}>×</button>
        </div>
        <div style={{padding:"20px 24px",maxHeight:"65vh",overflowY:"auto"}}>{children}</div>
        {footer&&<div style={{padding:"14px 24px",borderTop:"1px solid #f0f0f0",display:"flex",gap:"10px"}}>{footer}</div>}
      </Card>
    </div>
  );
}
function Inp({ label, value, onChange, type="text", placeholder="", required, style={} }) {
  return (
    <div style={style}>
      <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{label}{required&&<span style={{color:"#ef4444"}}> *</span>}</div>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
}
function Sel({ label, value, onChange, options, required, style={} }) {
  return (
    <div style={style}>
      <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{label}{required&&<span style={{color:"#ef4444"}}> *</span>}</div>
      <select value={value||""} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",background:"white",boxSizing:"border-box"}}>
        <option value="">Select...</option>
        {options.map(o=>typeof o==="string"?<option key={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, value, onChange, rows=3, placeholder="" }) {
  return (
    <div>
      <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{label}</div>
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
    </div>
  );
}
function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f5f5f5"}}>
      <div><div style={{fontSize:"13px",fontWeight:"600",color:"#111"}}>{label}</div>{desc&&<div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>{desc}</div>}</div>
      <button onClick={()=>onChange(!value)}
        style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",background:value?"#0f766e":"#e5e7eb",flexShrink:0}}>
        <div style={{position:"absolute",top:"2px",left:value?"22px":"2px",width:"20px",height:"20px",borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}

// LANDING PAGE
function LandingPage({ onLogin, onRegister }) {
  const features=[
    {icon:"📋",title:"Smart Consultations",desc:"Forms tailored to your business -- pharmacy, clinic, spa, dental, and more"},
    {icon:"📦",title:"Inventory Management",desc:"Track stock in real time. Alerts when products run low."},
    {icon:"🛒",title:"Point of Sale",desc:"Fast sales with receipts, discounts, cash, transfer and POS"},
    {icon:"📅",title:"Appointments",desc:"Online booking for clients. Calendar for your team."},
    {icon:"💰",title:"Finance & Accounting",desc:"Expenses, debts, profit and loss at a glance"},
    {icon:"👥",title:"Client / Patient CRM",desc:"Complete records -- visits, purchases, history, allergies"},
    {icon:"📊",title:"Reports & Analytics",desc:"Revenue, top services, stock value and growth"},
    {icon:"🔍",title:"CareFind Integration",desc:"Your products and services listed publicly so patients can find you nearby"},
    {icon:"👤",title:"Staff Management",desc:"Invite team, assign roles, control access"},
  ];
  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#fff"}}>
      <nav style={{position:"sticky",top:0,zIndex:100,background:"white",borderBottom:"1px solid #f0f0f0",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"64px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>🏥</div>
          <div style={{fontWeight:"900",fontSize:"20px",color:"#0f172a"}}>CareHub</div>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <GhostBtn onClick={onLogin}>Sign In</GhostBtn>
          <TealBtn onClick={onRegister}>Get Started Free</TealBtn>
        </div>
      </nav>

      <div style={{backgroundImage:DARK,padding:"80px 32px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"6px 16px",borderRadius:"20px",background:"rgba(20,184,166,0.15)",border:"1px solid rgba(20,184,166,0.3)",marginBottom:"24px"}}>
          <span style={{color:"#14b8a6",fontSize:"12px",fontWeight:"700"}}>🇳🇬 Built for Nigerian Healthcare Businesses</span>
        </div>
        <h1 style={{fontSize:"clamp(28px,5vw,52px)",fontWeight:"900",color:"white",margin:"0 0 16px",lineHeight:"1.15"}}>One Platform.<br/><span style={{color:"#14b8a6"}}>Every Healthcare Business.</span></h1>
        <p style={{fontSize:"17px",color:"rgba(255,255,255,0.65)",maxWidth:"540px",margin:"0 auto 36px",lineHeight:"1.7"}}>CareHub gives pharmacies, clinics, spas, dental practices, and wellness centers everything they need -- plus gets them discovered by patients searching nearby.</p>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap",marginBottom:"48px"}}>
          <button onClick={onRegister} style={{padding:"14px 36px",borderRadius:"14px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"16px",cursor:"pointer"}}>Start Free Today →</button>
          <button onClick={onLogin} style={{padding:"14px 36px",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"white",fontWeight:"700",fontSize:"16px",cursor:"pointer"}}>Sign In</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",gap:"10px"}}>
          {BUSINESS_TYPES.map(b=>(
            <div key={b.id} style={{padding:"8px 16px",borderRadius:"10px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",gap:"6px"}}>
              <span>{b.icon}</span><span style={{color:"rgba(255,255,255,0.8)",fontSize:"13px",fontWeight:"600"}}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CareFind banner */}
      <div style={{padding:"48px 32px",background:"#f0fdfa",borderBottom:"1px solid #ccfbf1"}}>
        <div style={{maxWidth:"860px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"40px",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"13px",fontWeight:"700",color:TEALC,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px"}}>Coming Soon -- CareFind</div>
            <div style={{fontSize:"28px",fontWeight:"900",color:"#0f172a",marginBottom:"12px"}}>Get discovered by patients searching for your products</div>
            <div style={{fontSize:"14px",color:"#555",lineHeight:"1.8",marginBottom:"20px"}}>When you add products to your CareHub inventory, they automatically appear on CareFind -- a public search platform where patients search for medicines, services, and healthcare businesses near them.</div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {[["search","Patient searches Amoxicillin 500mg"],["pin","CareFind shows pharmacies near them with it in stock"],["chat","Patient taps WhatsApp to contact your pharmacy directly"],["check","Your stock updates automatically when you make a sale"]].map(([i,t])=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"13px",color:"#555"}}>
                  <span style={{fontSize:"18px",marginRight:"4px"}}>{"search"===i?"🔍":"pin"===i?"📍":"chat"===i?"💬":"✅"}</span>{t}
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"white",borderRadius:"20px",padding:"24px",border:"1px solid #ccfbf1",boxShadow:"0 4px 20px rgba(15,118,110,0.1)"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:TEALC,marginBottom:"16px"}}>🔍 CareFind -- Patient View</div>
            <input readOnly value="Amoxicillin 500mg" style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",marginBottom:"12px",boxSizing:"border-box"}}/>
            {[
              {name:"HealthPlus Pharmacy, Ikeja",dist:"0.8 km",stock:"In Stock",price:"₦1,500"},
              {name:"CarePoint Pharmacy, Surulere",dist:"2.1 km",stock:"In Stock",price:"₦1,400"},
              {name:"MedPlus, Yaba",dist:"3.5 km",stock:"Out of Stock",price:"₦1,600"},
            ].map((r,i)=>(
              <div key={i} style={{padding:"12px",borderRadius:"12px",border:"1px solid #f0f0f0",marginBottom:"8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:"700",fontSize:"13px",color:"#0f172a"}}>{r.name}</div>
                  <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>📍 {r.dist} · {r.price}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"4px"}}>
                  <span style={{fontSize:"11px",fontWeight:"700",padding:"2px 8px",borderRadius:"8px",background:r.stock==="In Stock"?"#f0fdf4":"#fef2f2",color:r.stock==="In Stock"?"#059669":"#dc2626"}}>{r.stock}</span>
                  {r.stock==="In Stock"&&<span style={{fontSize:"11px",color:"#25D366",fontWeight:"700"}}>💬 WhatsApp</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:"72px 32px"}}>
        <div style={{textAlign:"center",marginBottom:"48px"}}>
          <div style={{fontSize:"13px",fontWeight:"700",color:TEALC,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px"}}>Features</div>
          <div style={{fontSize:"32px",fontWeight:"900",color:"#0f172a"}}>Everything your business needs</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"20px",maxWidth:"1000px",margin:"0 auto"}}>
          {features.map(f=>(
            <div key={f.title} style={{padding:"24px",background:"white",borderRadius:"16px",border:"1px solid #f0f0f0"}}>
              <div style={{fontSize:"28px",marginBottom:"10px"}}>{f.icon}</div>
              <div style={{fontWeight:"800",fontSize:"15px",marginBottom:"6px",color:"#0f172a"}}>{f.title}</div>
              <div style={{fontSize:"13px",color:"#888",lineHeight:"1.6"}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"72px 32px",background:"#0f172a"}}>
        <div style={{textAlign:"center",marginBottom:"48px"}}><div style={{fontSize:"13px",fontWeight:"700",color:"#14b8a6",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"1px"}}>Testimonials</div><div style={{fontSize:"32px",fontWeight:"900",color:"white"}}>Trusted by healthcare businesses across Nigeria</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"20px",maxWidth:"900px",margin:"0 auto"}}>
          {[{name:"Amara Okonkwo",biz:"Four Sisters Aesthetic Spa, Lagos",text:"CareHub transformed how we run our spa. Consultations, inventory, and POS all in one place."},{name:"Chidinma Eze",biz:"HealthPlus Pharmacy, Ikeja",text:"As a pharmacist, the consultation module is exactly what we needed. Patient records and dispensing -- all seamless."},{name:"Dr. Fatima Bello",biz:"Lagos City Clinic",text:"The hospital workflow is outstanding. No duplicate data entry between departments."}].map(t=>(
            <div key={t.name} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"16px",padding:"24px"}}>
              <div style={{display:"flex",gap:"2px",marginBottom:"12px"}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:"#fbbf24",fontSize:"16px"}}>★</span>)}</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.8)",lineHeight:"1.7",marginBottom:"16px"}}>"{t.text}"</div>
              <div style={{fontWeight:"700",color:"white",fontSize:"13px"}}>{t.name}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",marginTop:"2px"}}>{t.biz}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"72px 32px",backgroundImage:TEAL,textAlign:"center"}}>
        <div style={{fontSize:"34px",fontWeight:"900",color:"white",marginBottom:"12px"}}>Ready to transform your practice?</div>
        <div style={{fontSize:"16px",color:"rgba(255,255,255,0.8)",marginBottom:"32px"}}>Join healthcare businesses already using CareHub</div>
        <button onClick={onRegister} style={{padding:"16px 48px",borderRadius:"14px",border:"none",background:"white",color:TEALC,fontWeight:"900",fontSize:"16px",cursor:"pointer"}}>Get Started Free →</button>
      </div>

      <div style={{padding:"28px 32px",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"28px",height:"28px",borderRadius:"8px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🏥</div><span style={{color:"white",fontWeight:"800"}}>CareHub</span></div>
        <div style={{fontSize:"12px",color:"rgba(255,255,255,0.3)"}}>© 2025 CareHub Nigeria · Built for Nigerian Healthcare</div>
        <button onClick={onLogin} style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"7px 16px",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:"12px"}}>Sign In</button>
      </div>
    </div>
  );
}

// LOGIN
function LoginScreen({ brands, onAdminLogin, onBrandLogin, onRegister, onHome }) {
  const [email,setEmail]=useState("");const [pass,setPass]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);const [show,setShow]=useState(false);
  const login=async ()=>{
    if(!email||!pass){setErr("Please enter your email and password.");return;}
    setLoading(true);setErr("");
    try {
      // Check super admin first
      if(email.toLowerCase()===ADMIN_EMAIL&&pass===ADMIN_PASS){onAdminLogin();setLoading(false);return;}
      // Check real database
      const b = await dbLoginBusiness(email.toLowerCase(), pass);
      if(b){
        if(b.status==="pending"){setErr("Your account is pending admin approval. You will be notified once approved.");setLoading(false);return;}
        if(b.status==="suspended"){setErr("Your account has been suspended. Please contact support@carehub.ng");setLoading(false);return;}
        onBrandLogin(b);setLoading(false);return;
      }
      setErr("Incorrect email or password. Please try again.");
    } catch(e) {
      setErr("Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9fafb",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <button onClick={onHome} style={{background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:"13px",marginBottom:"16px",display:"inline-flex",alignItems:"center",gap:"6px"}}>← Back to Home</button>
          <div style={{width:"52px",height:"52px",borderRadius:"16px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",margin:"0 auto 12px"}}>🏥</div>
          <div style={{fontSize:"26px",fontWeight:"900",color:"#0f172a"}}>CareHub</div>
          <div style={{fontSize:"13px",color:"#aaa",marginTop:"4px"}}>Sign in to your workspace</div>
        </div>
        <Card style={{padding:"28px"}}>
          {err&&<div style={{padding:"12px 14px",borderRadius:"10px",background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:"13px",marginBottom:"16px",lineHeight:"1.5"}}>⚠️ {err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <Inp label="Email Address" value={email} onChange={setEmail} type="email" placeholder="your@email.com" required/>
            <div>
              <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>Password <span style={{color:"#ef4444"}}>*</span></div>
              <div style={{position:"relative"}}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type={show?"text":"password"} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{width:"100%",padding:"9px 44px 9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
                <button onClick={()=>setShow(!show)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#aaa"}}>{show?"Hide":"Show"}</button>
              </div>
            </div>
            <TealBtn onClick={login} style={{padding:"13px",fontSize:"15px",fontWeight:"900",opacity:loading?0.7:1}}>{loading?"Signing in…":"Sign In"}</TealBtn>
          </div>
        </Card>
        <div style={{textAlign:"center",marginTop:"20px"}}>
          <div style={{fontSize:"13px",color:"#888",marginBottom:"10px"}}>Don't have an account?</div>
          <button onClick={onRegister} style={{width:"100%",padding:"13px",borderRadius:"12px",border:"2px solid #0f766e",background:"transparent",color:"#0f766e",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>✍️ Register Your Business -- Free</button>
        </div>
      </div>
    </div>
  );
}

// REGISTRATION
function Registration({ onBack, onSubmitted }) {
  const [step,setStep]=useState(0);const [done,setDone]=useState(false);const [data,setData]=useState({});
  const STEPS=["Business Info","Contact & Location","Owner Info","Account","Review"];
  const inp=(label,key,type="text",ph="",req=false)=><Inp label={label} value={data[key]} onChange={v=>setData({...data,[key]:v})} type={type} placeholder={ph} required={req}/>;
  const sel=(label,key,options)=><Sel label={label} value={data[key]} onChange={v=>setData({...data,[key]:v})} options={options}/>;
  const canNext=()=>{
    if(step===1)return data.businessName&&data.state&&data.address&&data.phone&&data.businessEmail;
    if(step===2)return data.whatsapp&&data.businessHours;
    if(step===3)return data.firstName&&data.lastName&&data.ownerEmail&&data.ownerPhone;
    if(step===4)return data.password&&data.password===data.confirmPassword&&data.password.length>=6&&data.agreedTerms;
    return true;
  };
  if(done)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9fafb",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <Card style={{maxWidth:"440px",width:"100%",padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:"60px",marginBottom:"16px"}}>⏳</div>
        <div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Registration Submitted!</div>
        <div style={{fontSize:"14px",color:"#888",lineHeight:"1.8",marginBottom:"24px"}}>Thank you <strong>{data.firstName}</strong>! Your business <strong>{data.businessName}</strong> has been submitted. Admin will review within 24 hours.</div>
        <div style={{background:"#f0fdfa",borderRadius:"12px",padding:"16px",marginBottom:"24px",textAlign:"left"}}>
          {[["done","Registration submitted"],["pending","Admin review in progress"],["wait","You receive approval notification"],["wait2","Dashboard unlocked -- products visible on CareFind"]].map(([i,l])=>(
            <div key={l} style={{display:"flex",gap:"10px",marginBottom:"8px",fontSize:"13px",color:i==="done"?"#059669":i==="pending"?"#d97706":"#bbb"}}><span>{"done"===i?"✅":"pending"===i?"⏳":"⬜"}</span><span>{l}</span></div>
          ))}
        </div>
        <DarkBtn onClick={onBack} style={{width:"100%",padding:"13px"}}>Back to Login</DarkBtn>
      </Card>
    </div>
  );
  if(step===0)return(
    <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif",padding:"32px 20px"}}>
      <div style={{maxWidth:"680px",margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:"13px",marginBottom:"24px",display:"flex",alignItems:"center",gap:"6px"}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"14px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",margin:"0 auto 12px"}}>🏥</div>
          <div style={{fontSize:"26px",fontWeight:"900",color:"#0f172a"}}>What type of business are you?</div>
          <div style={{fontSize:"14px",color:"#888",marginTop:"8px"}}>Your consultation forms and features will be tailored to your selection</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"14px"}}>
          {BUSINESS_TYPES.map(b=>(
            <button key={b.id} onClick={()=>{setData({...data,businessType:b.id});setStep(1);}}
              style={{padding:"20px",borderRadius:"16px",border:"2px solid #f0f0f0",background:"white",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:"28px",marginBottom:"8px"}}>{b.icon}</div>
              <div style={{fontWeight:"800",fontSize:"14px",color:"#0f172a",marginBottom:"4px"}}>{b.name}</div>
              <div style={{fontSize:"12px",color:"#888",lineHeight:"1.5"}}>{b.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  return(
    <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif",padding:"24px 20px"}}>
      <div style={{maxWidth:"540px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <button onClick={()=>setStep(s=>s-1)} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>Register {businessIcon(data.businessType)} {businessName(data.businessType)}</div><div style={{fontSize:"12px",color:"#aaa"}}>Step {step} of {STEPS.length} -- {STEPS[step-1]}</div></div>
        </div>
        <div style={{height:"6px",background:"#e5e7eb",borderRadius:"3px",overflow:"hidden",marginBottom:"24px"}}><div style={{height:"100%",width:((step/STEPS.length)*100)+"%",background:TEAL,borderRadius:"3px",transition:"width 0.4s"}}/></div>
        <Card style={{padding:"24px",marginBottom:"16px"}}>
          {step===1&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{fontSize:"17px",fontWeight:"800",color:"#0f172a"}}>Business Information</div>
            {inp("Business Name","businessName","text","e.g. HealthPlus Pharmacy Ikeja",true)}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>{sel("State","state",NIG_STATES)}{inp("City / Area","city","text","e.g. Ikeja")}</div>
            {inp("Full Business Address","address","text","Street, area, city",true)}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>{inp("Business Phone","phone","text","08012345678",true)}{inp("Business Email","businessEmail","email","info@yourbiz.ng",true)}</div>
            {inp("Website or Instagram (optional)","website","text","@yourbusiness")}
          </div>}
          {step===2&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{fontSize:"17px",fontWeight:"800",color:"#0f172a"}}>Contact & Location for CareFind</div>
            <div style={{padding:"12px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,lineHeight:"1.6"}}>
              🔍 This information will be shown to patients who find your business on CareFind -- the public search platform connected to CareHub.
            </div>
            {inp("WhatsApp Number","whatsapp","text","e.g. 08012345678",true)}
            <div style={{fontSize:"11px",color:"#888",marginTop:"-8px"}}>Patients will tap this to contact you directly on WhatsApp</div>
            {inp("Business Hours","businessHours","text","e.g. Mon-Sat 8am-8pm, Sun 10am-4pm",true)}
            {inp("Google Maps Link (optional)","mapsLink","text","Paste your Google Maps link here")}
            <div>
              <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>GPS Coordinates (optional)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {inp("Latitude","lat","text","e.g. 6.4474")}
                {inp("Longitude","lng","text","e.g. 3.4359")}
              </div>
              <div style={{fontSize:"11px",color:"#888",marginTop:"6px"}}>Go to Google Maps → long press your location → copy the coordinates</div>
            </div>
            <div>
              <Toggle label="List my business on CareFind" desc="Allow patients to find your business and products through the public CareFind search platform" value={data.visibleOnCareFind!==false} onChange={v=>setData({...data,visibleOnCareFind:v})}/>
            </div>
          </div>}
          {step===3&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{fontSize:"17px",fontWeight:"800",color:"#0f172a"}}>Owner / Administrator</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>{inp("First Name","firstName","text","Chidinma",true)}{inp("Last Name","lastName","text","Eze",true)}</div>
            {inp("Your Email (used to log in)","ownerEmail","email","chidinma@gmail.com",true)}
            {inp("Your Phone","ownerPhone","text","08099887766",true)}
            {sel("Years in Business","yearsInBusiness",["Less than 1 year","1-2 years","3-5 years","More than 5 years"])}
            {sel("Number of Staff","staffCount",["Just me (solo)","2-5 staff","6-10 staff","More than 10"])}
          </div>}
          {step===4&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{fontSize:"17px",fontWeight:"800",color:"#0f172a"}}>Create Your Password</div>
            <div style={{padding:"12px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1"}}><div style={{fontSize:"11px",color:"#888"}}>Login email:</div><div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a",marginTop:"2px"}}>{data.ownerEmail||"--"}</div></div>
            {inp("Password","password","password","Create a strong password",true)}
            {inp("Confirm Password","confirmPassword","password","Repeat your password",true)}
            {data.password&&data.confirmPassword&&<div style={{fontSize:"12px",fontWeight:"700",color:data.password===data.confirmPassword?"#059669":"#ef4444"}}>{data.password===data.confirmPassword?"✓ Passwords match":"✕ Passwords do not match"}</div>}
            <div style={{padding:"14px",borderRadius:"12px",background:"#f0fdfa",border:"1px solid #ccfbf1",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:"800",color:"#0f172a"}}>CareHub Full Access</div><div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>All features + CareFind listing</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:"20px",fontWeight:"900",color:TEALC}}>Free</div><div style={{fontSize:"11px",color:"#bbb"}}>for now</div></div>
            </div>
            <label style={{display:"flex",gap:"10px",cursor:"pointer",alignItems:"flex-start"}}>
              <input type="checkbox" checked={data.agreedTerms||false} onChange={e=>setData({...data,agreedTerms:e.target.checked})} style={{marginTop:"2px",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#555",lineHeight:"1.6"}}>I agree to the Terms of Service and Privacy Policy. I understand my account requires admin approval before I can access it.</span>
            </label>
          </div>}
          {step===5&&<div>
            <div style={{fontSize:"17px",fontWeight:"800",color:"#0f172a",marginBottom:"16px"}}>Review & Submit</div>
            <div style={{borderRadius:"12px",overflow:"hidden",border:"1px solid #f0f0f0"}}>
              {[["Business Type",businessIcon(data.businessType)+" "+businessName(data.businessType)],["Business Name",data.businessName],["State",data.state],["Business Email",data.businessEmail],["WhatsApp",data.whatsapp],["Business Hours",data.businessHours],["Owner Name",((data.firstName||"")+" "+(data.lastName||"")).trim()],["Login Email",data.ownerEmail],["CareFind Listing",data.visibleOnCareFind===false?"No":"Yes"]].filter(([,v])=>v).map(([l,v],i)=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:i%2===0?"#fafafa":"white",fontSize:"13px"}}>
                  <span style={{color:"#888",fontWeight:"600"}}>{l}</span><span style={{color:"#0f172a"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:"16px",padding:"14px",borderRadius:"12px",background:"#fffbeb",border:"1px solid #fcd34d",fontSize:"13px",color:"#92400e",lineHeight:"1.7"}}>⏳ After submitting, admin will review and approve your account within 24 hours.</div>
          </div>}
        </Card>
        <div style={{display:"flex",gap:"10px"}}>
          {step>1&&<GhostBtn onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"13px"}}>← Back</GhostBtn>}
          {step<5
            ?<button onClick={()=>setStep(s=>s+1)} disabled={!canNext()} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:canNext()?TEAL:"#e5e7eb",color:canNext()?"white":"#bbb",fontWeight:"800",fontSize:"14px",cursor:canNext()?"pointer":"not-allowed"}}>Continue →</button>
            :<button onClick={async ()=>{
              try {
                await dbRegisterBusiness({
                  name: data.businessName,
                  owner: ((data.firstName||"")+" "+(data.lastName||"")).trim(),
                  email: data.ownerEmail,
                  password: data.password,
                  phone: data.ownerPhone||"",
                  whatsapp: data.whatsapp||"",
                  address: data.address||"",
                  state: data.state||"",
                  city: data.city||"",
                  business_type: data.businessType||"skincare",
                  hours: data.businessHours||"",
                  maps_link: data.mapsLink||"",
                  lat: parseFloat(data.lat)||0,
                  lng: parseFloat(data.lng)||0,
                  website: data.website||"",
                  status: "pending",
                  visible_on_carefind: data.visibleOnCareFind!==false
                });
                onSubmitted&&onSubmitted(data);
                setDone(true);
              } catch(e) {
                alert("Registration failed. This email may already be registered. Please check and try again.");
              }
            }} style={{flex:1,padding:"13px",borderRadius:"12px",border:"none",background:DARK,color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>Submit Registration →</button>}
        </div>
      </div>
    </div>
  );
}

// ADMIN DASHBOARD
function AdminDashboard({ onLogout }) {
  const [brands,setBrands]=useState([]);const [team,setTeam]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("brands");const [sel,setSel]=useState(null);const [showInv,setShowInv]=useState(false);const [inv,setInv]=useState({name:"",email:"",role:"Support Agent"});const [toast,setToast]=useState("");

  // Load data from Supabase on mount
  useEffect(()=>{
    loadAll();
    // Auto refresh every 30 seconds to catch new registrations
    const interval = setInterval(loadAll, 30000);
    return ()=>clearInterval(interval);
  },[]);

  async function loadAll() {
    try {
      const [b, t] = await Promise.all([dbGetBusinesses(), dbGetTeam()]);
      setBrands(b||[]);
      setTeam(t||[]);
    } catch(e) {
      console.error("Load error:", e);
    }
    setLoading(false);
  }

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const updStatus=async (id,status,msg)=>{
    try {
      await dbUpdateStatus(id, status);
      setBrands(b=>b.map(x=>x.id===id?{...x,status}:x));
      setSel(null);
      showToast(msg);
    } catch(e) {
      showToast("Error updating status. Please try again.");
    }
  };
  const pending=brands.filter(b=>b.status==="pending");const active=brands.filter(b=>b.status==="active");
  const sPill=s=>{if(s==="active")return<Pill label="Active" type="green"/>;if(s==="pending")return<Pill label="Pending" type="amber"/>;if(s==="suspended")return<Pill label="Suspended" type="red"/>;return<Pill label={s}/>;};
  const NAVS=[["brands","🏥","All Businesses"],["team","👥","My Team"],["analytics","📊","Analytics"],["settings","⚙️","Settings"]];
  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"220px",flexShrink:0,backgroundImage:DARK,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:"36px",height:"36px",borderRadius:"10px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>🏥</div><div><div style={{color:"white",fontWeight:"800",fontSize:"14px"}}>CareHub</div><div style={{color:"#14b8a6",fontSize:"11px"}}>Super Admin</div></div></div>
        </div>
        <nav style={{flex:1,padding:"10px"}}>
          {NAVS.map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"13px",marginBottom:"2px",textAlign:"left",background:tab===id?"rgba(20,184,166,0.15)":"transparent",color:tab===id?"#14b8a6":"rgba(255,255,255,0.55)"}}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        {pending.length>0&&<div style={{margin:"0 10px 10px",padding:"10px 12px",borderRadius:"10px",background:"rgba(20,184,166,0.1)",border:"1px solid rgba(20,184,166,0.2)"}}><div style={{fontSize:"12px",fontWeight:"700",color:"#14b8a6"}}>🔔 {pending.length} awaiting approval</div></div>}
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}><div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>admin@carehub.ng</div><button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.35)",fontSize:"12px"}}>→ Sign Out</button></div>
      </div>
      <div style={{flex:1,background:"#f9fafb",overflowY:"auto",padding:"28px 32px"}}>
        {tab==="brands"&&<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
            <div><div style={{fontSize:"20px",fontWeight:"900",color:"#111"}}>Business Management</div><div style={{fontSize:"13px",color:"#888",marginTop:"3px"}}>Approve and manage all registered healthcare businesses</div></div>
            <button onClick={loadAll} style={{padding:"8px 16px",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:TEALC,fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>🔄 Refresh</button>
          </div>
          {loading&&<div style={{textAlign:"center",padding:"40px",color:"#aaa"}}><div style={{fontSize:"32px",marginBottom:"8px"}}>⏳</div>Loading...</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"24px"}}>
            <StatCard icon="🏥" label="Total Businesses" value={brands.length}/>
            <StatCard icon="⏳" label="Pending Approval" value={pending.length} alert={pending.length>0}/>
            <StatCard icon="✅" label="Active" value={active.length}/>
            <StatCard icon="🔍" label="On CareFind" value={brands.filter(b=>(b.visible_on_carefind||b.visibleOnCareFind)&&b.status==="active").length} sub="Publicly listed"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"10px",marginBottom:"20px"}}>
            {BUSINESS_TYPES.map(b=>(
              <Card key={b.id} style={{padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:"22px",marginBottom:"4px"}}>{b.icon}</div>
                <div style={{fontSize:"20px",fontWeight:"900",color:"#0f172a"}}>{brands.filter(x=>x.type===b.id).length}</div>
                <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>{b.name.split("/")[0].trim()}</div>
              </Card>
            ))}
          </div>
          {pending.length>0&&<div style={{marginBottom:"20px",padding:"14px 18px",borderRadius:"14px",background:"#fffbeb",border:"1px solid #fcd34d",display:"flex",alignItems:"flex-start",gap:"12px"}}>
            <span style={{fontSize:"20px"}}>🔔</span>
            <div><div style={{fontWeight:"700",color:"#92400e",fontSize:"14px"}}>{pending.length} business{pending.length>1?"es":""} waiting for your approval!</div><div style={{fontSize:"12px",color:"#b45309",marginTop:"4px"}}>{pending.map(b=>businessIcon((b.business_type||(b.business_type||b.type)))+" "+b.name).join(" · ")}</div></div>
          </div>}
          <Card>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Business","Type","Owner","WhatsApp","CareFind","Status","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{brands.map(b=>(
                  <tr key={b.id} style={{borderBottom:"1px solid #f9f9f9",background:b.status==="pending"?"#fffdf5":"white"}}>
                    <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:"34px",height:"34px",borderRadius:"10px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>{businessIcon((b.business_type||(b.business_type||b.type)))}</div><span style={{fontWeight:"700",fontSize:"13px"}}>{b.name}</span></div></td>
                    <td style={{padding:"12px 16px"}}><Pill label={businessName((b.business_type||(b.business_type||b.type))).split("/")[0].trim()} type="teal"/></td>
                    <td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{b.owner}</td>
                    <td style={{padding:"12px 16px",fontSize:"12px",color:"#25D366",fontWeight:"600"}}>{b.whatsapp?"💬 "+b.whatsapp:"--"}</td>
                    <td style={{padding:"12px 16px"}}>{(b.visible_on_carefind||b.visibleOnCareFind)?<Pill label="Listed" type="green"/>:<Pill label="Hidden"/>}</td>
                    <td style={{padding:"12px 16px"}}>{sPill(b.status)}</td>
                    <td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                      <GhostBtn onClick={()=>setSel(b)}>View</GhostBtn>
                      {b.status==="pending"&&<button onClick={()=>updStatus(b.id,"active","Approved!")} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>✓ Approve</button>}
                      {b.status==="active"&&<button onClick={()=>updStatus(b.id,"suspended","Suspended.")} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Suspend</button>}
                      {b.status==="suspended"&&<button onClick={()=>updStatus(b.id,"active","Reactivated!")} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Reactivate</button>}
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </>}
        {tab==="team"&&<>
          <SectionHead title="My Team" sub="Invite and manage your CareHub admin team" btn="+ Invite Team Member" onBtn={()=>setShowInv(true)}/>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {team.map(m=>(
              <Card key={m.id} style={{padding:"18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                  <Avatar name={m.name} size={44} bg="linear-gradient(135deg,#8b5cf6,#a78bfa)"/>
                  <div><div style={{fontWeight:"800",fontSize:"15px"}}>{m.name}</div><div style={{fontSize:"13px",color:"#888",marginTop:"2px"}}>{m.role} · {m.email}</div><div style={{fontSize:"11px",color:"#bbb",marginTop:"2px"}}>Joined: {m.joined}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <Pill label={m.status} type={m.status==="active"?"green":"amber"}/>
                  <button onClick={async ()=>{try{await dbRemoveTeam(m.id);setTeam(prev=>prev.filter(x=>x.id!==m.id));showToast("Team member removed.");}catch(e){showToast("Error removing member.");}}} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Remove</button>
                </div>
              </Card>
            ))}
          </div>
        </>}
        {tab==="analytics"&&<>
          <SectionHead title="Platform Analytics"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
            <Card style={{padding:"24px"}}>
              <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"16px"}}>Businesses by Type</div>
              {BUSINESS_TYPES.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <span style={{fontSize:"16px",width:"24px"}}>{b.icon}</span>
                  <div style={{flex:1,height:"8px",background:"#f0f0f0",borderRadius:"4px",overflow:"hidden"}}><div style={{height:"100%",width:((brands.filter(x=>x.type===b.id).length/Math.max(brands.length,1))*100)+"%",background:TEAL,borderRadius:"4px"}}/></div>
                  <span style={{fontSize:"12px",color:"#555",width:"20px",textAlign:"right",fontWeight:"700"}}>{brands.filter(x=>x.type===b.id).length}</span>
                </div>
              ))}
            </Card>
            <Card style={{padding:"24px"}}>
              <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"16px"}}>Status & CareFind</div>
              {[["Active on CareHub",active.length,"#059669"],["Listed on CareFind",brands.filter(b=>(b.visible_on_carefind||b.visibleOnCareFind)&&b.status==="active").length,"#0f766e"],["Pending Approval",pending.length,"#d97706"],["Suspended",brands.filter(b=>b.status==="suspended").length,"#dc2626"]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px",borderRadius:"10px",background:"#fafafa",marginBottom:"8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"10px",height:"10px",borderRadius:"50%",background:c}}/><span style={{fontSize:"13px",color:"#555"}}>{l}</span></div>
                  <span style={{fontSize:"20px",fontWeight:"900"}}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </>}
        {tab==="settings"&&<>
          <SectionHead title="Admin Settings"/>
          <Card style={{padding:"28px",maxWidth:"480px"}}>
            {[["Platform Name","CareHub"],["Admin Email","admin@carehub.ng"],["Support Email","support@carehub.ng"],["CareFind Platform URL","carefind.ng (coming soon)"]].map(([l,v])=>(
              <div key={l} style={{marginBottom:"16px"}}><div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{l}</div><input defaultValue={v} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div>
            ))}
            <TealBtn style={{width:"100%",padding:"12px"}}>Save Changes</TealBtn>
          </Card>
        </>}
      </div>
      {sel && (
        <Modal show={true} onClose={()=>setSel(null)} title="Business Details"
          footer={
            <div style={{display:"flex",gap:"10px",width:"100%"}}>
              {sel.status==="pending" && <>
                <button onClick={()=>updStatus(sel.id,"active","Approved!")} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#059669",color:"white",fontWeight:"700",cursor:"pointer"}}>Approve</button>
                <button onClick={()=>updStatus(sel.id,"rejected","Rejected.")} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#fef2f2",color:"#dc2626",fontWeight:"700",cursor:"pointer"}}>Reject</button>
              </>}
              {sel.status==="active" && <button onClick={()=>updStatus(sel.id,"suspended","Suspended.")} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#fffbeb",color:"#d97706",fontWeight:"700",cursor:"pointer"}}>Suspend</button>}
              {sel.status==="suspended" && <button onClick={()=>updStatus(sel.id,"active","Reactivated!")} style={{flex:1,padding:"11px",borderRadius:"12px",border:"none",background:"#059669",color:"white",fontWeight:"700",cursor:"pointer"}}>Reactivate</button>}
            </div>
          }>
          <div>
            {[["Business",sel.name],["Type",businessIcon(sel.type)+" "+businessName(sel.type)],["Owner",sel.owner],["Email",sel.email],["Phone",sel.phone],["WhatsApp",sel.whatsapp||"Not set"],["Address",sel.address],["State",sel.state],["Hours",sel.hours||"Not set"],["CareFind",(sel.visible_on_carefind||sel.visibleOnCareFind)?"Listed":"Hidden"],["Registered",sel.date]].map(function(item){
              return <div key={item[0]} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f9f9f9",fontSize:"13px"}}><span style={{color:"#888",fontWeight:"600"}}>{item[0]}</span><span style={{color:"#0f172a",textAlign:"right",maxWidth:"240px"}}>{item[1]}</span></div>;
            })}
          </div>
        </Modal>
      )}
      <Modal show={showInv} onClose={()=>setShowInv(false)} title="Invite Team Member"
        footer={<><GhostBtn onClick={()=>setShowInv(false)} style={{flex:1,padding:"12px"}}>Cancel</GhostBtn><TealBtn onClick={async ()=>{if(inv.name&&inv.email){try{await dbInviteTeam({name:inv.name,role:inv.role,email:inv.email,status:"invited"});const t=await dbGetTeam();setTeam(t||[]);setInv({name:"",email:"",role:"Support Agent"});setShowInv(false);showToast("Invite sent!");}catch(e){showToast("Error. Email may already exist.");}}}  } style={{flex:1,padding:"12px"}}>Send Invite</TealBtn></>}>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <Inp label="Full Name" value={inv.name} onChange={v=>setInv({...inv,name:v})} placeholder="e.g. Sade Williams" required/>
          <Inp label="Email Address" value={inv.email} onChange={v=>setInv({...inv,email:v})} type="email" placeholder="sade@carehub.ng" required/>
          <Sel label="Role" value={inv.role} onChange={v=>setInv({...inv,role:v})} options={["Support Agent","Brand Manager","Finance Officer","Technical Support","Content Manager"]}/>
          <div style={{padding:"12px",borderRadius:"10px",background:"#f0fdfa",fontSize:"12px",color:TEALC,lineHeight:"1.6"}}>📧 They will receive an invite link to set their password and join the admin team.</div>
        </div>
      </Modal>
      <Toast msg={toast}/>
    </div>
  );
}

// INVENTORY WITH CAREFIND UPGRADES
function AddProductModal({ existing, onClose, products, setProducts, showToast, brandName }) {
  const [f,setF]=useState(existing||{name:"",genericName:"",cat:"Medicines",price:"",stock:"",emoji:"💊",listOnCareFind:true});
  const emojis=["💊","🧴","☀️","🫧","✨","💆","💎","🩺","🩸","🧤","📦","🌿","🔧","💉","🩹"];
  const canSave=f.name&&f.price&&(f.cat==="Services"||f.stock!=="");
  return(
    <Modal show title={existing?"Edit Product":"Add New Product"} onClose={onClose}
      footer={<><GhostBtn onClick={onClose} style={{flex:1,padding:"12px"}}>Cancel</GhostBtn><TealBtn onClick={()=>{if(!canSave)return;const np={...f,id:existing?f.id:Math.max(...products.map(p=>p.id),0)+1,price:Number(f.price),stock:f.cat==="Services"?999:Number(f.stock)||0};if(existing){setProducts(prev=>prev.map(p=>p.id===np.id?np:p));}else{setProducts(prev=>[...prev,np]);}showToast("Saved!");onClose();}} style={{flex:1,padding:"12px"}}>✓ {existing?"Save Changes":"Add Product"}</TealBtn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <div><div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Icon</div><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{emojis.map(e=><button key={e} onClick={()=>setF({...f,emoji:e})} style={{width:"36px",height:"36px",borderRadius:"10px",border:f.emoji===e?"2px solid #0f766e":"1px solid #e5e7eb",background:f.emoji===e?"#f0fdfa":"#f9fafb",cursor:"pointer",fontSize:"18px"}}>{e}</button>)}</div></div>
        <Inp label="Product / Service Name *" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="e.g. Amoxicillin 500mg"/>
        <Inp label="Generic / Common Name" value={f.genericName} onChange={v=>setF({...f,genericName:v})} placeholder="e.g. Amoxicillin (helps patients find it by generic name)"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Sel label="Category" value={f.cat} onChange={v=>setF({...f,cat:v})} options={["Medicines","Skincare","Cosmetics","Services","Consumables","Equipment","Tools"]}/>
          <Inp label="Selling Price (₦) *" value={f.price} onChange={v=>setF({...f,price:v})} type="number" placeholder="0"/>
        </div>
        {f.cat!=="Services"&&<Inp label="Opening Stock Quantity *" value={f.stock} onChange={v=>setF({...f,stock:v})} type="number" placeholder="e.g. 100"/>}
        <div style={{padding:"14px",borderRadius:"12px",background:"#f0fdfa",border:"1px solid #ccfbf1"}}>
          <Toggle label="List on CareFind" desc="When enabled, this product appears publicly on CareFind so patients can search and find it at your location" value={f.listOnCareFind} onChange={v=>setF({...f,listOnCareFind:v})}/>
          {f.listOnCareFind&&<div style={{marginTop:"10px",padding:"10px",borderRadius:"8px",background:"white",fontSize:"12px",color:"#555",lineHeight:"1.6"}}>
            ✅ Patients searching for <strong>"{f.name||"this product"}"</strong>{f.genericName?" or "+f.genericName+"":" "} will see <strong>{brandName||"your business"}</strong> in their results -- with your WhatsApp contact and location.
          </div>}
        </div>
      </div>
    </Modal>
  );
}

function RestockModal({ product, onClose, setProducts, showToast }) {
  const [qty,setQty]=useState("");const [note,setNote]=useState("");
  return(
    <Modal show title="Restock Product" onClose={onClose}
      footer={<><GhostBtn onClick={onClose} style={{flex:1,padding:"12px"}}>Cancel</GhostBtn><TealBtn onClick={()=>{if(!qty||Number(qty)<=0)return;setProducts(prev=>prev.map(p=>p.id===product.id?{...p,stock:p.stock+Number(qty)}:p));showToast("Stock added!");onClose();}} style={{flex:1,padding:"12px"}}>+ Add Stock</TealBtn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <div style={{padding:"12px",borderRadius:"10px",background:"#f9fafb",display:"flex",justifyContent:"space-between",fontSize:"13px"}}><span style={{color:"#888"}}>Current stock</span><span style={{fontWeight:"700"}}>{product.stock} units</span></div>
        <Inp label="Units to Add *" value={qty} onChange={setQty} type="number" placeholder="e.g. 100"/>
        {qty&&Number(qty)>0&&<div style={{fontSize:"12px",color:"#059669",fontWeight:"700"}}>New total: {product.stock+Number(qty)} units</div>}
        <Inp label="Note (optional)" value={note} onChange={setNote} placeholder="Supplier name, invoice no..."/>
        {product.listOnCareFind&&<div style={{padding:"10px",borderRadius:"8px",background:"#f0fdfa",fontSize:"12px",color:TEALC}}>🔍 After restocking, this product will become available again on CareFind</div>}
      </div>
    </Modal>
  );
}

function InventoryPage({ products, setProducts, brand }) {
  const [showAdd,setShowAdd]=useState(false);const [showRestock,setShowRestock]=useState(null);const [editProd,setEditProd]=useState(null);const [search,setSearch]=useState("");const [catFilter,setCatFilter]=useState("All");const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const cats=["All",...Array.from(new Set(products.map(p=>p.cat)))];
  const filtered=products.filter(p=>(catFilter==="All"||p.cat===catFilter)&&(p.name.toLowerCase().includes(search.toLowerCase())||(p.genericName||"").toLowerCase().includes(search.toLowerCase())));
  const lowStock=products.filter(p=>p.cat!=="Services"&&p.stock>0&&p.stock<=5);
  const outOfStock=products.filter(p=>p.cat!=="Services"&&p.stock<=0);
  const listedOnCareFind=products.filter(p=>p.listOnCareFind&&p.stock>0).length;

  return(
    <div>
      <SectionHead title="Inventory" sub="Manage products, stock and CareFind listings" btn="+ Add Product" onBtn={()=>setShowAdd(true)}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="📦" label="Total Products" value={products.length}/>
        <StatCard icon="⚠️" label="Low Stock" value={lowStock.length} alert={lowStock.length>0} sub={outOfStock.length+" out of stock"}/>
        <StatCard icon="💰" label="Stock Value" value={fmt(products.filter(p=>p.cat!=="Services").reduce((s,p)=>s+p.price*p.stock,0))}/>
        <StatCard icon="🔍" label="On CareFind" value={listedOnCareFind} sub="Products visible to public"/>
      </div>

      {/* CareFind status banner */}
      {brand&&(brand.visible_on_carefind||brand.visibleOnCareFind)&&(
        <div style={{marginBottom:"20px",padding:"14px 18px",borderRadius:"14px",background:"#f0fdfa",border:"1px solid #ccfbf1",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"20px"}}>🔍</span>
            <div>
              <div style={{fontWeight:"700",color:TEALC,fontSize:"14px"}}>Your business is listed on CareFind</div>
              <div style={{fontSize:"12px",color:"#555",marginTop:"2px"}}>{listedOnCareFind} product{listedOnCareFind!==1?"s":""} visible to public · WhatsApp: {brand.whatsapp||"Not set"}</div>
            </div>
          </div>
          <Pill label="Live on CareFind" type="teal"/>
        </div>
      )}

      {lowStock.length>0&&<div style={{marginBottom:"16px",padding:"14px 18px",borderRadius:"14px",background:"#fffbeb",border:"1px solid #fcd34d",display:"flex",alignItems:"flex-start",gap:"12px"}}>
        <span style={{fontSize:"20px"}}>⚠️</span>
        <div><div style={{fontWeight:"700",color:"#92400e",fontSize:"14px"}}>{lowStock.length} item{lowStock.length>1?"s":""} running low</div><div style={{fontSize:"12px",color:"#b45309",marginTop:"4px"}}>{lowStock.map(p=>p.name).join(" · ")}</div></div>
      </div>}

      <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product name or generic name..."
          style={{flex:1,minWidth:"200px",padding:"9px 14px",borderRadius:"12px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",background:"white"}}/>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"8px 14px",borderRadius:"10px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"700",background:catFilter===c?"#0f766e":"#f3f4f6",color:catFilter===c?"white":"#666"}}>{c}</button>)}</div>
      </div>

      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Product","Generic Name","Category","Price","Stock","CareFind","Status","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(p=>{
              const low=p.cat!=="Services"&&p.stock>0&&p.stock<=5;const out=p.cat!=="Services"&&p.stock<=0;
              return(
                <tr key={p.id} style={{borderBottom:"1px solid #f9f9f9",background:out?"#fff5f5":low?"#fffbeb":"white"}}>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"20px"}}>{p.emoji}</span><span style={{fontWeight:"700",fontSize:"13px"}}>{p.name}</span></div></td>
                  <td style={{padding:"12px 16px",fontSize:"12px",color:"#888"}}>{p.genericName||"--"}</td>
                  <td style={{padding:"12px 16px"}}><Pill label={p.cat} type="teal"/></td>
                  <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"700"}}>{fmt(p.price)}</td>
                  <td style={{padding:"12px 16px",fontSize:"14px",fontWeight:"900",color:out?"#ef4444":low?"#f59e0b":"#111"}}>{p.cat==="Services"?"∞":p.stock}</td>
                  <td style={{padding:"12px 16px"}}>
                    <button onClick={()=>setProducts(prev=>prev.map(x=>x.id===p.id?{...x,listOnCareFind:!x.listOnCareFind}:x))}
                      style={{width:"36px",height:"20px",borderRadius:"10px",border:"none",cursor:"pointer",position:"relative",background:p.listOnCareFind?"#0f766e":"#e5e7eb",flexShrink:0}}>
                      <div style={{position:"absolute",top:"2px",left:p.listOnCareFind?"18px":"2px",width:"16px",height:"16px",borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
                    </button>
                  </td>
                  <td style={{padding:"12px 16px"}}>{p.cat==="Services"?<Pill label="Service" type="blue"/>:out?<Pill label="Out of Stock" type="red"/>:low?<Pill label="Low Stock" type="amber"/>:<Pill label="In Stock" type="green"/>}</td>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {p.cat!=="Services"&&<button onClick={()=>setShowRestock(p)} style={{padding:"5px 10px",borderRadius:"8px",border:"none",background:"#059669",color:"white",fontWeight:"700",fontSize:"11px",cursor:"pointer"}}>+Restock</button>}
                    <GhostBtn onClick={()=>setEditProd(p)}>Edit</GhostBtn>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Card>

      {showAdd&&<AddProductModal onClose={()=>setShowAdd(false)} products={products} setProducts={setProducts} showToast={showToast} brandName={brand&&brand.name}/>}
      {editProd&&<AddProductModal existing={editProd} onClose={()=>setEditProd(null)} products={products} setProducts={setProducts} showToast={showToast} brandName={brand&&brand.name}/>}
      {showRestock&&<RestockModal product={showRestock} onClose={()=>setShowRestock(null)} setProducts={setProducts} showToast={showToast}/>}
      <Toast msg={toast}/>
    </div>
  );
}

// PUBLIC PROFILE PAGE
function PublicProfilePage({ brand, products }) {
  const listedProds=products.filter(p=>p.listOnCareFind);
  const waLink="https://wa.me/"+((brand.whatsapp||"").replace(/[^0-9]/g,"")||"");
  return(
    <div>
      <SectionHead title="Public Profile" sub="This is how your business appears on CareFind"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
        <StatCard icon="🔍" label="Products on CareFind" value={listedProds.filter(p=>p.stock>0).length} sub={String(listedProds.filter(p=>p.stock<=0).length)+" out of stock"}/>
        <StatCard icon="👁" label="Profile Status" value={(brand.visible_on_carefind||brand.visibleOnCareFind)?"Live":"Hidden"} sub={(brand.visible_on_carefind||brand.visibleOnCareFind)?"Visible to patients searching nearby":"Not listed on CareFind"}/>
      </div>

      {/* Profile preview */}
      <Card style={{marginBottom:"20px",overflow:"hidden"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:"700",color:"#555"}}>🔍 CareFind Preview -- How patients see your profile</div>
          <Pill label={(brand.visible_on_carefind||brand.visibleOnCareFind)?"Live on CareFind":"Hidden"} type={(brand.visible_on_carefind||brand.visibleOnCareFind)?"green":"gray"}/>
        </div>
        <div style={{padding:"24px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"16px",marginBottom:"20px",flexWrap:"wrap"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"16px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",flexShrink:0}}>{businessIcon((brand.business_type||brand.type))}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"20px",fontWeight:"900",color:"#0f172a"}}>{brand.name}</div>
              <div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>📍 {brand.address}{brand.city?" · "+brand.city:""}</div>
              <div style={{fontSize:"13px",color:"#888",marginTop:"2px"}}>⏰ {brand.hours||"Hours not set"}</div>
              <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
                <a href={waLink} target="_blank" rel="noreferrer"
                  style={{padding:"8px 16px",borderRadius:"10px",background:"#25D366",color:"white",fontWeight:"700",fontSize:"13px",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"6px"}}>
                  💬 WhatsApp
                </a>
                {(brand.maps_link||brand.mapsLink||"")&&<a href={(brand.maps_link||brand.mapsLink||"")} target="_blank" rel="noreferrer"
                  style={{padding:"8px 16px",borderRadius:"10px",border:"1px solid #e5e7eb",color:"#555",fontWeight:"600",fontSize:"13px",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"6px"}}>
                  📍 View on Map
                </a>}
              </div>
            </div>
          </div>

          {/* Listed products */}
          <div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a",marginBottom:"12px"}}>Products & Services ({listedProds.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px"}}>
            {listedProds.map(p=>(
              <div key={p.id} style={{padding:"14px",borderRadius:"12px",border:"1px solid #f0f0f0",background:p.stock<=0?"#fff5f5":"white"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                  <span style={{fontSize:"20px"}}>{p.emoji}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    {p.genericName&&<div style={{fontSize:"10px",color:"#aaa"}}>{p.genericName}</div>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:"13px",fontWeight:"900",color:TEALC}}>{fmt(p.price)}</span>
                  <span style={{fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"6px",background:p.stock<=0?"#fef2f2":p.stock<=5?"#fffbeb":"#f0fdf4",color:p.stock<=0?"#dc2626":p.stock<=5?"#d97706":"#059669"}}>{p.stock<=0?"Out of Stock":p.stock<=5?"Low Stock":"In Stock"}</span>
                </div>
              </div>
            ))}
          </div>
          {listedProds.length===0&&<div style={{textAlign:"center",padding:"32px",color:"#ccc",fontSize:"13px"}}>No products listed on CareFind yet. Enable the CareFind toggle in Inventory.</div>}
        </div>
      </Card>

      {/* Settings */}
      <Card style={{padding:"24px"}}>
        <div style={{fontSize:"15px",fontWeight:"800",marginBottom:"16px"}}>CareFind Settings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
          <Inp label="WhatsApp Number" value={brand.whatsapp||""} onChange={()=>{}} placeholder="e.g. 2348012345678"/>
          <Inp label="Business Hours" value={brand.hours||""} onChange={()=>{}} placeholder="e.g. Mon-Sat 8am-8pm"/>
          <Inp label="Google Maps Link" value={(brand.maps_link||brand.mapsLink||"")||""} onChange={()=>{}} placeholder="Paste Google Maps URL"/>
          <Inp label="GPS Latitude" value={String(brand.lat||"")} onChange={()=>{}} placeholder="e.g. 6.4474"/>
        </div>
        <div style={{marginTop:"16px"}}><Toggle label="Visible on CareFind" desc="Allow patients to find your business on the public CareFind search platform" value={(brand.visible_on_carefind||brand.visibleOnCareFind)||false} onChange={()=>{}}/></div>
        <TealBtn style={{marginTop:"16px",width:"100%",padding:"12px"}}>Save CareFind Settings</TealBtn>
      </Card>
    </div>
  );
}

// POS
function InlinePOS({ products, setProducts }) {
  const [cart,setCart]=useState([]);const [client,setClient]=useState("Walk-in");const [method,setMethod]=useState("Cash");const [cash,setCash]=useState("");const [disc,setDisc]=useState("");const [discPct,setDiscPct]=useState(false);const [filter,setFilter]=useState("All");const [search,setSearch]=useState("");const [receipt,setReceipt]=useState(null);
  const cats=["All",...Array.from(new Set(products.map(p=>p.cat)))];
  const visible=products.filter(p=>(filter==="All"||p.cat===filter)&&(p.name.toLowerCase().includes(search.toLowerCase())||(p.genericName||"").toLowerCase().includes(search.toLowerCase())));
  function add(p){const f=cart.find(c=>c.id===p.id);if(f)setCart(cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c));else setCart([...cart,{...p,qty:1}]);}
  function rmv(id){setCart(cart.filter(c=>c.id!==id));}
  function qty(id,v){const n=parseInt(v)||0;if(n<=0)rmv(id);else setCart(cart.map(c=>c.id===id?{...c,qty:n}:c));}
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);const discAmt=disc?(discPct?Math.round(sub*parseFloat(disc)/100):parseFloat(disc)||0):0;const total=Math.max(0,sub-discAmt);const change=method==="Cash"&&cash?parseFloat(cash)-total:0;
  function charge(){
    if(!cart.length)return;
    const id="TXN"+Math.floor(Math.random()*90000+10000);
    setReceipt({id,client:client||"Walk-in",items:[...cart],subtotal:sub,disc:discAmt,total,method,cashGiven:parseFloat(cash)||0});
    // deduct stock and update CareFind availability automatically
    setProducts(prev=>prev.map(p=>{const s=cart.find(c=>c.id===p.id);return s&&p.cat!=="Services"?{...p,stock:Math.max(0,p.stock-s.qty)}:p;}));
  }
  function newSale(){setReceipt(null);setCart([]);setClient("Walk-in");setDisc("");setCash("");setMethod("Cash");}
  const printR=()=>{if(!receipt)return;const w=window.open("","_blank","width=380,height=650");w.document.write(`<html><head><title>Receipt</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Courier New',monospace}body{padding:24px;max-width:320px;margin:auto}.c{text-align:center}.b{font-weight:bold}hr{border:none;border-top:1px dashed #aaa;margin:10px 0}.r{display:flex;justify-content:space-between;margin:4px 0;font-size:12px}</style></head><body><div class="c"><div class="b" style="font-size:15px">CareHub</div><div style="font-size:11px;color:#666;margin-top:4px">${nowStr()}</div></div><hr><div class="r"><span>Receipt:</span><span>${receipt.id}</span></div><div class="r"><span>Client:</span><span>${receipt.client}</span></div><hr>${receipt.items.map(i=>`<div style="margin-bottom:8px"><div class="b" style="font-size:12px">${i.emoji} ${i.name}</div><div class="r" style="color:#666"><span>${i.qty} x ${fmt(i.price)}</span><span>${fmt(i.price*i.qty)}</span></div></div>`).join("")}<hr><div class="r"><span>Subtotal</span><span>${fmt(receipt.subtotal)}</span></div>${receipt.disc>0?`<div class="r" style="color:green"><span>Discount</span><span>-${fmt(receipt.disc)}</span></div>`:""}<div class="r b" style="font-size:15px"><span>TOTAL</span><span>${fmt(receipt.total)}</span></div><div class="r"><span>Payment</span><span>${receipt.method}</span></div><hr><div class="c" style="font-size:11px;color:#999">Thank you! ✨</div></body></html>`);w.document.close();setTimeout(()=>{w.focus();w.print();},300);};
  if(receipt)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",padding:"20px"}}><Card style={{width:"100%",maxWidth:"360px",overflow:"hidden"}}><div style={{padding:"24px",textAlign:"center",borderBottom:"1px solid #f0f0f0"}}><div style={{fontSize:"48px",marginBottom:"8px"}}>🎉</div><div style={{fontSize:"20px",fontWeight:"900"}}>Sale Complete!</div><div style={{fontSize:"12px",color:"#aaa",marginTop:"4px"}}>#{receipt.id}</div></div><div style={{padding:"20px"}}>{receipt.items.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"8px"}}><span>{it.emoji} {it.name} <span style={{color:"#aaa"}}>×{it.qty}</span></span><span style={{fontWeight:"700"}}>{fmt(it.price*it.qty)}</span></div>)}<div style={{borderTop:"1px dashed #ddd",marginTop:"12px",paddingTop:"12px"}}>{receipt.disc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",color:"#059669",marginBottom:"4px"}}><span>Discount</span><span>−{fmt(receipt.disc)}</span></div>}<div style={{display:"flex",justifyContent:"space-between",fontSize:"22px",fontWeight:"900"}}><span>TOTAL</span><span style={{color:TEALC}}>{fmt(receipt.total)}</span></div>{receipt.method==="Cash"&&receipt.cashGiven>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",fontWeight:"700",color:"#059669",marginTop:"6px"}}><span>Change</span><span>{fmt(receipt.cashGiven-receipt.total)}</span></div>}</div></div><div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"8px"}}><button onClick={printR} style={{padding:"13px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>🖨️ Print / Save as PDF</button><button onClick={newSale} style={{padding:"11px",borderRadius:"12px",border:"1px solid #e5e7eb",background:"white",color:"#555",fontWeight:"700",cursor:"pointer"}}>+ New Sale</button></div></Card></div>);
  return(
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",background:"white",borderBottom:"1px solid #f0f0f0",display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or generic name..." style={{flex:1,minWidth:"140px",padding:"8px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none"}}/>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{cats.map(c=><button key={c} onClick={()=>setFilter(c)} style={{padding:"7px 13px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:filter===c?"#0f766e":"#f0f0f0",color:filter===c?"white":"#666"}}>{c}</button>)}</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px",alignContent:"start"}}>
          {visible.map(p=>{const inCart=cart.find(c=>c.id===p.id);const cQty=inCart?inCart.qty:0;const out=p.cat!=="Services"&&p.stock<=0;return(
            <button key={p.id} onClick={()=>!out&&add(p)} disabled={out} style={{background:"white",border:cQty>0?"2px solid #0f766e":"2px solid transparent",borderRadius:"16px",padding:"14px",cursor:out?"not-allowed":"pointer",opacity:out?0.4:1,textAlign:"left",position:"relative",boxShadow:cQty>0?"0 4px 12px rgba(15,118,110,0.15)":"0 2px 6px rgba(0,0,0,0.06)",width:"100%",display:"block",outline:"none"}}>
              {cQty>0&&<div style={{position:"absolute",top:"-8px",right:"-8px",width:"24px",height:"24px",borderRadius:"50%",background:"#0f766e",color:"white",fontWeight:"900",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>{cQty}</div>}
              <div style={{fontSize:"28px",marginBottom:"8px"}}>{p.emoji}</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:"#111",marginBottom:"2px",lineHeight:"1.3"}}>{p.name}</div>
              {p.genericName&&<div style={{fontSize:"10px",color:"#bbb",marginBottom:"4px"}}>{p.genericName}</div>}
              <div style={{fontSize:"14px",fontWeight:"900",color:TEALC}}>{fmt(p.price)}</div>
              {p.cat!=="Services"&&<div style={{fontSize:"10px",color:p.stock<=5?"#ef4444":"#bbb",marginTop:"3px",fontWeight:"600"}}>{out?"Out of stock":p.stock+" left"}</div>}
            </button>
          );})}
        </div>
      </div>
      <div style={{width:"280px",flexShrink:0,background:"white",borderLeft:"1px solid #f0f0f0",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid #f5f5f5"}}><div style={{fontSize:"10px",fontWeight:"800",color:"#bbb",letterSpacing:"1.5px",marginBottom:"6px"}}>CLIENT</div><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Walk-in Client" style={{width:"100%",padding:"8px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div>
        <div style={{flex:1,overflowY:"auto"}}>
          {cart.length===0?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",color:"#ddd",textAlign:"center",gap:"6px"}}><div style={{fontSize:"36px"}}>🛒</div><div style={{fontSize:"13px",fontWeight:"600"}}>Cart empty</div><div style={{fontSize:"11px"}}>Click products to add</div></div>
          :cart.map(item=>(<div key={item.id} style={{padding:"10px 14px",borderBottom:"1px solid #f9f9f9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:"12px",fontWeight:"700",color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.emoji} {item.name}</div><div style={{fontSize:"11px",color:"#bbb"}}>{fmt(item.price)} each</div></div><div style={{fontWeight:"900",fontSize:"13px",marginLeft:"8px",flexShrink:0}}>{fmt(item.price*item.qty)}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}><button onClick={()=>qty(item.id,item.qty-1)} style={{width:"26px",height:"26px",borderRadius:"7px",background:"#f3f4f6",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"16px",lineHeight:1}}>−</button><input type="number" value={item.qty} onChange={e=>qty(item.id,e.target.value)} style={{width:"38px",textAlign:"center",padding:"3px",border:"1px solid #e5e7eb",borderRadius:"7px",fontSize:"13px",fontWeight:"700",outline:"none"}}/><button onClick={()=>qty(item.id,item.qty+1)} style={{width:"26px",height:"26px",borderRadius:"7px",background:"#0f766e",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"16px",lineHeight:1,color:"white"}}>+</button><button onClick={()=>rmv(item.id)} style={{marginLeft:"auto",color:"#ef4444",background:"none",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>✕</button></div>
          </div>))}
        </div>
        <div style={{borderTop:"1px solid #f0f0f0",padding:"12px 14px",background:"#fafafa",display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",gap:"6px"}}><div style={{display:"flex",borderRadius:"8px",border:"1px solid #e5e7eb",overflow:"hidden"}}><button onClick={()=>setDiscPct(false)} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"12px",background:!discPct?"#0f766e":"white",color:!discPct?"white":"#888"}}>₦</button><button onClick={()=>setDiscPct(true)} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontWeight:"800",fontSize:"12px",background:discPct?"#0f766e":"white",color:discPct?"white":"#888"}}>%</button></div><input value={disc} onChange={e=>setDisc(e.target.value)} placeholder="Discount" style={{flex:1,padding:"6px 10px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none"}}/></div>
          <div style={{background:"white",borderRadius:"10px",padding:"10px",border:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#888",marginBottom:"3px"}}><span>Subtotal</span><span>{fmt(sub)}</span></div>{discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#059669",marginBottom:"3px"}}><span>Discount</span><span>−{fmt(discAmt)}</span></div>}<div style={{display:"flex",justifyContent:"space-between",fontSize:"18px",fontWeight:"900",borderTop:"1px solid #f0f0f0",paddingTop:"6px",marginTop:"3px"}}><span>Total</span><span style={{color:TEALC}}>{fmt(total)}</span></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>{[["Cash","💵"],["Transfer","🏦"],["POS","💳"],["Split","✂️"]].map(([m,i])=><button key={m} onClick={()=>setMethod(m)} style={{padding:"8px",borderRadius:"8px",border:"none",cursor:"pointer",fontWeight:"700",fontSize:"12px",background:method===m?"#0f766e":"#f0f0f0",color:method===m?"white":"#666"}}>{i} {m}</button>)}</div>
          {method==="Cash"&&<div><input type="number" value={cash} onChange={e=>setCash(e.target.value)} placeholder="Cash given (₦)" style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>{cash&&<div style={{fontSize:"12px",fontWeight:"700",marginTop:"5px",color:change>=0?"#059669":"#ef4444"}}>{change>=0?"Change: "+fmt(change):"Short: "+fmt(Math.abs(change))}</div>}</div>}
          <button onClick={charge} disabled={!cart.length} style={{padding:"14px",borderRadius:"12px",border:"none",background:cart.length?TEAL:"#e5e7eb",color:cart.length?"white":"#bbb",fontWeight:"900",fontSize:"14px",cursor:cart.length?"pointer":"not-allowed"}}>{cart.length?"Charge "+fmt(total):"Select products above"}</button>
        </div>
      </div>
    </div>
  );
}

// PHARMACY & SKINCARE CONSULTATIONS (condensed)


// ══════════════════════════════════════════════════════════════════════════════
// HOSPITAL WORKFLOW — Full real-time department flow
// ══════════════════════════════════════════════════════════════════════════════

// DB helpers for hospital
async function dbCreatePatient(data) {
  return sbFetch("patients", { method:"POST", body:JSON.stringify(data) });
}
async function dbGetPatients(businessId) {
  return sbFetch("patients?business_id=eq."+businessId+"&order=created_at.desc&select=*");
}
async function dbUpdatePatientStatus(id, status) {
  return sbFetch("patients?id=eq."+id, { method:"PATCH", body:JSON.stringify({status:status}), prefer:"return=minimal" });
}
async function dbSaveTriage(data) {
  return sbFetch("triage", { method:"POST", body:JSON.stringify(data) });
}
async function dbGetTriage(patientId) {
  const r = await sbFetch("triage?patient_id=eq."+patientId+"&select=*");
  return r[0]||null;
}
async function dbSaveConsultation(data) {
  return sbFetch("consultations", { method:"POST", body:JSON.stringify(data) });
}
async function dbGetConsultation(patientId) {
  const r = await sbFetch("consultations?patient_id=eq."+patientId+"&select=*");
  return r[0]||null;
}
async function dbSavePrescription(data) {
  return sbFetch("prescriptions", { method:"POST", body:JSON.stringify(data) });
}
async function dbGetPrescriptions(businessId) {
  return sbFetch("prescriptions?business_id=eq."+businessId+"&order=created_at.desc&select=*");
}
async function dbUpdatePrescriptionStatus(id, status) {
  return sbFetch("prescriptions?id=eq."+id, { method:"PATCH", body:JSON.stringify({status:status}), prefer:"return=minimal" });
}
async function dbSaveFollowUp(data) {
  return sbFetch("follow_ups", { method:"POST", body:JSON.stringify(data) });
}

// STATUS BADGE
function StatusBadge({ status }) {
  const map = {
    at_reception: { label:"At Reception", color:"#2563eb", bg:"#eff6ff" },
    at_triage:    { label:"At Triage",    color:"#d97706", bg:"#fffbeb" },
    at_doctor:    { label:"With Doctor",  color:"#7c3aed", bg:"#f5f3ff" },
    at_pharmacy:  { label:"At Pharmacy",  color:"#0f766e", bg:"#f0fdfa" },
    at_lab:       { label:"At Lab",       color:"#db2777", bg:"#fdf2f8" },
    discharged:   { label:"Discharged",   color:"#059669", bg:"#f0fdf4" },
    admitted:     { label:"Admitted",     color:"#dc2626", bg:"#fef2f2" },
  };
  const s = map[status]||{ label:status||"Unknown", color:"#666", bg:"#f3f4f6" };
  return <span style={{padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:"700",background:s.bg,color:s.color}}>{s.label}</span>;
}

// ── RECEPTION MODULE ──────────────────────────────────────────────────────────
function ReceptionModule({ brand, onPatientSent }) {
  const [form,setForm]=useState({ regDate:todayDate(), regNo:"REG-"+Math.floor(Math.random()*90000+10000) });
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("list"); // list | new
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{loadPatients();},[]);

  async function loadPatients() {
    try { const p=await dbGetPatients(brand.id); setPatients(p||[]); } catch(e){}
    setLoading(false);
  }

  async function submitRegistration() {
    if(!form.patName||!form.phone){ alert("Please enter patient name and phone number."); return; }
    setSaving(true);
    try {
      const result = await dbCreatePatient({
        business_id: brand.id,
        reg_no: form.regNo,
        full_name: form.patName,
        date_of_birth: form.dob||"",
        gender: form.gender||"",
        phone: form.phone,
        address: form.address||"",
        next_of_kin: form.nokName||"",
        next_of_kin_phone: form.nokPhone||"",
        insurance: form.insurance||"None",
        pay_status: form.payStatus||"Pending",
        department: form.dept||"",
        assigned_doctor: form.doctor||"",
        status: "at_triage"
      });
      setSaved(true);
      loadPatients();
    } catch(e){ alert("Error saving patient. Please try again."); }
    setSaving(false);
  }

  if(view==="new" && !saved) return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
        <button onClick={()=>setView("list")} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>New Patient Registration</div><div style={{fontSize:"12px",color:"#aaa"}}>Reception — Step 1 of 5</div></div>
      </div>
      <div style={{padding:"10px 14px",borderRadius:"10px",background:"#eff6ff",border:"1px solid #bfdbfe",fontSize:"12px",color:"#2563eb",fontWeight:"600",marginBottom:"16px"}}>
        👩‍💼 Reception Module — Data entered here flows automatically to Triage, Doctor, and Pharmacy
      </div>
      <Card style={{padding:"20px",marginBottom:"16px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{fontSize:"15px",fontWeight:"800",color:"#0f172a"}}>Patient Information</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Registration No." value={form.regNo} onChange={v=>f("regNo",v)}/>
            <Inp label="Registration Date" value={form.regDate} onChange={v=>f("regDate",v)} type="date"/>
          </div>
          <Inp label="Full Name *" value={form.patName} onChange={v=>f("patName",v)} placeholder="Patient full name" required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Date of Birth" value={form.dob} onChange={v=>f("dob",v)} type="date"/>
            <Sel label="Gender" value={form.gender} onChange={v=>f("gender",v)} options={["Male","Female","Other"]}/>
          </div>
          <Inp label="Phone Number *" value={form.phone} onChange={v=>f("phone",v)} placeholder="08012345678" required/>
          <Inp label="Home Address" value={form.address} onChange={v=>f("address",v)} placeholder="Full home address"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Next of Kin Name" value={form.nokName} onChange={v=>f("nokName",v)} placeholder="Full name"/>
            <Inp label="Next of Kin Phone" value={form.nokPhone} onChange={v=>f("nokPhone",v)} placeholder="Phone number"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Sel label="Department" value={form.dept} onChange={v=>f("dept",v)} options={["General OPD","Emergency","Cardiology","Pediatrics","Obstetrics","Surgery","Orthopedics","ENT","Ophthalmology","Dermatology","Psychiatry","Neurology","Oncology","Other"]}/>
            <Inp label="Assigned Doctor" value={form.doctor} onChange={v=>f("doctor",v)} placeholder="Dr. Name"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Sel label="Insurance / HMO" value={form.insurance} onChange={v=>f("insurance",v)} options={["None / Self-pay","NHIS","PHIS","Leadway","Aiico","Hygeia","Reliance","AXA Mansard","Other"]}/>
            <Sel label="Payment Status" value={form.payStatus} onChange={v=>f("payStatus",v)} options={["Paid","Pending","Insurance","Waived"]}/>
          </div>
        </div>
      </Card>
      <button onClick={submitRegistration} disabled={saving}
        style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"15px",cursor:"pointer",opacity:saving?0.7:1}}>
        {saving?"Saving...":"Register Patient & Send to Triage →"}
      </button>
    </div>
  );

  if(saved) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div>
      <div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Patient Registered!</div>
      <div style={{fontSize:"14px",color:"#888",marginBottom:"8px"}}><strong>{form.patName}</strong> has been registered</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"#fffbeb",border:"1px solid #fcd34d",fontSize:"13px",color:"#d97706",fontWeight:"700",marginBottom:"24px"}}>
        🔔 Patient sent to Triage — Nurse can now see this patient
      </div>
      <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}>
        <TealBtn onClick={()=>{ setForm({regDate:todayDate(),regNo:"REG-"+Math.floor(Math.random()*90000+10000)}); setSaved(false); setView("new"); }}>Register Another Patient</TealBtn>
        <GhostBtn onClick={()=>{ setSaved(false); setView("list"); }}>Back to Patient List</GhostBtn>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHead title="Reception" sub="Register patients and send to triage" btn="+ Register New Patient" onBtn={()=>setView("new")}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="👥" label="Total Today" value={patients.length}/>
        <StatCard icon="⏳" label="At Triage" value={patients.filter(p=>p.status==="at_triage").length}/>
        <StatCard icon="✅" label="Discharged" value={patients.filter(p=>p.status==="discharged").length}/>
      </div>
      {loading?<div style={{textAlign:"center",padding:"40px",color:"#aaa"}}>⏳ Loading patients...</div>
      :patients.length===0?<div style={{textAlign:"center",padding:"60px",color:"#ccc"}}><div style={{fontSize:"40px",marginBottom:"12px"}}>👥</div><div>No patients today. Register the first one!</div></div>
      :<Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Reg No.","Patient","Phone","Department","Doctor","Status"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{patients.map(p=>(
              <tr key={p.id} style={{borderBottom:"1px solid #f9f9f9"}}>
                <td style={{padding:"12px 16px",fontSize:"12px",color:"#888",fontWeight:"600"}}>{p.reg_no}</td>
                <td style={{padding:"12px 16px"}}><div style={{fontWeight:"700",fontSize:"13px"}}>{p.full_name}</div><div style={{fontSize:"11px",color:"#aaa"}}>{p.gender||""} {p.date_of_birth?"· DOB: "+p.date_of_birth:""}</div></td>
                <td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{p.phone}</td>
                <td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{p.department||"—"}</td>
                <td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{p.assigned_doctor||"—"}</td>
                <td style={{padding:"12px 16px"}}><StatusBadge status={p.status}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>}
    </div>
  );
}

// ── TRIAGE MODULE ─────────────────────────────────────────────────────────────
function TriageModule({ brand }) {
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [triage,setTriage]=useState({});
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);

  useEffect(()=>{ loadPatients(); },[]);

  async function loadPatients() {
    try {
      const all = await dbGetPatients(brand.id);
      setPatients((all||[]).filter(p=>p.status==="at_triage"||p.status==="at_doctor"||p.status==="at_pharmacy"||p.status==="discharged"));
    } catch(e){}
    setLoading(false);
  }

  async function sendToDoctor() {
    if(!selected) return;
    setSaving(true);
    try {
      await dbSaveTriage({
        patient_id: selected.id,
        business_id: brand.id,
        weight: triage.weight||"", height: triage.height||"",
        bp: triage.bp||"", pulse: triage.pulse||"",
        temperature: triage.temp||"", rr: triage.rr||"",
        spo2: triage.spo2||"", blood_sugar: triage.bs||"",
        chief_complaint: triage.complaint||"",
        allergies: triage.allergies||"",
        nurse_name: triage.nurseName||"",
        status: "done"
      });
      await dbUpdatePatientStatus(selected.id, "at_doctor");
      setDone(true);
      loadPatients();
    } catch(e){ alert("Error saving triage. Please try again."); }
    setSaving(false);
  }

  if(selected && !done) return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
        <button onClick={()=>setSelected(null)} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>Triage — {selected.full_name}</div><div style={{fontSize:"12px",color:"#aaa"}}>{selected.reg_no} · {selected.department||"General OPD"}</div></div>
      </div>
      <div style={{padding:"10px 14px",borderRadius:"10px",background:"#fffbeb",border:"1px solid #fcd34d",fontSize:"12px",color:"#92400e",fontWeight:"600",marginBottom:"16px"}}>
        🏥 Nurse Module — Vitals entered here go directly to the doctor
      </div>
      {/* Patient summary from reception */}
      <Card style={{padding:"16px",marginBottom:"16px",background:"#f0fdfa",border:"1px solid #ccfbf1"}}>
        <div style={{fontSize:"12px",fontWeight:"700",color:TEALC,marginBottom:"8px"}}>Patient Info — From Reception</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[["Name",selected.full_name],["Phone",selected.phone],["DOB",selected.date_of_birth||"—"],["Gender",selected.gender||"—"],["Department",selected.department||"—"],["Doctor",selected.assigned_doctor||"—"],["Insurance",selected.insurance||"—"],["Payment",selected.pay_status||"—"]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:"10px",color:"#aaa",fontWeight:"700"}}>{l}</div><div style={{fontSize:"12px",fontWeight:"600",color:"#0f172a"}}>{v}</div></div>
          ))}
        </div>
      </Card>
      <Card style={{padding:"20px",marginBottom:"16px"}}>
        <div style={{fontSize:"15px",fontWeight:"800",color:"#0f172a",marginBottom:"16px"}}>Vital Signs</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Weight (kg)" value={triage.weight} onChange={v=>setTriage(p=>({...p,weight:v}))} placeholder="e.g. 68"/>
          <Inp label="Height (cm)" value={triage.height} onChange={v=>setTriage(p=>({...p,height:v}))} placeholder="e.g. 170"/>
          <Inp label="Blood Pressure" value={triage.bp} onChange={v=>setTriage(p=>({...p,bp:v}))} placeholder="e.g. 120/80 mmHg"/>
          <Inp label="Pulse (bpm)" value={triage.pulse} onChange={v=>setTriage(p=>({...p,pulse:v}))} placeholder="e.g. 72"/>
          <Inp label="Temperature (°C)" value={triage.temp} onChange={v=>setTriage(p=>({...p,temp:v}))} placeholder="e.g. 37.2"/>
          <Inp label="Respiratory Rate" value={triage.rr} onChange={v=>setTriage(p=>({...p,rr:v}))} placeholder="e.g. 16/min"/>
          <Inp label="Oxygen Saturation" value={triage.spo2} onChange={v=>setTriage(p=>({...p,spo2:v}))} placeholder="e.g. 98%"/>
          <Inp label="Blood Sugar (optional)" value={triage.bs} onChange={v=>setTriage(p=>({...p,bs:v}))} placeholder="e.g. 5.6 mmol/L"/>
        </div>
        <div style={{marginTop:"14px",display:"flex",flexDirection:"column",gap:"12px"}}>
          <Textarea label="Chief Complaint" value={triage.complaint} onChange={v=>setTriage(p=>({...p,complaint:v}))} placeholder="Patient's main complaint in brief..." rows={2}/>
          <div>
            <Textarea label="Allergies (if any)" value={triage.allergies} onChange={v=>setTriage(p=>({...p,allergies:v}))} placeholder="Known allergies..." rows={2}/>
            {triage.allergies&&<div style={{marginTop:"6px",padding:"8px 12px",borderRadius:"8px",background:"#fef2f2",border:"1px solid #fecaca",fontSize:"12px",color:"#dc2626",fontWeight:"700"}}>⚠️ ALLERGY ALERT: {triage.allergies}</div>}
          </div>
          <Inp label="Nurse Name" value={triage.nurseName} onChange={v=>setTriage(p=>({...p,nurseName:v}))} placeholder="Your name"/>
        </div>
      </Card>
      <button onClick={sendToDoctor} disabled={saving}
        style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"15px",cursor:"pointer",opacity:saving?0.7:1}}>
        {saving?"Saving...":"Save & Send to Doctor →"}
      </button>
    </div>
  );

  if(done) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div>
      <div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Triage Complete!</div>
      <div style={{fontSize:"14px",color:"#888",marginBottom:"8px"}}>Vitals saved for <strong>{selected.full_name}</strong></div>
      <div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"#f5f3ff",border:"1px solid #ddd6fe",fontSize:"13px",color:"#7c3aed",fontWeight:"700",marginBottom:"24px"}}>
        🔔 Patient sent to Doctor — Doctor can now see full file
      </div>
      <div style={{display:"flex",gap:"10px",justifyContent:"center"}}><TealBtn onClick={()=>{ setSelected(null); setDone(false); setTriage({}); loadPatients(); }}>Back to Patient List</TealBtn></div>
    </div>
  );

  return (
    <div>
      <SectionHead title="Triage" sub="Patients waiting for nurse assessment"/>
      {loading?<div style={{textAlign:"center",padding:"40px",color:"#aaa"}}>⏳ Loading...</div>
      :patients.filter(p=>p.status==="at_triage").length===0
        ?<div style={{textAlign:"center",padding:"60px",color:"#ccc"}}><div style={{fontSize:"40px",marginBottom:"12px"}}>🏥</div><div>No patients at triage right now</div><div style={{fontSize:"12px",marginTop:"8px"}}>Patients appear here after reception registers them</div></div>
        :<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {patients.filter(p=>p.status==="at_triage").map(p=>(
            <Card key={p.id} style={{padding:"18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                <Avatar name={p.full_name} size={44}/>
                <div>
                  <div style={{fontWeight:"800",fontSize:"15px"}}>{p.full_name}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{p.reg_no} · {p.phone}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{p.department||"General OPD"} · {p.assigned_doctor||"No doctor assigned"}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <StatusBadge status={p.status}/>
                <TealBtn onClick={()=>{setSelected(p);setTriage({});setDone(false);}}>Start Triage</TealBtn>
              </div>
            </Card>
          ))}
        </div>}
    </div>
  );
}

// ── DOCTOR MODULE ─────────────────────────────────────────────────────────────
function DoctorModule({ brand, products }) {
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [triageData,setTriageData]=useState(null);
  const [consult,setConsult]=useState({});
  const [meds,setMeds]=useState([]);
  const [medSearch,setMedSearch]=useState("");
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [sentTo,setSentTo]=useState("");

  useEffect(()=>{ loadPatients(); },[]);

  async function loadPatients() {
    try {
      const all = await dbGetPatients(brand.id);
      setPatients((all||[]).filter(p=>p.status==="at_doctor"));
    } catch(e){}
    setLoading(false);
  }

  async function openPatient(p) {
    setSelected(p);
    setConsult({});
    setMeds([]);
    setDone(false);
    setSentTo("");
    try {
      const t = await dbGetTriage(p.id);
      setTriageData(t);
    } catch(e){}
  }

  const medResults = products.filter(p=>p.cat==="Medicines"&&(p.name.toLowerCase().includes(medSearch.toLowerCase())||(p.genericName||"").toLowerCase().includes(medSearch.toLowerCase())));
  const addMed = m => { setMeds(prev=>[...prev,{...m,dose:"",freq:"",dur:"",route:"Oral",instructions:""}]); setMedSearch(""); };
  const updMed = (i,k,v) => setMeds(prev=>prev.map((m,j)=>j===i?{...m,[k]:v}:m));

  async function sendToPharmacy() {
    if(!consult.dx1){ alert("Please enter at least a primary diagnosis."); return; }
    setSaving(true);
    try {
      const c = await dbSaveConsultation({
        patient_id: selected.id,
        business_id: brand.id,
        hpi: consult.hpi||"",
        examination: consult.exam||"",
        primary_diagnosis: consult.dx1||"",
        secondary_diagnosis: consult.dx2||"",
        clinical_notes: consult.notes||"",
        disposition: consult.disposition||"Discharge",
        referral_dest: consult.refDest||"",
        referral_reason: consult.refReason||"",
        ward: consult.ward||"",
        counselling: consult.counselling||"",
        doctor_name: consult.doctorName||"",
        status: "sent_to_pharmacy"
      });
      if(meds.length>0||consult.labTests||consult.imaging) {
        await dbSavePrescription({
          patient_id: selected.id,
          consultation_id: c[0]&&c[0].id ? c[0].id : null,
          business_id: brand.id,
          patient_name: selected.full_name,
          doctor_name: consult.doctorName||"",
          medicines: JSON.stringify(meds),
          lab_tests: consult.labTests||"",
          imaging: consult.imaging||"",
          notes: consult.prescNotes||"",
          status: "pending"
        });
      }
      if(consult.fuDate) {
        await dbSaveFollowUp({
          patient_id: selected.id,
          business_id: brand.id,
          follow_up_date: consult.fuDate,
          clinic: consult.fuClinic||"",
          reason: consult.fuReason||"",
          status: "scheduled"
        });
      }
      await dbUpdatePatientStatus(selected.id, meds.length>0?"at_pharmacy":"discharged");
      setSentTo(meds.length>0?"pharmacy":"discharged");
      setDone(true);
      loadPatients();
    } catch(e){ alert("Error saving consultation. Please try again."); }
    setSaving(false);
  }

  if(selected && !done) return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
        <button onClick={()=>setSelected(null)} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>Doctor Consultation</div><div style={{fontSize:"12px",color:"#aaa"}}>{selected.full_name} · {selected.reg_no}</div></div>
      </div>
      <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f5f3ff",border:"1px solid #ddd6fe",fontSize:"12px",color:"#7c3aed",fontWeight:"600",marginBottom:"16px"}}>
        👨‍⚕️ Doctor Module — Patient info auto-filled from Reception and Triage
      </div>

      {/* Patient summary */}
      <Card style={{padding:"16px",marginBottom:"16px",background:"#fafafa"}}>
        <div style={{fontSize:"12px",fontWeight:"700",color:"#555",marginBottom:"10px"}}>Patient Summary — Auto-filled</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}}>
          {[["Name",selected.full_name],["Reg No.",selected.reg_no],["Gender",selected.gender||"—"],["DOB",selected.date_of_birth||"—"],["Phone",selected.phone],["Department",selected.department||"—"],["Doctor",selected.assigned_doctor||"—"],["Insurance",selected.insurance||"—"]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:"10px",color:"#aaa",fontWeight:"700"}}>{l}</div><div style={{fontSize:"12px",fontWeight:"600",color:"#0f172a"}}>{v}</div></div>
          ))}
        </div>
        {triageData&&<>
          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:"10px",marginTop:"4px"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:"#555",marginBottom:"8px"}}>Vitals — From Nurse</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
              {[["BP",triageData.bp],["Pulse",triageData.pulse],["Temp",triageData.temperature],["SpO2",triageData.spo2],["Weight",triageData.weight],["Height",triageData.height],["RR",triageData.rr],["Blood Sugar",triageData.blood_sugar]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{padding:"6px 8px",borderRadius:"8px",background:"white",border:"1px solid #f0f0f0"}}><div style={{fontSize:"9px",color:"#aaa",fontWeight:"700"}}>{l}</div><div style={{fontSize:"12px",fontWeight:"700",color:"#0f172a"}}>{v}</div></div>
              ))}
            </div>
            {triageData.chief_complaint&&<div style={{marginTop:"8px",padding:"8px 12px",borderRadius:"8px",background:"white",border:"1px solid #f0f0f0",fontSize:"12px"}}><span style={{fontWeight:"700",color:"#555"}}>Chief Complaint: </span>{triageData.chief_complaint}</div>}
            {triageData.allergies&&<div style={{marginTop:"6px",padding:"8px 12px",borderRadius:"8px",background:"#fef2f2",border:"1px solid #fecaca",fontSize:"12px",color:"#dc2626",fontWeight:"700"}}>⚠️ ALLERGY ALERT: {triageData.allergies}</div>}
          </div>
        </>}
      </Card>

      <Card style={{padding:"20px",marginBottom:"14px"}}>
        <div style={{fontSize:"15px",fontWeight:"800",color:"#0f172a",marginBottom:"14px"}}>Clinical Assessment</div>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <Textarea label="History of Present Illness" value={consult.hpi} onChange={v=>setConsult(p=>({...p,hpi:v}))} placeholder="Onset, duration, severity, progression, associated symptoms..." rows={4}/>
          <Textarea label="Physical Examination Findings" value={consult.exam} onChange={v=>setConsult(p=>({...p,exam:v}))} placeholder="General appearance, systemic examination..." rows={3}/>
          <Inp label="Primary Diagnosis *" value={consult.dx1} onChange={v=>setConsult(p=>({...p,dx1:v}))} placeholder="e.g. Hypertensive crisis, Malaria, Peptic Ulcer Disease" required/>
          <Inp label="Secondary Diagnosis (optional)" value={consult.dx2} onChange={v=>setConsult(p=>({...p,dx2:v}))} placeholder="Additional diagnosis..."/>
          <Textarea label="Clinical Notes" value={consult.notes} onChange={v=>setConsult(p=>({...p,notes:v}))} placeholder="Additional observations and notes..." rows={2}/>
          <Inp label="Doctor Name" value={consult.doctorName} onChange={v=>setConsult(p=>({...p,doctorName:v}))} placeholder="Your name"/>
        </div>
      </Card>

      <Card style={{padding:"20px",marginBottom:"14px"}}>
        <div style={{fontSize:"15px",fontWeight:"800",color:"#0f172a",marginBottom:"14px"}}>Prescription — Sends to Pharmacy</div>
        <div style={{position:"relative",marginBottom:"12px"}}>
          <input value={medSearch} onChange={e=>setMedSearch(e.target.value)} placeholder="Search medicines from inventory..."
            style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
          {medSearch&&medResults.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:10,marginTop:"4px",overflow:"hidden"}}>
            {medResults.map(m=><button key={m.id} onClick={()=>addMed(m)} style={{width:"100%",padding:"10px 14px",border:"none",background:"white",cursor:"pointer",textAlign:"left",borderBottom:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:"700",fontSize:"13px"}}>{m.emoji} {m.name}</div><div style={{fontSize:"11px",color:"#888"}}>{m.genericName||""} · {m.stock} in stock</div></div>
              <span style={{color:TEALC,fontWeight:"700",fontSize:"12px"}}>+ Add</span>
            </button>)}
          </div>}
        </div>
        {meds.length===0?<div style={{textAlign:"center",padding:"16px",color:"#ddd",fontSize:"13px",border:"1px dashed #e5e7eb",borderRadius:"10px"}}>Search and add medicines above</div>
        :meds.map((med,idx)=>(
          <div key={idx} style={{padding:"12px",borderRadius:"12px",border:"1px solid #e5e7eb",marginBottom:"10px",background:"#fafafa"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><div style={{fontWeight:"700",fontSize:"13px"}}>{med.emoji} {med.name}</div><button onClick={()=>setMeds(prev=>prev.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontWeight:"700",fontSize:"12px"}}>Remove</button></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <Inp label="Dose" value={med.dose} onChange={v=>updMed(idx,"dose",v)} placeholder="e.g. 500mg"/>
              <Inp label="Frequency" value={med.freq} onChange={v=>updMed(idx,"freq",v)} placeholder="e.g. Twice daily"/>
              <Inp label="Duration" value={med.dur} onChange={v=>updMed(idx,"dur",v)} placeholder="e.g. 5 days"/>
              <Sel label="Route" value={med.route} onChange={v=>updMed(idx,"route",v)} options={["Oral","IV","IM","SC","Topical","Inhalation","Sublingual","Rectal","Other"]}/>
            </div>
            <div style={{marginTop:"8px"}}><Inp label="Instructions" value={med.instructions} onChange={v=>updMed(idx,"instructions",v)} placeholder="e.g. Take after meals"/></div>
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginTop:"10px"}}>
          <Textarea label="Laboratory Tests" value={consult.labTests} onChange={v=>setConsult(p=>({...p,labTests:v}))} placeholder="FBC, LFT, RFT, Malaria RDT..." rows={2}/>
          <Textarea label="Imaging Requests" value={consult.imaging} onChange={v=>setConsult(p=>({...p,imaging:v}))} placeholder="Chest X-ray, Abdominal USS..." rows={2}/>
        </div>
        <div style={{marginTop:"10px"}}><Textarea label="Prescription Notes" value={consult.prescNotes} onChange={v=>setConsult(p=>({...p,prescNotes:v}))} placeholder="Special instructions for pharmacist..." rows={2}/></div>
      </Card>

      <Card style={{padding:"20px",marginBottom:"14px"}}>
        <div style={{fontSize:"15px",fontWeight:"800",color:"#0f172a",marginBottom:"14px"}}>Disposition & Follow-up</div>
        <div>
          <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Patient Disposition</div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
            {["Discharge","Admit","Refer to Specialist","Emergency Transfer"].map(v=>(
              <label key={v} style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 12px",borderRadius:"8px",border:"1px solid"+(consult.disposition===v?TEALC:"#e5e7eb"),background:consult.disposition===v?"#f0fdfa":"white",cursor:"pointer",fontSize:"13px"}}>
                <input type="radio" checked={consult.disposition===v} onChange={()=>setConsult(p=>({...p,disposition:v}))} style={{accentColor:TEALC}}/>{v}
              </label>
            ))}
          </div>
        </div>
        {consult.disposition==="Admit"&&<Inp label="Ward / Bed" value={consult.ward} onChange={v=>setConsult(p=>({...p,ward:v}))} placeholder="e.g. Male Medical Ward, Bed 5"/>}
        {consult.disposition==="Refer to Specialist"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
          <Inp label="Referral Destination" value={consult.refDest} onChange={v=>setConsult(p=>({...p,refDest:v}))} placeholder="e.g. LUTH Cardiology"/>
          <Textarea label="Reason" value={consult.refReason} onChange={v=>setConsult(p=>({...p,refReason:v}))} rows={2}/>
        </div>}
        <Textarea label="Patient Counselling & Instructions" value={consult.counselling} onChange={v=>setConsult(p=>({...p,counselling:v}))} placeholder="Diet, lifestyle, medication compliance instructions..." rows={2}/>
        <div style={{marginTop:"12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Follow-up Date" value={consult.fuDate} onChange={v=>setConsult(p=>({...p,fuDate:v}))} type="date"/>
          <Sel label="Follow-up Clinic" value={consult.fuClinic} onChange={v=>setConsult(p=>({...p,fuClinic:v}))} options={["Same Doctor","General OPD","Cardiology","Pediatrics","Surgery","Other"]}/>
        </div>
        {consult.fuDate&&<div style={{marginTop:"8px",padding:"8px 12px",borderRadius:"8px",background:"#f0fdfa",fontSize:"12px",color:TEALC}}>🔔 Follow-up reminder will be set for {consult.fuDate}</div>}
      </Card>

      <button onClick={sendToPharmacy} disabled={saving}
        style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"15px",cursor:"pointer",opacity:saving?0.7:1}}>
        {saving?"Saving...":(meds.length>0?"Save & Send Prescription to Pharmacy →":"Save Consultation & Discharge →")}
      </button>
    </div>
  );

  if(done) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div>
      <div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Consultation Saved!</div>
      <div style={{fontSize:"14px",color:"#888",marginBottom:"12px"}}>Patient: <strong>{selected.full_name}</strong></div>
      {sentTo==="pharmacy"&&<div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"13px",color:TEALC,fontWeight:"700",marginBottom:"24px"}}>
        💊 Prescription sent to Pharmacy — Pharmacist can now see and dispense
      </div>}
      {sentTo==="discharged"&&<div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:"13px",color:"#059669",fontWeight:"700",marginBottom:"24px"}}>
        ✅ Patient discharged successfully
      </div>}
      <div style={{display:"flex",gap:"10px",justifyContent:"center"}}><TealBtn onClick={()=>{setSelected(null);setDone(false);setTriageData(null);loadPatients();}}>Back to Patient List</TealBtn></div>
    </div>
  );

  return (
    <div>
      <SectionHead title="Doctor Consultation" sub="Patients waiting to see doctor"/>
      {loading?<div style={{textAlign:"center",padding:"40px",color:"#aaa"}}>⏳ Loading...</div>
      :patients.length===0
        ?<div style={{textAlign:"center",padding:"60px",color:"#ccc"}}><div style={{fontSize:"40px",marginBottom:"12px"}}>👨‍⚕️</div><div>No patients waiting for doctor</div><div style={{fontSize:"12px",marginTop:"8px"}}>Patients appear here after triage is complete</div></div>
        :<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {patients.map(p=>(
            <Card key={p.id} style={{padding:"18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                <Avatar name={p.full_name} size={44} bg="linear-gradient(135deg,#7c3aed,#a78bfa)"/>
                <div>
                  <div style={{fontWeight:"800",fontSize:"15px"}}>{p.full_name}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{p.reg_no} · {p.phone}</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{p.department||"General OPD"} · {p.assigned_doctor||"No doctor assigned"}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <StatusBadge status={p.status}/>
                <TealBtn onClick={()=>openPatient(p)}>Open File</TealBtn>
              </div>
            </Card>
          ))}
        </div>}
    </div>
  );
}

// ── PHARMACY PRESCRIPTION INBOX ───────────────────────────────────────────────
function PrescriptionInbox({ brand, products }) {
  const [prescriptions,setPrescriptions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [dispensing,setDispensing]=useState(false);
  const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};

  useEffect(()=>{ loadPrescriptions(); const t=setInterval(loadPrescriptions,20000); return()=>clearInterval(t); },[]);

  async function loadPrescriptions() {
    try { const p=await dbGetPrescriptions(brand.id); setPrescriptions(p||[]); } catch(e){}
    setLoading(false);
  }

  async function markDispensed(id, patientId) {
    setDispensing(true);
    try {
      await dbUpdatePrescriptionStatus(id, "dispensed");
      await dbUpdatePatientStatus(patientId, "discharged");
      showToast("Prescription dispensed!");
      loadPrescriptions();
      setSelected(null);
    } catch(e){ showToast("Error. Please try again."); }
    setDispensing(false);
  }

  const pending = prescriptions.filter(p=>p.status==="pending");
  const dispensed = prescriptions.filter(p=>p.status==="dispensed");

  if(selected) {
    let meds=[];
    try{ meds=JSON.parse(selected.medicines||"[]"); }catch(e){}
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
          <button onClick={()=>setSelected(null)} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>Prescription Details</div><div style={{fontSize:"12px",color:"#aaa"}}>Patient: {selected.patient_name}</div></div>
        </div>
        <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,fontWeight:"600",marginBottom:"16px"}}>
          💊 Pharmacy Module — Prescription received from Doctor
        </div>
        <Card style={{padding:"16px",marginBottom:"14px",background:"#fafafa"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:"#555",marginBottom:"8px"}}>Prescription Info</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {[["Patient",selected.patient_name],["Doctor",selected.doctor_name||"—"],["Date",selected.created_at?selected.created_at.split("T")[0]:"—"],["Status",selected.status]].map(([l,v])=>(
              <div key={l}><div style={{fontSize:"10px",color:"#aaa",fontWeight:"700"}}>{l}</div><div style={{fontSize:"12px",fontWeight:"600",color:"#0f172a"}}>{v}</div></div>
            ))}
          </div>
        </Card>
        <Card style={{padding:"16px",marginBottom:"14px"}}>
          <div style={{fontSize:"14px",fontWeight:"800",color:"#0f172a",marginBottom:"12px"}}>Prescribed Medicines</div>
          {meds.length===0?<div style={{color:"#aaa",fontSize:"13px"}}>No medicines prescribed</div>
          :meds.map((med,i)=>(
            <div key={i} style={{padding:"12px",borderRadius:"10px",border:"1px solid #f0f0f0",marginBottom:"8px",background:"#fafafa"}}>
              <div style={{fontWeight:"700",fontSize:"14px",marginBottom:"6px"}}>{med.emoji||"💊"} {med.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
                {[["Dose",med.dose],["Frequency",med.freq],["Duration",med.dur],["Route",med.route]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{fontSize:"12px"}}><span style={{color:"#888",fontWeight:"600"}}>{l}: </span><span style={{color:"#0f172a"}}>{v}</span></div>
                ))}
              </div>
              {med.instructions&&<div style={{fontSize:"12px",color:"#555",marginTop:"6px",padding:"6px 8px",borderRadius:"6px",background:"white",border:"1px solid #f0f0f0"}}>📋 {med.instructions}</div>}
              {/* Check stock */}
              {(()=>{const prod=products.find(p=>p.id===med.id||p.name===med.name);return prod&&prod.stock<=0?<div style={{marginTop:"6px",padding:"6px 8px",borderRadius:"6px",background:"#fef2f2",fontSize:"12px",color:"#dc2626",fontWeight:"700"}}>⚠️ OUT OF STOCK — Mark as unavailable</div>:null;})()}
            </div>
          ))}
        </Card>
        {selected.lab_tests&&<Card style={{padding:"16px",marginBottom:"14px"}}><div style={{fontSize:"14px",fontWeight:"800",marginBottom:"8px"}}>Lab Tests Ordered</div><div style={{fontSize:"13px",color:"#555"}}>{selected.lab_tests}</div></Card>}
        {selected.imaging&&<Card style={{padding:"16px",marginBottom:"14px"}}><div style={{fontSize:"14px",fontWeight:"800",marginBottom:"8px"}}>Imaging Ordered</div><div style={{fontSize:"13px",color:"#555"}}>{selected.imaging}</div></Card>}
        {selected.notes&&<Card style={{padding:"16px",marginBottom:"14px"}}><div style={{fontSize:"14px",fontWeight:"800",marginBottom:"8px"}}>Doctor Notes</div><div style={{fontSize:"13px",color:"#555"}}>{selected.notes}</div></Card>}
        {selected.status==="pending"&&(
          <button onClick={()=>markDispensed(selected.id, selected.patient_id)} disabled={dispensing}
            style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"15px",cursor:"pointer",opacity:dispensing?0.7:1}}>
            {dispensing?"Saving...":"Mark as Dispensed ✓"}
          </button>
        )}
        {selected.status==="dispensed"&&<div style={{padding:"14px",borderRadius:"12px",background:"#f0fdf4",border:"1px solid #bbf7d0",textAlign:"center",fontSize:"14px",fontWeight:"700",color:"#059669"}}>✅ Already Dispensed</div>}
        <Toast msg={toast}/>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
        <div><div style={{fontSize:"20px",fontWeight:"900",color:"#111"}}>Prescription Inbox</div><div style={{fontSize:"13px",color:"#888",marginTop:"3px"}}>Prescriptions received from doctors</div></div>
        <button onClick={loadPrescriptions} style={{padding:"8px 16px",borderRadius:"10px",border:"1px solid #e5e7eb",background:"white",color:TEALC,fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>🔄 Refresh</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"20px"}}>
        <StatCard icon="💊" label="Pending Dispensing" value={pending.length} alert={pending.length>0}/>
        <StatCard icon="✅" label="Dispensed Today" value={dispensed.length}/>
      </div>
      {pending.length>0&&<div style={{marginBottom:"16px",padding:"14px 18px",borderRadius:"14px",background:"#f0fdfa",border:"1px solid #ccfbf1",display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"20px"}}>🔔</span>
        <div><div style={{fontWeight:"700",color:TEALC,fontSize:"14px"}}>{pending.length} prescription{pending.length>1?"s":""} waiting to be dispensed!</div><div style={{fontSize:"12px",color:"#555",marginTop:"2px"}}>{pending.map(p=>p.patient_name).join(" · ")}</div></div>
      </div>}
      {loading?<div style={{textAlign:"center",padding:"40px",color:"#aaa"}}>⏳ Loading...</div>
      :prescriptions.length===0
        ?<div style={{textAlign:"center",padding:"60px",color:"#ccc"}}><div style={{fontSize:"40px",marginBottom:"12px"}}>💊</div><div>No prescriptions yet</div><div style={{fontSize:"12px",marginTop:"8px"}}>Prescriptions appear here when a doctor sends them</div></div>
        :<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {prescriptions.map(p=>{
            let medCount=0;try{medCount=JSON.parse(p.medicines||"[]").length;}catch(e){}
            return(
              <Card key={p.id} style={{padding:"16px",cursor:"pointer",border:p.status==="pending"?"1px solid #ccfbf1":"1px solid #f0f0f0"}} onClick={()=>setSelected(p)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"12px",background:p.status==="pending"?"#f0fdfa":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>💊</div>
                    <div>
                      <div style={{fontWeight:"800",fontSize:"14px"}}>{p.patient_name}</div>
                      <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>Dr. {p.doctor_name||"Unknown"} · {medCount} medicine{medCount!==1?"s":""}</div>
                      <div style={{fontSize:"11px",color:"#aaa",marginTop:"2px"}}>{p.created_at?p.created_at.split("T")[0]:""}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
                    <Pill label={p.status==="pending"?"Pending":"Dispensed"} type={p.status==="pending"?"amber":"green"}/>
                    <span style={{fontSize:"12px",color:TEALC,fontWeight:"600"}}>View →</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>}
      <Toast msg={toast}/>
    </div>
  );
}


// ── HOSPITAL CONSULTATION ─────────────────────────────────────────────────────
function HospitalConsultation({ onClose }) {
  const [step,setStep]=useState(1);const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({regDate:todayDate(),regNo:"HSP-"+Math.floor(Math.random()*90000+10000)});
  const TOTAL=5;const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const RB=({label,fKey,val})=>(<label style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 12px",borderRadius:"8px",border:"1px solid"+(form[fKey]===val?TEALC:"#e5e7eb"),background:form[fKey]===val?"#f0fdfa":"white",cursor:"pointer",fontSize:"13px"}}><input type="radio" checked={form[fKey]===val} onChange={()=>f(fKey,val)} style={{accentColor:TEALC}}/>{label}</label>);
  const steps=["Registration","Triage","Doctor","Treatment Plan","Follow-up"];
  if(saved)return(<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div><div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Consultation Saved!</div><div style={{fontSize:"14px",color:"#888",marginBottom:"24px"}}>Record #{form.regNo} saved.</div><div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}><TealBtn onClick={()=>{setForm({regDate:todayDate(),regNo:"HSP-"+Math.floor(Math.random()*90000+10000)});setStep(1);setSaved(false);}}>New Consultation</TealBtn><GhostBtn onClick={onClose}>Back to List</GhostBtn></div></div>);
  return(
    <div>
      <div style={{marginBottom:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontSize:"12px",color:"#888"}}>Step {step} of {TOTAL} — {steps[step-1]}</span><span style={{fontSize:"12px",fontWeight:"700",color:TEALC}}>{Math.round((step/TOTAL)*100)}%</span></div>
        <div style={{height:"6px",background:"#f0f0f0",borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",width:((step/TOTAL)*100)+"%",background:TEAL,borderRadius:"3px",transition:"width 0.3s"}}/></div>
        <div style={{display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"}}>
          {steps.map((s,i)=><span key={s} style={{fontSize:"10px",fontWeight:step===i+1?"700":"400",color:step===i+1?TEALC:step>i+1?"#059669":"#bbb"}}>{step>i+1?"✓ ":""}{s}{i<steps.length-1?" · ":""}</span>)}
        </div>
      </div>

      <div style={{minHeight:"380px",display:"flex",flexDirection:"column",gap:"14px"}}>
        {step===1&&<>
          <div style={{fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>Step 1 — Patient Registration</div>
          <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,fontWeight:"600"}}>Handled by Reception / Registration Officer</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Registration No." value={form.regNo} onChange={v=>f("regNo",v)}/>
            <Inp label="Registration Date" value={form.regDate} onChange={v=>f("regDate",v)} type="date"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Full Name *" value={form.patName} onChange={v=>f("patName",v)} placeholder="Patient full name" required/>
            <Inp label="Date of Birth" value={form.dob} onChange={v=>f("dob",v)} type="date"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Sel label="Gender" value={form.gender} onChange={v=>f("gender",v)} options={["Male","Female","Other"]}/>
            <Inp label="Phone Number *" value={form.phone} onChange={v=>f("phone",v)} placeholder="08012345678" required/>
          </div>
          <Inp label="Address" value={form.address} onChange={v=>f("address",v)} placeholder="Home address"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Next of Kin" value={form.nokName} onChange={v=>f("nokName",v)} placeholder="Name"/>
            <Inp label="Next of Kin Phone" value={form.nokPhone} onChange={v=>f("nokPhone",v)} placeholder="Phone"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Sel label="Department" value={form.dept} onChange={v=>f("dept",v)} options={["General OPD","Emergency","Cardiology","Pediatrics","Obstetrics","Surgery","Orthopedics","ENT","Ophthalmology","Dermatology","Psychiatry","Neurology","Oncology","Other"]}/>
            <Inp label="Assigned Doctor" value={form.doctor} onChange={v=>f("doctor",v)} placeholder="Dr. Name"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Sel label="Insurance / HMO" value={form.insurance} onChange={v=>f("insurance",v)} options={["None / Self-pay","NHIS","PHIS","Leadway","Aiico","Hygeia","Reliance","AXA Mansard","Other"]}/>
            <Sel label="Payment Status" value={form.payStatus} onChange={v=>f("payStatus",v)} options={["Paid","Pending","Insurance","Waived"]}/>
          </div>
        </>}

        {step===2&&<>
          <div style={{fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>Step 2 — Nurse / Triage</div>
          <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,fontWeight:"600"}}>Handled by Nurse</div>
          <div style={{padding:"12px",borderRadius:"10px",background:"#fafafa",border:"1px solid #f0f0f0"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:"#888",marginBottom:"4px"}}>Patient</div>
            <div style={{fontWeight:"800",fontSize:"15px"}}>{form.patName||"Not entered"}</div>
            <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>{form.regNo} · {form.dept||"No dept"}</div>
          </div>
          <div style={{fontSize:"13px",fontWeight:"700",color:"#0f172a",marginBottom:"-4px"}}>Vital Signs</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <Inp label="Weight (kg)" value={form.weight} onChange={v=>f("weight",v)} placeholder="e.g. 68"/>
            <Inp label="Height (cm)" value={form.height} onChange={v=>f("height",v)} placeholder="e.g. 170"/>
            <Inp label="Blood Pressure" value={form.bp} onChange={v=>f("bp",v)} placeholder="e.g. 120/80 mmHg"/>
            <Inp label="Pulse (bpm)" value={form.pulse} onChange={v=>f("pulse",v)} placeholder="e.g. 72"/>
            <Inp label="Temperature (°C)" value={form.temp} onChange={v=>f("temp",v)} placeholder="e.g. 37.2"/>
            <Inp label="Respiratory Rate" value={form.rr} onChange={v=>f("rr",v)} placeholder="e.g. 16 breaths/min"/>
            <Inp label="Oxygen Saturation" value={form.spo2} onChange={v=>f("spo2",v)} placeholder="e.g. 98%"/>
            <Inp label="Blood Sugar (optional)" value={form.bs} onChange={v=>f("bs",v)} placeholder="e.g. 5.6 mmol/L"/>
          </div>
          <Textarea label="Chief Complaint (brief)" value={form.chiefComplaint} onChange={v=>f("chiefComplaint",v)} placeholder="Brief description of main complaint..." rows={2}/>
          <Textarea label="Allergy Information (if newly identified)" value={form.allergies} onChange={v=>f("allergies",v)} placeholder="Any known allergies..." rows={2}/>
          {form.allergies&&<div style={{padding:"8px 12px",borderRadius:"8px",background:"#fef2f2",border:"1px solid #fecaca",fontSize:"12px",color:"#dc2626",fontWeight:"700"}}>⚠️ ALLERGY ALERT: {form.allergies}</div>}
        </>}

        {step===3&&<>
          <div style={{fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>Step 3 — Doctor Consultation</div>
          <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,fontWeight:"600"}}>Handled by Doctor — patient info auto-filled from registration</div>
          <div style={{padding:"14px",borderRadius:"12px",background:"#fafafa",border:"1px solid #f0f0f0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {[["Patient",form.patName||"—"],["Hospital No.",form.regNo],["Department",form.dept||"—"],["Doctor",form.doctor||"—"],["BP",form.bp||"—"],["Temp",form.temp||"—"],["Allergies",form.allergies||"None"],["Chief Complaint",form.chiefComplaint||"—"]].map(([l,v])=>(
              <div key={l}><div style={{fontSize:"10px",color:"#aaa",fontWeight:"700"}}>{l}</div><div style={{fontSize:"12px",fontWeight:"600",color:"#0f172a"}}>{v}</div></div>
            ))}
          </div>
          <Textarea label="History of Present Illness" value={form.hpi} onChange={v=>f("hpi",v)} placeholder="Detailed history of current illness, onset, duration, severity, associated symptoms..." rows={4}/>
          <Textarea label="Physical Examination Findings" value={form.exam} onChange={v=>f("exam",v)} placeholder="General appearance, systemic examination findings..." rows={3}/>
          <Inp label="Primary Diagnosis" value={form.dx1} onChange={v=>f("dx1",v)} placeholder="e.g. Hypertensive crisis, Malaria, Type 2 Diabetes..." required/>
          <Inp label="Secondary Diagnosis (optional)" value={form.dx2} onChange={v=>f("dx2",v)} placeholder="Additional diagnosis..."/>
          <Textarea label="Clinical Notes" value={form.clinicalNotes} onChange={v=>f("clinicalNotes",v)} placeholder="Additional clinical notes, observations..." rows={3}/>
        </>}

        {step===4&&<>
          <div style={{fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>Step 4 — Treatment Plan</div>
          <div style={{padding:"10px 14px",borderRadius:"10px",background:"#f0fdfa",border:"1px solid #ccfbf1",fontSize:"12px",color:TEALC,fontWeight:"600"}}>Prescriptions, lab requests, imaging and referrals</div>
          <Textarea label="Prescriptions / Medications" value={form.prescriptions} onChange={v=>f("prescriptions",v)} placeholder="Drug name — Dose — Frequency — Duration — Route&#10;e.g. Amlodipine 10mg — Once daily — 30 days — Oral" rows={4}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Textarea label="Laboratory Tests Ordered" value={form.labTests} onChange={v=>f("labTests",v)} placeholder="e.g. FBC, LFT, RFT, Malaria RDT, Blood culture..." rows={3}/>
            <Textarea label="Imaging Ordered" value={form.imaging} onChange={v=>f("imaging",v)} placeholder="e.g. Chest X-ray, Abdominal USS, CT scan..." rows={3}/>
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Patient Disposition</div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {["Discharge","Admit","Refer to Specialist","Emergency Transfer"].map(v=><RB key={v} label={v} fKey="disposition" val={v}/>)}
            </div>
          </div>
          {form.disposition==="Refer to Specialist"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Referral Specialist / Hospital" value={form.refDest} onChange={v=>f("refDest",v)} placeholder="e.g. Cardiology, LUTH..."/>
            <Textarea label="Reason for Referral" value={form.refReason} onChange={v=>f("refReason",v)} rows={2}/>
          </div>}
          {form.disposition==="Admit"&&<Inp label="Ward / Bed Assignment" value={form.ward} onChange={v=>f("ward",v)} placeholder="e.g. Male Medical Ward, Bed 5"/>}
          <Textarea label="Patient Counselling & Instructions" value={form.counselling} onChange={v=>f("counselling",v)} placeholder="Instructions given to patient — diet, lifestyle, medication compliance..." rows={3}/>
        </>}

        {step===5&&<>
          <div style={{fontSize:"16px",fontWeight:"800",color:"#0f172a"}}>Step 5 — Follow-up</div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"8px"}}>
            {["Yes","No"].map(v=><RB key={v} label={"Follow-up "+v} fKey="followup" val={v}/>)}
          </div>
          {form.followup==="Yes"&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <Inp label="Follow-up Date" value={form.fuDate} onChange={v=>f("fuDate",v)} type="date"/>
              <Sel label="Follow-up Clinic" value={form.fuClinic} onChange={v=>f("fuClinic",v)} options={["Same Doctor","General OPD","Cardiology","Pediatrics","Surgery","Other"]}/>
            </div>
            <Textarea label="Follow-up Reason / Instructions" value={form.fuReason} onChange={v=>f("fuReason",v)} placeholder="What to review on follow-up..." rows={2}/>
            {form.fuDate&&<div style={{padding:"10px 14px",borderRadius:"10px",background:"#eff6ff",border:"1px solid #bfdbfe",fontSize:"12px",color:"#1d4ed8"}}>🔔 Automatic reminder will be set for {form.fuDate}</div>}
          </div>}
          <div style={{padding:"14px",borderRadius:"12px",background:"#fafafa",border:"1px solid #f0f0f0"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:"#0f172a",marginBottom:"12px"}}>Consultation Summary</div>
            {[["Patient",form.patName||"—"],["Diagnosis",form.dx1||"—"],["Disposition",form.disposition||"—"],["Doctor",form.doctor||"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f5f5f5",fontSize:"13px"}}>
                <span style={{color:"#888",fontWeight:"600"}}>{l}</span><span style={{color:"#0f172a"}}>{v}</span>
              </div>
            ))}
          </div>
          <Inp label="Attending Doctor Signature" value={form.doctorSig} onChange={v=>f("doctorSig",v)} placeholder="Type doctor name as signature"/>
        </>}
      </div>

      <div style={{display:"flex",gap:"10px",marginTop:"20px",borderTop:"1px solid #f0f0f0",paddingTop:"16px"}}>
        {step>1&&<GhostBtn onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"12px"}}>Previous</GhostBtn>}
        {step<TOTAL
          ?<TealBtn onClick={()=>setStep(s=>s+1)} style={{flex:1,padding:"12px",fontSize:"14px"}}>Next Step</TealBtn>
          :<button onClick={()=>setSaved(true)} style={{flex:1,padding:"12px",borderRadius:"12px",border:"none",background:TEAL,color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer"}}>Save Consultation</button>
        }
      </div>
    </div>
  );
}

// ── GENERAL CONSULTATION (Dental, Optical, Wellness) ─────────────────────────
function GeneralConsultation({ onClose, businessType }) {
  const [form,setForm]=useState({consultDate:todayDate(),consultNo:"CON-"+Math.floor(Math.random()*9000+1000)});
  const [saved,setSaved]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const typeLabel=businessType==="dental"?"Dental":businessType==="optical"?"Optical / Eye":"Wellness";
  const typeIcon=businessType==="dental"?"🦷":businessType==="optical"?"👁":"🌿";
  const specialFields=()=>{
    if(businessType==="dental") return(
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a"}}>Dental Assessment</div>
        <Sel label="Chief Dental Complaint" value={form.dentalComplaint} onChange={v=>f("dentalComplaint",v)} options={["Toothache","Sensitivity","Bleeding Gums","Broken Tooth","Missing Tooth","Bad Breath","Tooth Discolouration","Jaw Pain","Swelling","Routine Checkup","Other"]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Tooth Number(s) Affected" value={form.toothNo} onChange={v=>f("toothNo",v)} placeholder="e.g. 16, 26, 36"/>
          <Sel label="Pain Level (1-10)" value={form.painLevel} onChange={v=>f("painLevel",v)} options={["1","2","3","4","5","6","7","8","9","10"]}/>
        </div>
        <Textarea label="Oral Examination Findings" value={form.oralExam} onChange={v=>f("oralExam",v)} placeholder="Gum condition, tooth decay, plaque, bite issues..." rows={3}/>
        <Sel label="Treatment Provided" value={form.dentalTx} onChange={v=>f("dentalTx",v)} options={["Scaling & Polishing","Extraction","Filling","Root Canal","Crown","Tooth Whitening","Orthodontic Review","X-ray","Prescription Only","Referral","Other"]}/>
      </div>
    );
    if(businessType==="optical") return(
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a"}}>Eye Examination</div>
        <Sel label="Chief Eye Complaint" value={form.eyeComplaint} onChange={v=>f("eyeComplaint",v)} options={["Blurry Vision","Eye Pain","Redness","Discharge","Itching","Floaters","Double Vision","Headaches","Routine Checkup","Other"]}/>
        <div style={{fontSize:"13px",fontWeight:"700",color:"#555",marginTop:"4px"}}>Visual Acuity</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Right Eye (OD)" value={form.vaOD} onChange={v=>f("vaOD",v)} placeholder="e.g. 6/6"/>
          <Inp label="Left Eye (OS)" value={form.vaOS} onChange={v=>f("vaOS",v)} placeholder="e.g. 6/12"/>
        </div>
        <div style={{fontSize:"13px",fontWeight:"700",color:"#555",marginTop:"4px"}}>Refraction / Prescription</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Right Sphere (SPH)" value={form.sphOD} onChange={v=>f("sphOD",v)} placeholder="e.g. -2.50"/>
          <Inp label="Left Sphere (SPH)" value={form.sphOS} onChange={v=>f("sphOS",v)} placeholder="e.g. -1.75"/>
          <Inp label="Right Cylinder (CYL)" value={form.cylOD} onChange={v=>f("cylOD",v)} placeholder="e.g. -0.75"/>
          <Inp label="Left Cylinder (CYL)" value={form.cylOS} onChange={v=>f("cylOS",v)} placeholder="e.g. -0.50"/>
          <Inp label="Right Axis" value={form.axisOD} onChange={v=>f("axisOD",v)} placeholder="e.g. 180"/>
          <Inp label="Left Axis" value={form.axisOS} onChange={v=>f("axisOS",v)} placeholder="e.g. 90"/>
        </div>
        <Sel label="Recommended" value={form.eyeRec} onChange={v=>f("eyeRec",v)} options={["Prescription Glasses","Contact Lenses","Both","Surgery Referral","No Correction Needed","Follow-up"]}/>
        <Textarea label="Eye Examination Notes" value={form.eyeNotes} onChange={v=>f("eyeNotes",v)} placeholder="Additional findings, IOP, fundus examination..." rows={3}/>
      </div>
    );
    if(businessType==="wellness") return(
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{fontSize:"14px",fontWeight:"700",color:"#0f172a"}}>Wellness Assessment</div>
        <Sel label="Wellness Goal" value={form.wellnessGoal} onChange={v=>f("wellnessGoal",v)} options={["Weight Loss","Weight Gain","Muscle Building","Stress Management","Chronic Disease Management","Nutritional Deficiency","General Wellness","Sports Nutrition","Pregnancy Nutrition","Other"]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Current Weight (kg)" value={form.weight} onChange={v=>f("weight",v)} placeholder="e.g. 80"/>
          <Inp label="Target Weight (kg)" value={form.targetWeight} onChange={v=>f("targetWeight",v)} placeholder="e.g. 70"/>
          <Inp label="Height (cm)" value={form.height} onChange={v=>f("height",v)} placeholder="e.g. 170"/>
          <Inp label="BMI" value={form.bmi} onChange={v=>f("bmi",v)} placeholder="Auto-calculated"/>
        </div>
        <Textarea label="Current Diet & Eating Habits" value={form.diet} onChange={v=>f("diet",v)} placeholder="Describe current diet, meal frequency, food preferences..." rows={3}/>
        <Textarea label="Physical Activity Level" value={form.activity} onChange={v=>f("activity",v)} placeholder="Exercise frequency, type, duration..." rows={2}/>
        <Textarea label="Nutrition / Wellness Plan" value={form.wellnessPlan} onChange={v=>f("wellnessPlan",v)} placeholder="Recommended diet plan, supplements, lifestyle changes..." rows={3}/>
      </div>
    );
    return null;
  };
  if(saved)return(<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div><div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Consultation Saved!</div><div style={{fontSize:"14px",color:"#888",marginBottom:"24px"}}>Consultation #{form.consultNo} recorded.</div><div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}><TealBtn onClick={()=>{setForm({consultDate:todayDate(),consultNo:"CON-"+Math.floor(Math.random()*9000+1000)});setSaved(false);}}>New Consultation</TealBtn><GhostBtn onClick={onClose}>Back to List</GhostBtn></div></div>);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>👤 Patient Information</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Full Name *" value={form.patName} onChange={v=>f("patName",v)} placeholder="Patient full name" required/>
          <Inp label="Phone Number" value={form.phone} onChange={v=>f("phone",v)} placeholder="08012345678"/>
          <Inp label="Age" value={form.age} onChange={v=>f("age",v)} placeholder="e.g. 35"/>
          <Sel label="Gender" value={form.gender} onChange={v=>f("gender",v)} options={["Male","Female","Other"]}/>
          <Inp label="Date" value={form.consultDate} onChange={v=>f("consultDate",v)} type="date"/>
          <Inp label="Consultation No." value={form.consultNo} onChange={v=>f("consultNo",v)}/>
        </div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>🏥 Medical History</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <Textarea label="Existing Medical Conditions" value={form.medHistory} onChange={v=>f("medHistory",v)} placeholder="Any known conditions..." rows={2}/>
          <Textarea label="Current Medications" value={form.medications} onChange={v=>f("medications",v)} placeholder="List current medications..." rows={2}/>
          <Textarea label="Allergies" value={form.allergies} onChange={v=>f("allergies",v)} placeholder="Known allergies..." rows={2}/>
        </div>
      </Card>
      <Card style={{padding:"16px"}}>{specialFields()}</Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>📋 Assessment & Plan</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <Textarea label="Practitioner Assessment" value={form.assessment} onChange={v=>f("assessment",v)} placeholder="Clinical assessment and findings..." rows={3}/>
          <Textarea label="Treatment / Recommendations" value={form.treatment} onChange={v=>f("treatment",v)} placeholder="Treatment provided and recommendations..." rows={3}/>
          <Textarea label="Counselling Notes" value={form.counselling} onChange={v=>f("counselling",v)} placeholder="Advice and counselling given..." rows={2}/>
        </div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>📅 Follow-up</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <Inp label="Follow-up Date" value={form.fuDate} onChange={v=>f("fuDate",v)} type="date"/>
          <Sel label="Method" value={form.fuMethod} onChange={v=>f("fuMethod",v)} options={["In-Person","Phone Call","WhatsApp","SMS"]}/>
        </div>
        {form.fuDate&&<div style={{marginTop:"10px",padding:"10px",borderRadius:"8px",background:"#f0fdfa",fontSize:"12px",color:TEALC}}>🔔 Reminder set for {form.fuDate}</div>}
      </Card>
      <div style={{display:"flex",gap:"10px"}}>
        <TealBtn onClick={()=>setSaved(true)} style={{flex:1,padding:"13px",fontSize:"14px"}}>Save Consultation</TealBtn>
        <GhostBtn onClick={()=>setSaved(true)} style={{flex:1,padding:"13px"}}>Save & Print</GhostBtn>
      </div>
    </div>
  );
}


function PharmacyConsultation({ onClose, products }) {
  const [form,setForm]=useState({consultDate:todayDate(),consultNo:"CON-"+Math.floor(Math.random()*9000+1000)});const [medicines,setMedicines]=useState([]);const [medSearch,setMedSearch]=useState("");const [saved,setSaved]=useState(false);const [selPatient,setSelPatient]=useState(null);const [patSearch,setPatSearch]=useState("");const [showPats,setShowPats]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const patResults=CLIENTS.filter(c=>c.name.toLowerCase().includes(patSearch.toLowerCase()));
  const medResults=products.filter(p=>p.cat==="Medicines"&&(p.name.toLowerCase().includes(medSearch.toLowerCase())||(p.genericName||"").toLowerCase().includes(medSearch.toLowerCase())));
  const addMed=m=>{setMedicines(prev=>[...prev,{...m,dose:"",freq:"",dur:"",qty:"",notes:""}]);setMedSearch("");};
  const updMed=(i,k,v)=>setMedicines(prev=>prev.map((m,j)=>j===i?{...m,[k]:v}:m));
  if(saved)return(<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div><div style={{fontSize:"22px",fontWeight:"900",marginBottom:"8px"}}>Consultation Saved!</div><div style={{fontSize:"14px",color:"#888",marginBottom:"24px"}}>Consultation #{form.consultNo} recorded.</div><div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}><TealBtn onClick={()=>{setForm({consultDate:todayDate(),consultNo:"CON-"+Math.floor(Math.random()*9000+1000)});setMedicines([]);setSelPatient(null);setSaved(false);}}>New Consultation</TealBtn><GhostBtn onClick={onClose}>Back</GhostBtn></div></div>);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div style={{padding:"16px",borderRadius:"14px",background:"#f0fdfa",border:"1px solid #ccfbf1"}}>
        <div style={{fontSize:"13px",fontWeight:"700",color:TEALC,marginBottom:"10px"}}>👤 Patient</div>
        {selPatient?<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}><div style={{display:"flex",alignItems:"center",gap:"12px"}}><Avatar name={selPatient.name} size={40}/><div><div style={{fontWeight:"800",fontSize:"14px"}}>{selPatient.name}</div><div style={{fontSize:"12px",color:"#dc2626",fontWeight:"700",marginTop:"2px"}}>⚠️ Allergy: Penicillin</div></div></div><GhostBtn onClick={()=>setSelPatient(null)}>Change</GhostBtn></div>
        :<div><div style={{position:"relative"}}><input value={patSearch} onChange={e=>{setPatSearch(e.target.value);setShowPats(true);}} placeholder="Search patient..." style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>{showPats&&patSearch&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:10,marginTop:"4px",overflow:"hidden"}}>{patResults.map(p=><button key={p.id} onClick={()=>{setSelPatient(p);setShowPats(false);setPatSearch("");}} style={{width:"100%",padding:"10px 14px",border:"none",background:"white",cursor:"pointer",textAlign:"left",borderBottom:"1px solid #f5f5f5"}}><div style={{fontWeight:"700",fontSize:"13px"}}>{p.name}</div><div style={{fontSize:"11px",color:"#888"}}>{p.visits} visits · {p.last}</div></button>)}</div>}</div><TealBtn onClick={()=>{}} style={{marginTop:"8px",fontSize:"12px",padding:"7px 14px"}}>+ Register New Patient</TealBtn></div>}
      </div>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>📋 Consultation Info</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}><Inp label="Date" value={form.consultDate} onChange={v=>f("consultDate",v)} type="date"/><Inp label="Consultation No." value={form.consultNo} onChange={v=>f("consultNo",v)}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginTop:"12px"}}><Sel label="Reason for Visit" value={form.reason} onChange={v=>f("reason",v)} options={["New Complaint","Follow-up","Repeat Prescription","Medication Counselling","OTC Request","Referral","Health Screening","Other"]}/><Inp label="Duration of Symptoms" value={form.duration} onChange={v=>f("duration",v)} placeholder="e.g. 3 days"/></div>
        <div style={{marginTop:"12px"}}><Textarea label="Chief Complaint" value={form.complaint} onChange={v=>f("complaint",v)} placeholder="Patient's main complaint..."/></div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>🏥 Medical History</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <Textarea label="Existing Conditions" value={form.conditions} onChange={v=>f("conditions",v)} placeholder="e.g. Hypertension, Diabetes..." rows={2}/>
          <Textarea label="Current Medications" value={form.currentMeds} onChange={v=>f("currentMeds",v)} placeholder="List medications..." rows={2}/>
          <div><Textarea label="Drug Allergies" value={form.allergies} onChange={v=>f("allergies",v)} placeholder="e.g. Penicillin..." rows={2}/>{form.allergies&&<div style={{marginTop:"6px",padding:"8px 12px",borderRadius:"8px",background:"#fef2f2",border:"1px solid #fecaca",fontSize:"12px",color:"#dc2626",fontWeight:"700"}}>⚠️ ALLERGY ALERT: {form.allergies}</div>}</div>
        </div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"4px"}}>🩺 Vital Signs <span style={{fontSize:"11px",color:"#aaa",fontWeight:"400"}}>(Optional)</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"10px"}}>
          <Inp label="Blood Pressure" value={form.bp} onChange={v=>f("bp",v)} placeholder="120/80 mmHg"/>
          <Inp label="Blood Sugar" value={form.bs} onChange={v=>f("bs",v)} placeholder="5.6 mmol/L"/>
          <Inp label="Temperature" value={form.temp} onChange={v=>f("temp",v)} placeholder="37.2°C"/>
          <Inp label="Weight" value={form.weight} onChange={v=>f("weight",v)} placeholder="68 kg"/>
        </div>
        <div style={{marginTop:"10px"}}><Textarea label="Pharmacist Assessment" value={form.assessment} onChange={v=>f("assessment",v)} placeholder="Brief clinical assessment..." rows={2}/></div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>💊 Medication Recommendation</div>
        <div style={{position:"relative",marginBottom:"12px"}}>
          <input value={medSearch} onChange={e=>setMedSearch(e.target.value)} placeholder="Search medicines from inventory by name or generic name..."
            style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/>
          {medSearch&&medResults.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:10,marginTop:"4px",overflow:"hidden"}}>
            {medResults.map(m=><button key={m.id} onClick={()=>addMed(m)} style={{width:"100%",padding:"10px 14px",border:"none",background:"white",cursor:"pointer",textAlign:"left",borderBottom:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:"700",fontSize:"13px"}}>{m.emoji} {m.name}</div>{m.genericName&&<div style={{fontSize:"11px",color:"#888"}}>{m.genericName} · {m.stock} in stock</div>}</div>
              <span style={{color:TEALC,fontWeight:"700",fontSize:"12px"}}>+ Add</span>
            </button>)}
          </div>}
        </div>
        {medicines.length===0?<div style={{textAlign:"center",padding:"20px",color:"#ddd",fontSize:"13px"}}>Search above to add medicines</div>:medicines.map((med,idx)=>(
          <div key={idx} style={{padding:"12px",borderRadius:"12px",border:"1px solid #e5e7eb",marginBottom:"10px",background:"#fafafa"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><div style={{fontWeight:"700",fontSize:"13px"}}>{med.emoji} {med.name}</div><button onClick={()=>setMedicines(prev=>prev.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontWeight:"700",fontSize:"12px"}}>✕</button></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              <Inp label="Dose" value={med.dose} onChange={v=>updMed(idx,"dose",v)} placeholder="e.g. 500mg"/>
              <Inp label="Frequency" value={med.freq} onChange={v=>updMed(idx,"freq",v)} placeholder="e.g. Twice daily"/>
              <Inp label="Duration" value={med.dur} onChange={v=>updMed(idx,"dur",v)} placeholder="e.g. 5 days"/>
              <Inp label="Quantity" value={med.qty} onChange={v=>updMed(idx,"qty",v)} placeholder="e.g. 10 tablets"/>
            </div>
            <div style={{marginTop:"8px"}}><Inp label="Instructions" value={med.notes} onChange={v=>updMed(idx,"notes",v)} placeholder="e.g. Take after meals"/></div>
          </div>
        ))}
        <Textarea label="Counselling Notes" value={form.counselling} onChange={v=>f("counselling",v)} placeholder="Counselling given to patient..." rows={2}/>
        <div style={{marginTop:"10px"}}><Textarea label="Non-Drug Recommendations" value={form.nonDrug} onChange={v=>f("nonDrug",v)} placeholder="e.g. Rest, increase fluids..." rows={2}/></div>
      </Card>
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"12px"}}>🏥 Referral & Follow-up</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Referral Required?</div>
            <div style={{display:"flex",gap:"8px"}}>{["Yes","No"].map(v=><label key={v} style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 12px",borderRadius:"8px",border:"1px solid"+(form.referral===v?TEALC:"#e5e7eb"),background:form.referral===v?"#f0fdfa":"white",cursor:"pointer",fontSize:"13px"}}><input type="radio" checked={form.referral===v} onChange={()=>f("referral",v)} style={{accentColor:TEALC}}/>{v}</label>)}</div>
            {form.referral==="Yes"&&<div style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"8px"}}><Inp label="Referral Destination" value={form.refDest} onChange={v=>f("refDest",v)} placeholder="e.g. Lagos General Hospital"/><Textarea label="Reason" value={form.refReason} onChange={v=>f("refReason",v)} rows={2}/></div>}
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"8px"}}>Follow-up Required?</div>
            <div style={{display:"flex",gap:"8px"}}>{["Yes","No"].map(v=><label key={v} style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 12px",borderRadius:"8px",border:"1px solid"+(form.followup===v?TEALC:"#e5e7eb"),background:form.followup===v?"#f0fdfa":"white",cursor:"pointer",fontSize:"13px"}}><input type="radio" checked={form.followup===v} onChange={()=>f("followup",v)} style={{accentColor:TEALC}}/>{v}</label>)}</div>
            {form.followup==="Yes"&&<div style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"8px"}}><Inp label="Follow-up Date" value={form.fuDate} onChange={v=>f("fuDate",v)} type="date"/><Sel label="Method" value={form.fuMethod} onChange={v=>f("fuMethod",v)} options={["In-Person","Phone Call","WhatsApp","SMS"]}/></div>}
            {form.followup==="Yes"&&form.fuDate&&<div style={{marginTop:"8px",padding:"8px",borderRadius:"8px",background:"#eff6ff",fontSize:"12px",color:"#1d4ed8"}}>🔔 Reminder set for {form.fuDate}</div>}
          </div>
        </div>
      </Card>
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
        <TealBtn onClick={()=>setSaved(true)} style={{flex:1,padding:"13px",fontSize:"14px"}}>✓ Save Consultation</TealBtn>
        <GhostBtn onClick={()=>setSaved(true)} style={{flex:1,padding:"13px"}}>🖨️ Save & Print</GhostBtn>
        {form.followup==="Yes"&&<GhostBtn onClick={()=>setSaved(true)} style={{flex:1,padding:"13px"}}>📅 Save & Schedule Follow-up</GhostBtn>}
      </div>
    </div>
  );
}

function ConsultationPage({ businessType, products }) {
  const [view,setView]=useState("list");const [selC,setSelC]=useState(null);
  const past=[{id:1,client:"Ngozi Adeyemi",date:"Jun 10",staff:"Dr. Sade",type:"New Complaint",status:"completed"},{id:2,client:"Fatima Bello",date:"Jun 5",staff:"Dr. Amara",type:"Follow-up",status:"completed"},{id:3,client:"Chisom Obi",date:"May 28",staff:"Dr. Sade",type:"Repeat Prescription",status:"completed"}];
  const formTitle=()=>{
    if(businessType==="pharmacy") return "Pharmacy Consultation";
    if(businessType==="hospital") return "Hospital Consultation";
    if(businessType==="dental") return "Dental Consultation";
    if(businessType==="optical") return "Optical / Eye Consultation";
    if(businessType==="wellness") return "Wellness Consultation";
    return "Skincare Consultation";
  };
  const renderForm=()=>{
    if(businessType==="pharmacy") return <PharmacyConsultation onClose={()=>setView("list")} products={products}/>;
    if(businessType==="hospital") return <HospitalConsultation onClose={()=>setView("list")}/>;
    if(businessType==="dental"||businessType==="optical"||businessType==="wellness") return <GeneralConsultation onClose={()=>setView("list")} businessType={businessType}/>;
    return <SkincareConsultation onClose={()=>setView("list")}/>;
  };
  if(view==="new")return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
        <button onClick={()=>setView("list")} style={{width:"36px",height:"36px",borderRadius:"10px",background:"white",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div><div style={{fontWeight:"900",fontSize:"18px",color:"#0f172a"}}>{formTitle()}</div><div style={{fontSize:"12px",color:"#aaa"}}>New consultation record</div></div>
      </div>
      {renderForm()}
    </div>
  );
  return(<div><SectionHead title="Consultations" sub={businessType==="pharmacy"?"Patient records":"Client records"} btn="+ New Consultation" onBtn={()=>setView("new")}/><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}><StatCard icon="📋" label="Total" value={past.length}/><StatCard icon="📅" label="This Month" value="2"/><StatCard icon="⏳" label="Pending Follow-up" value="1"/></div><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Client","Date","Staff","Type","Status","Action"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{past.map(c=>(<tr key={c.id} style={{borderBottom:"1px solid #f9f9f9"}}><td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={c.client} size={30}/><span style={{fontWeight:"700",fontSize:"13px"}}>{c.client}</span></div></td><td style={{padding:"12px 16px",fontSize:"12px",color:"#aaa"}}>{c.date}</td><td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{c.staff}</td><td style={{padding:"12px 16px"}}><Pill label={c.type} type="teal"/></td><td style={{padding:"12px 16px"}}><Pill label={c.status} type="green"/></td><td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:"6px"}}><GhostBtn onClick={()=>setSelC(c)}>View</GhostBtn><GhostBtn>PDF</GhostBtn></div></td></tr>))}</tbody></table></div></Card><Modal show={!!selC} onClose={()=>setSelC(null)} title="Consultation Summary">{selC&&[["Client",selC.client],["Date",selC.date],["Staff",selC.staff],["Type",selC.type],["Status",selC.status]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f9f9f9",fontSize:"13px"}}><span style={{color:"#888",fontWeight:"600"}}>{l}</span><span style={{color:"#0f172a"}}>{v}</span></div>)}</Modal></div>);
}

// BUSINESS DASHBOARD
const NAV_ITEMS_DEFAULT=[["dashboard","🏠","Dashboard"],["appointments","📅","Appointments"],["consultation","📋","Consultations"],["clients","👥","Clients"],["pos","🛒","POS / Sales"],["inventory","📦","Inventory"],["carefind","🔍","CareFind Profile"],["expenses","💸","Expenses"],["debts","🏦","Debts"],["reports","📊","Reports"],["settings","⚙️","Settings"]];
const NAV_ITEMS_HOSPITAL=[["dashboard","🏠","Dashboard"],["reception","👩‍💼","Reception"],["triage","🏥","Triage"],["doctor","👨‍⚕️","Doctor"],["rx_inbox","💊","Prescription Inbox"],["inventory","📦","Inventory"],["carefind","🔍","CareFind Profile"],["expenses","💸","Expenses"],["debts","🏦","Debts"],["reports","📊","Reports"],["settings","⚙️","Settings"]];
const NAV_ITEMS=[];

function BusinessDashboard({ brand, onLogout }) {
  const [page,setPage]=useState("dashboard");const [products,setProducts]=useState(INIT_PRODUCTS);const [toast,setToast]=useState("");
  const bType=(brand.business_type||brand.type||"skincare");const bIcon=businessIcon(bType);
  const isHospital=bType==="hospital";
  const navItems=isHospital?NAV_ITEMS_HOSPITAL:NAV_ITEMS_DEFAULT;

  const renderPage=()=>{
    switch(page){
      case "dashboard":return(
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={{borderRadius:"20px",padding:"24px",color:"white",backgroundImage:DARK,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:"-20px",top:"-20px",width:"120px",height:"120px",borderRadius:"50%",background:"rgba(20,184,166,0.1)"}}/>
            <div style={{fontSize:"13px",opacity:0.7,marginBottom:"4px"}}>Welcome back 👋</div>
            <div style={{fontSize:"24px",fontWeight:"900"}}>{brand.owner}</div>
            <div style={{fontSize:"13px",opacity:0.6,marginTop:"4px"}}>{bIcon} {brand.name}</div>
            <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 12px",borderRadius:"20px",background:"rgba(20,184,166,0.2)",fontSize:"12px",color:"#14b8a6",fontWeight:"600"}}>{bIcon} {businessName(bType)}</div>
              {(brand.visible_on_carefind||brand.visibleOnCareFind)&&<div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 12px",borderRadius:"20px",background:"rgba(20,184,166,0.2)",fontSize:"12px",color:"#14b8a6",fontWeight:"600"}}>🔍 Live on CareFind</div>}
            </div>
          </div>
          {isHospital?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"14px"}}>
                <div onClick={()=>setPage("reception")} style={{cursor:"pointer"}}><StatCard icon="👩‍💼" label="Reception" value="Register" sub="Tap to register new patient"/></div>
                <div onClick={()=>setPage("triage")} style={{cursor:"pointer"}}><StatCard icon="🏥" label="Triage" value="Vitals" sub="Patients from Reception"/></div>
                <div onClick={()=>setPage("doctor")} style={{cursor:"pointer"}}><StatCard icon="👨‍⚕️" label="Doctor" value="Consult" sub="Patients from Triage"/></div>
                <div onClick={()=>setPage("rx_inbox")} style={{cursor:"pointer"}}><StatCard icon="💊" label="Pharmacy Inbox" value="Rx" sub="Prescriptions from Doctors" alert/></div>
              </div>
              <div style={{padding:"20px",borderRadius:"16px",background:"#f0fdfa",border:"1px solid #ccfbf1"}}>
                <div style={{fontWeight:"800",fontSize:"15px",marginBottom:"14px",color:"#0f172a"}}>Hospital Patient Flow</div>
                <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap",fontSize:"12px"}}>
                  {[["👩‍💼","Reception"],["→",""],["🏥","Triage"],["→",""],["👨‍⚕️","Doctor"],["→",""],["💊","Pharmacy"]].map((item,i)=>(
                    item[0]==="→"
                      ?<span key={i} style={{color:"#aaa",fontSize:"16px",fontWeight:"700"}}>→</span>
                      :<div key={i} style={{padding:"10px 14px",borderRadius:"10px",background:"white",border:"1px solid #ccfbf1",textAlign:"center",cursor:"pointer"}} onClick={()=>setPage(item[0]==="👩‍💼"?"reception":item[0]==="🏥"?"triage":item[0]==="👨‍⚕️"?"doctor":"rx_inbox")}>
                        <div style={{fontSize:"22px",marginBottom:"4px"}}>{item[0]}</div>
                        <div style={{fontWeight:"700",fontSize:"12px",color:"#0f172a"}}>{item[1]}</div>
                      </div>
                  ))}
                </div>
                <div style={{marginTop:"14px",fontSize:"12px",color:"#555",lineHeight:"1.7"}}>
                  Each department sees only what they need. Patient data flows automatically — no duplicate entry needed.
                </div>
              </div>
            </>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"14px"}}>
                <StatCard icon="👥" label="Total Clients" value="124" sub="+8 this month"/>
                <StatCard icon="📅" label="Today's Appointments" value="7" sub="3 confirmed"/>
                <StatCard icon="💰" label="Monthly Revenue" value="284,500" sub="+12% vs last month"/>
                <StatCard icon="🔍" label="Products on CareFind" value={products.filter(p=>p.listOnCareFind&&p.stock>0).length} sub="Visible to patients nearby"/>
              </div>
              {(brand.visible_on_carefind||brand.visibleOnCareFind)&&(
                <div style={{padding:"16px 20px",borderRadius:"14px",background:"#f0fdfa",border:"1px solid #ccfbf1",display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
                  <div style={{fontSize:"24px"}}>🔍</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:"700",color:TEALC,fontSize:"14px"}}>Your business is live on CareFind</div>
                    <div style={{fontSize:"12px",color:"#555",marginTop:"2px"}}>{products.filter(p=>p.listOnCareFind&&p.stock>0).length} products visible · WhatsApp: {brand.whatsapp||"Not set"}</div>
                  </div>
                  <button onClick={()=>setPage("carefind")} style={{padding:"8px 16px",borderRadius:"10px",border:"none",background:TEAL,color:"white",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Manage CareFind</button>
                </div>
              )}
              <Card>
                <div style={{padding:"16px 20px",borderBottom:"1px solid #f5f5f5",fontWeight:"800",fontSize:"15px"}}>Today's Appointments</div>
                {APPOINTMENTS.map(a=>(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 20px",borderBottom:"1px solid #f9f9f9"}}>
                    <Avatar name={a.client} size={34}/>
                    <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:"700"}}>{a.client}</div><div style={{fontSize:"11px",color:"#aaa"}}>{a.service} · {a.staff}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:"12px",fontWeight:"700",color:"#555"}}>{a.time}</div><Pill label={a.status} type={a.status==="confirmed"?"green":"amber"}/></div>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      );
      case "consultation":return<ConsultationPage businessType={bType} products={products}/>;
      case "reception":return<ReceptionModule brand={brand} onPatientSent={()=>{}}/>;
      case "triage":return<TriageModule brand={brand}/>;
      case "doctor":return<DoctorModule brand={brand} products={products}/>;
      case "rx_inbox":return<PrescriptionInbox brand={brand} products={products}/>;
      case "pos":return<div style={{height:"calc(100vh - 60px)",display:"flex",flexDirection:"column"}}><InlinePOS products={products} setProducts={setProducts}/></div>;
      case "inventory":return<InventoryPage products={products} setProducts={setProducts} brand={brand}/>;
      case "carefind":return<PublicProfilePage brand={brand} products={products}/>;
      case "appointments":return(<div><SectionHead title="Appointments" sub="All bookings" btn="+ New Appointment"/><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Client","Service","Time","Staff","Status"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{APPOINTMENTS.map(a=><tr key={a.id} style={{borderBottom:"1px solid #f9f9f9"}}><td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={a.client} size={30}/><span style={{fontWeight:"700",fontSize:"13px"}}>{a.client}</span></div></td><td style={{padding:"12px 16px",fontSize:"13px",color:"#666"}}>{a.service}</td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"700"}}>{a.time}</td><td style={{padding:"12px 16px",fontSize:"13px",color:"#888"}}>{a.staff}</td><td style={{padding:"12px 16px"}}><Pill label={a.status} type={a.status==="confirmed"?"green":"amber"}/></td></tr>)}</tbody></table></div></Card></div>);
      case "clients":return(<div><SectionHead title={bType==="pharmacy"?"Patients":"Clients"} sub="All records" btn="+ Add"/><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Name","Type","Visits","Last Visit","Total Spend"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{CLIENTS.map(c=><tr key={c.id} style={{borderBottom:"1px solid #f9f9f9"}}><td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:"8px"}}><Avatar name={c.name} size={30} bg="linear-gradient(135deg,#8b5cf6,#a78bfa)"/><span style={{fontWeight:"700",fontSize:"13px"}}>{c.name}</span></div></td><td style={{padding:"12px 16px"}}><Pill label={c.type} type={c.type==="New"?"blue":"teal"}/></td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"700"}}>{c.visits}</td><td style={{padding:"12px 16px",fontSize:"13px",color:"#888"}}>{c.last}</td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"900"}}>{fmt(c.spend)}</td></tr>)}</tbody></table></div></Card></div>);
      case "expenses":return(<div><SectionHead title="Expenses" sub="Track all spending" btn="+ Log Expense"/><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}><StatCard icon="💸" label="Total This Month" value={fmt(EXPENSES.reduce((s,e)=>s+e.amount,0))}/><StatCard icon="🏠" label="Biggest" value="Rent"/><StatCard icon="📊" label="vs Revenue" value="-61%"/></div><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Category","Description","Amount","Date"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{EXPENSES.map(e=><tr key={e.id} style={{borderBottom:"1px solid #f9f9f9"}}><td style={{padding:"12px 16px"}}><Pill label={e.cat} type="teal"/></td><td style={{padding:"12px 16px",fontSize:"13px",color:"#555"}}>{e.desc}</td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"900"}}>{fmt(e.amount)}</td><td style={{padding:"12px 16px",fontSize:"12px",color:"#aaa"}}>{e.date}</td></tr>)}</tbody></table></div></Card></div>);
      case "debts":return(<div><SectionHead title="Debt Management" sub="Track money owed" btn="+ Record Debt"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"20px"}}><Card style={{padding:"18px",borderLeft:"4px solid #059669"}}><div style={{fontSize:"12px",color:"#888",fontWeight:"600"}}>Clients Owe You</div><div style={{fontSize:"24px",fontWeight:"900",marginTop:"4px"}}>₦23,500</div></Card><Card style={{padding:"18px",borderLeft:"4px solid #ef4444"}}><div style={{fontSize:"12px",color:"#888",fontWeight:"600"}}>You Owe Suppliers</div><div style={{fontSize:"24px",fontWeight:"900",marginTop:"4px"}}>₦45,000</div></Card></div><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"1px solid #f5f5f5",background:"#fafafa"}}>{["Direction","Party","Amount","Due","Status"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"700",color:"#aaa",textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{DEBTS.map(d=><tr key={d.id} style={{borderBottom:"1px solid #f9f9f9"}}><td style={{padding:"12px 16px"}}><Pill label={d.dir==="owes_us"?"↓ Owed to us":"↑ We owe"} type={d.dir==="owes_us"?"green":"red"}/></td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"700"}}>{d.party}</td><td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"900"}}>{fmt(d.amount)}</td><td style={{padding:"12px 16px",fontSize:"12px",color:"#aaa"}}>{d.due}</td><td style={{padding:"12px 16px"}}><Pill label={d.status} type={d.status==="overdue"?"red":"amber"}/></td></tr>)}</tbody></table></div></Card></div>);
      case "reports":return(<div><SectionHead title="Reports & Analytics"/><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"20px"}}><StatCard icon="💰" label="Total Revenue" value="₦1,389,500"/><StatCard icon="💸" label="Total Expenses" value="₦935,000"/><StatCard icon="📈" label="Net Profit" value="₦454,500"/></div><Card style={{padding:"24px",marginBottom:"20px"}}><div style={{fontWeight:"800",fontSize:"16px",marginBottom:"20px"}}>Revenue vs Expenses (6 months)</div>{["Jan","Feb","Mar","Apr","May","Jun"].map((m,i)=>{const rev=[180000,210000,195000,250000,270000,284500];const exp=[120000,135000,140000,160000,180000,200000];return<div key={m} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}><span style={{width:"28px",fontSize:"12px",color:"#aaa"}}>{m}</span><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}><div style={{height:"8px",borderRadius:"4px",background:TEAL,width:((rev[i]/284500)*100)+"%",minWidth:"4px"}}/><span style={{fontSize:"11px",color:"#888"}}>₦{(rev[i]/1000).toFixed(0)}k</span></div><div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{height:"8px",borderRadius:"4px",background:"#fecaca",width:((exp[i]/284500)*100)+"%",minWidth:"4px"}}/><span style={{fontSize:"11px",color:"#aaa"}}>₦{(exp[i]/1000).toFixed(0)}k</span></div></div></div>;})}  </Card><div style={{display:"flex",gap:"10px"}}>{["Export PDF","Export Excel","Print Report"].map(l=><GhostBtn key={l}>{l}</GhostBtn>)}</div></div>);
      case "settings":return(<div><SectionHead title="Settings"/><Card style={{padding:"28px",maxWidth:"520px"}}><div style={{marginBottom:"20px",padding:"14px",borderRadius:"12px",background:"#f0fdfa",border:"1px solid #ccfbf1",display:"flex",alignItems:"center",gap:"12px"}}><div style={{fontSize:"28px"}}>{bIcon}</div><div><div style={{fontWeight:"800",fontSize:"14px",color:"#0f172a"}}>{businessName(bType)}</div><div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>Your business type determines your consultation form</div></div></div>{[["Business Name",brand.name],["Owner Name",brand.owner],["Email",brand.email],["Phone",brand.phone],["WhatsApp",brand.whatsapp||""],["Business Hours",brand.hours||""],["Address",brand.address]].map(([l,v])=>(<div key={l} style={{marginBottom:"14px"}}><div style={{fontSize:"11px",fontWeight:"700",color:"#666",marginBottom:"6px"}}>{l}</div><input defaultValue={v} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"13px",outline:"none",boxSizing:"border-box"}}/></div>))}<Toggle label="Visible on CareFind" desc="Allow patients to find your business on the public CareFind search platform" value={(brand.visible_on_carefind||brand.visibleOnCareFind)||false} onChange={()=>{}}/><TealBtn style={{width:"100%",padding:"12px",marginTop:"16px"}}>Save Changes</TealBtn></Card></div>);
      default:return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",textAlign:"center"}}><div style={{fontSize:"56px",marginBottom:"16px"}}>🔨</div><div style={{fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>{(navItems.find(n=>n[0]===page)||[])[2]||page}</div><div style={{fontSize:"14px",color:"#aaa"}}>Coming soon</div></div>);
    }
  };

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>
      <div style={{width:"210px",flexShrink:0,backgroundImage:DARK,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>{bIcon}</div>
            <div><div style={{color:"white",fontWeight:"800",fontSize:"12px",lineHeight:"1.3",maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brand.name}</div><div style={{color:"#14b8a6",fontSize:"10px",marginTop:"2px"}}>{businessName(bType).split("/")[0].trim()}</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"8px"}}>
          {navItems.map(([id,icon,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"10px",border:"none",cursor:"pointer",fontWeight:"600",fontSize:"12px",marginBottom:"1px",textAlign:"left",background:page===id?"rgba(20,184,166,0.15)":"transparent",color:page===id?"#14b8a6":"rgba(255,255,255,0.55)"}}>
              <span style={{fontSize:"15px"}}>{icon}</span>{label}
              {id==="carefind"&&(brand.visible_on_carefind||brand.visibleOnCareFind)&&<span style={{marginLeft:"auto",width:"6px",height:"6px",borderRadius:"50%",background:"#14b8a6",flexShrink:0}}/>}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.08)"}}><div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",marginBottom:"6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brand.email}</div><button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:"11px"}}>→ Sign Out</button></div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"white",borderBottom:"1px solid #f0f0f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontWeight:"800",fontSize:"16px",color:"#0f172a"}}>{(navItems.find(n=>n[0]===page)||[])[2]||page}</div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{position:"relative"}}><button style={{width:"36px",height:"36px",borderRadius:"10px",background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:"18px"}}>🔔</button><div style={{position:"absolute",top:"-4px",right:"-4px",width:"16px",height:"16px",borderRadius:"50%",background:"#ef4444",color:"white",fontSize:"9px",fontWeight:"900",display:"flex",alignItems:"center",justifyContent:"center"}}>3</div></div>
            <Avatar name={brand.owner} size={34}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:page==="pos"?"0":"24px",background:"#f9fafb"}}>{renderPage()}</div>
      </div>
      <Toast msg={toast}/>
    </div>
  );
}

// ROOT APP
export default function CareHub() {
  const [screen,setScreen]=useState("landing");const [brands,setBrands]=useState(INIT_BRANDS);const [currentBrand,setCurrentBrand]=useState(null);
  const handleSubmit=data=>{
    setBrands(prev=>[...prev,{id:prev.length+1,name:data.businessName,owner:data.firstName+" "+data.lastName,email:data.ownerEmail,phone:data.ownerPhone||"--",whatsapp:data.whatsapp||"",address:data.address||"--",state:data.state||"",city:data.city||"",lat:parseFloat(data.lat)||0,lng:parseFloat(data.lng)||0,hours:data.businessHours||"",mapsLink:data.mapsLink||"",status:"pending",date:new Date().toLocaleDateString("en-NG"),password:data.password,type:data.businessType||"skincare",visibleOnCareFind:data.visibleOnCareFind!==false}]);
  };
  if(screen==="landing") return<LandingPage onLogin={()=>setScreen("login")} onRegister={()=>setScreen("register")}/>;
  if(screen==="register") return<Registration onBack={()=>setScreen("login")} onSubmitted={handleSubmit}/>;
  if(screen==="admin") return<AdminDashboard onLogout={()=>setScreen("landing")}/>;
  if(screen==="business"&&currentBrand) return<BusinessDashboard brand={currentBrand} onLogout={()=>{setCurrentBrand(null);setScreen("landing");}}/>;
  return<LoginScreen brands={brands} onAdminLogin={()=>setScreen("admin")} onBrandLogin={b=>{setCurrentBrand(b);setScreen("business");}} onRegister={()=>setScreen("register")} onHome={()=>setScreen("landing")}/>;
}
