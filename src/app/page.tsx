"use client";
"use client";
// V31.2 FINAL - FIXED...
import { useState, useEffect, useMemo, useRef } from "react";
// V31.2 FINAL - FIXED - Prerender Error Fix + inr Safety + catch Fix - 3 Parts
import { useState, useEffect, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";
const COMPANY = { name:"ABuildWise Construction", city:"Nagpur, Maharashtra", phone:"+91 98230 00000", gstin:"27XXXXX1234X1Z5" };
const USD_RATE = 88;
const CITY_RATES: Record<string, number> = { mumbai: 3300, thane: 3100, pune: 2800, nagpur: 2000, nashik: 2400, aurangabad: 2300, "delhi ncr": 3200, bangalore: 3000, hyderabad: 2900, indore: 2200, bhopal: 2100, pohegaon: 1350, kopargaon: 1380, shirdi: 1420, ahmednagar: 2100, balaghat: 1520, seoni: 1510, mandla: 1500 };
const CITIES = Object.keys(CITY_RATES).map(k=>k.charAt(0).toUpperCase()+k.slice(1));
function getRate(city: string){ return CITY_RATES[city.toLowerCase().trim()] || 1700; }
function inr(n:number){ return (Number(n)||0).toLocaleString("en-IN"); }
function getLabel(s:string){ const n=parseInt(s); if(n===1) return "G+0 = Ground Floor Only"; return `G+${n-1} = Ground + ${n-1} Floors`; }
function makeQuote(){ return `AW-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`; }
function inWords(n:number): string {
  if(!n || isNaN(Number(n)) || Number(n)===0) return "Rupees Zero Only";
  n = Math.floor(Math.abs(Number(n)));
  const a=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const two=(x:number)=> x<20 ? a[x] : b[Math.floor(x/10)] + (x%10? " "+a[x%10]:"");
  const three=(x:number)=> { const h=Math.floor(x/100), r=x%100; return (h? a[h]+" Hundred"+(r?" ":""):"") + (r? two(r):""); };
  let s=""; const cr=Math.floor(n/10000000); n%=10000000; const lk=Math.floor(n/100000); n%=100000; const th=Math.floor(n/1000); n%=1000; const h=n;
  if(cr) s+=three(cr)+" Crore "; if(lk) s+=two(lk)+" Lakh "; if(th) s+=three(th)+" Thousand "; if(h) s+=three(h);
  return "Rupees "+s.trim()+" Only";
}
type Mat = { id:string; name:string; qty:number; rate:number; company:string; cat:string; owner:boolean; unit:string; factor:number };
const BASE_MATS = (built:number, cityRate:number, bhk:number, storeysNum:number, pkgRate:number, contract:string): Mat[] => {
  const doorsQty = bhk===1 ? 6 : bhk===2 ? 8 : 10;
  const f = (cityRate/2000) * (pkgRate/2000);
  const curingDays = 14 + (storeysNum * 7);
  const all: Mat[] = [
    { id:"cement", name:"Cement", qty: Math.round(built*0.20), rate: Math.round(359*f), company:"UltraTech OPC 43 Grade", cat:"cement", owner:true, unit:"Bags", factor:0.20 },
    { id:"steel", name:"Steel", qty: Math.round(built*2.70), rate: Math.round(68*f), company:"Kamdhenu Fe500", cat:"steel", owner:true, unit:"Kg", factor:2.70 },
    { id:"bricks", name:"Bricks - AAC", qty: Math.round(built*5), rate: Math.round(71*f), company:"Biltech AAC", cat:"bricks", owner:true, unit:"Nos", factor:5 },
    { id:"sand", name:"M-Sand", qty: Math.round(built*0.55), rate: Math.round(45*f), company:"M-Sand Local", cat:"sand", owner:true, unit:"Cft", factor:0.55 },
    { id:"aggregate", name:"Aggregate 20mm", qty: Math.round(built*0.48), rate: Math.round(38*f), company:"20mm Local", cat:"aggregate", owner:true, unit:"Cft", factor:0.48 },
    { id:"electrical", name:"Electrical", qty: Math.round(built*0.80), rate: Math.round(85*f), company:"Polycab", cat:"electrical", owner:true, unit:"Sqft", factor:0.80 },
    { id:"plumbing", name:"Plumbing", qty: Math.round(built*0.80), rate: Math.round(90*f), company:"Ashirvad CPVC", cat:"plumbing", owner:true, unit:"Sqft", factor:0.80 },
    { id:"tiles", name:"Tiles", qty: Math.round(built*0.85), rate: Math.round(110*f), company:"Kajaria 2x2", cat:"tiles", owner:true, unit:"Sqft", factor:0.85 },
    { id:"paint", name:"Paint", qty: Math.round(built*0.12), rate: Math.round(220*(pkgRate/2000)), company:"Asian Paints Apex", cat:"paint", owner:true, unit:"Ltr", factor:0.12 },
    { id:"waterproofing", name:"Waterproofing", qty: Math.round(built*0.50), rate: 45, company:"Dr Fixit", cat:"waterproofing", owner:true, unit:"Sqft", factor:0.50 },
    { id:"doors", name:"Doors", qty: doorsQty, rate: Math.round(12000*(pkgRate/2000)), company:"Teak Wood", cat:"doors", owner:true, unit:"Nos", factor:0 },
    { id:"windows", name:"Windows", qty: bhk===1?6:bhk===2?8:10, rate: Math.round(8500*(pkgRate/2000)), company:"Jindal Aluminium", cat:"windows", owner:true, unit:"Nos", factor:0 },
    { id:"glass", name:"Glass", qty: Math.round(built*0.15), rate: 180, company:"Saint-Gobain", cat:"glass", owner:true, unit:"Sqft", factor:0.15 },
    { id:"railing", name:"Railing SS304", qty: Math.round(built*0.12), rate: 450, company:"Jindal SS304", cat:"railing", owner:true, unit:"Rft", factor:0.12 },
    { id:"pop", name:"POP / Ceiling", qty: Math.round(built*0.75), rate: 55, company:"Gyproc POP", cat:"pop", owner:true, unit:"Sqft", factor:0.75 },
    { id:"sanitary", name:"Sanitary", qty: bhk, rate: Math.round(8500*(pkgRate/2000)), company:"Cera", cat:"sanitary", owner:true, unit:"Set", factor:0 },
    { id:"ply", name:"Ply - Centering", qty: Math.round(built*0.90), rate: 95, company:"Kitply 12mm", cat:"ply", owner:false, unit:"Sqft", factor:0.90 },
    { id:"batta", name:"Batta - Sagwan", qty: Math.round(built*0.60), rate: 65, company:"Sagwan Batta", cat:"batta", owner:false, unit:"Rft", factor:0.60 },
    { id:"jack", name:"Jack Prop", qty: Math.round(built*0.08), rate: 120, company:"MS Jack Prop", cat:"jack", owner:false, unit:"Nos", factor:0.08 },
    { id:"mistri", name:"Mistri", qty: Math.round(built*0.15), rate: 750, company:"Mistri Standard", cat:"mistri", owner:false, unit:"Days", factor:0.15 },
    { id:"beldar", name:"Beldar", qty: Math.round(built*0.25), rate: 500, company:"Beldar Standard", cat:"beldar", owner:false, unit:"Days", factor:0.25 },
    { id:"curing", name:"Curing", qty: curingDays, rate: 800, company:"Local Curing", cat:"curing", owner:false, unit:"Days", factor:0 },
    { id:"contingency", name:"Contingency + Supervision", qty: built, rate: 25, company:"Site Supervision", cat:"contingency", owner:false, unit:"Sqft", factor:1 },
    { id:"lift", name:"Lift", qty: storeysNum>1 ? 1 : 0, rate: 850000, company:"OTIS", cat:"lift", owner:false, unit:"Nos", factor:0 },
  ];
  if(contract==="labour") return all.filter(m=> ["mistri","beldar","curing","contingency"].includes(m.id));
  return all.filter(m=> !(m.id==="lift" && m.qty===0));
};
export default function Page(){
  const [phase,setPhase]=useState(1);
  const [geo,setGeo]=useState("Nagpur");
  const [plot,setPlot]=useState("2000");
  const [cov,setCov]=useState(64);
  const [storeys,setStoreys]=useState("1");
  const [bhk,setBhk]=useState(2);
  const [cname,setCname]=useState("");
  const [cphone,setCphone]=useState("");
  const [pkg,setPkg]=useState("standard");
  const [profitP,setProfitP]=useState(18);
  const [gstOn,setGstOn]=useState(false);
  const [view,setView]=useState<"owner"|"contractor"|"all">("all");
  const [contract,setContract]=useState<"full"|"centring"|"labour">("centring");
  const [showUSD,setShowUSD]=useState(false);
  const [bigText,setBigText]=useState(false);
  const [gpsOk,setGpsOk]=useState(false);
  const [history,setHistory]=useState<any[]>([]);
  const [pkgRates,setPkgRates]=useState({ basic:1640, standard:2000, premium:2760 });
  const [editPkg,setEditPkg]=useState<null|"basic"|"standard"|"premium">(null);
  const [eRate,setERate]=useState("");
  const [mats,setMats]=useState<Mat[]>([]);
  const [editMat,setEditMat]=useState<number|null>(null);
  const [eQty,setEQty]=useState(""); const [eMatRate,setEMatRate]=useState("");
  const [sitePhoto,setSitePhoto]=useState<string>("");
  const [quoteNo,setQuoteNo]=useState(()=>makeQuote());
  const editedIds = useRef<Set<string>>(new Set());
  const today = new Date().toLocaleDateString("en-IN");
  const validTill = new Date(Date.now()+15*24*60*60*1000).toLocaleDateString("en-IN");
  const cityRate = getRate(geo);
  const plotNum = parseInt(plot)||0;
  const ground = Math.round(plotNum*cov/100);
  const builtRaw = ground*(parseInt(storeys)||1);
  const extra = Math.round(builtRaw*0.15);
  const built115 = builtRaw + extra;
  const pkgRate = pkgRates[pkg as keyof typeof pkgRates];
  const sqmt = (built115*0.092903).toFixed(1);
  const storeysNum = parseInt(storeys)||1;
  const rebuildBOQ = (preserve:boolean=true)=>{
    const fresh = BASE_MATS(built115, cityRate, bhk, storeysNum, pkgRate, contract);
    if(preserve && mats.length>0){
      const map = new Map(mats.map(m=>[m.id,m]));
      const merged = fresh.map(fm=>{ const old = map.get(fm.id); if(old && editedIds.current.has(fm.id)) return {...fm, qty: old.qty, rate: old.rate}; return fm; });
      setMats(merged);
    } else setMats(fresh);
  };  const ownerMats = mats.filter(m=>m.owner);
  const contMats = mats.filter(m=>!m.owner);
  const ownerCost = ownerMats.reduce((s,m)=>s+m.qty*m.rate,0);
  const contCost = contMats.reduce((s,m)=>s+m.qty*m.rate,0);
  const labourRate = contract==="full" ? 550 : contract==="centring" ? 450 : 0;
  const labourCost = built115*labourRate;
  const subTotal = ownerCost + contCost + labourCost;
  const profit = Math.round(subTotal*(profitP/100));
  const profitLabel = contract==="full" ? `Profit ${profitP}% = Rs.${inr(profit)} (Included in Package)` : `Profit ${profitP}% = Rs.${inr(profit)}`;
  const baseTotal = subTotal + profit;
  const cgst = gstOn ? Math.round(baseTotal*0.09) : 0;
  const sgst = gstOn ? Math.round(baseTotal*0.09) : 0;
  const gstAmt = cgst+sgst;
  const finalTotal = baseTotal + gstAmt;
  const usd = Math.round(finalTotal/USD_RATE).toLocaleString("en-US");
  const effRate = Math.round(finalTotal/(built115||1));
  const timeline = storeys==="1" ? "G+0 = 6 Months" : `G+${storeysNum-1} = ${6+(storeysNum-1)*3} Months`;
  const list = view==="owner" ? ownerMats : view==="contractor" ? contMats : mats;
  const version = `V${history.length+1}`;
  const savePkg = ()=>{ const r=parseInt(eRate); if(!r||r<=0) return alert("Sahi Rate dalo"); setPkgRates(p=>({...p,[editPkg as string]:r})); setEditPkg(null); alert(`${editPkg} Rate Rs.${r} ho gaya - Auto Rebuild ho jayega`); };
  const saveMat = (idx:number)=>{ const q=parseInt(eQty), r=parseInt(eMatRate); if(!q||!r) return; const nm=[...mats]; const realIdx = mats.findIndex(m=>m===list[idx]); nm[realIdx]={...nm[realIdx],qty:q,rate:r}; editedIds.current.add(nm[realIdx].id); setMats(nm); setEditMat(null); };
  const gps = ()=>{ if(!navigator.geolocation) return alert("GPS not supported"); navigator.geolocation.getCurrentPosition(async(pos)=>{ setGpsOk(true); try{ const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d=await res.json(); const c=d.address?.city||d.address?.town||d.address?.village||geo; setGeo(c); }catch(e){ setGeo(geo); } },()=>alert("GPS Denied")); };
  const validate = ()=>{ if(!cname.trim()){ alert("Pehle Client Name bhare"); return false; } if(cphone.length!==10||isNaN(Number(cphone))){ alert("Phone 10 Digit ka hona chahiye"); return false; } if(!plot || isNaN(Number(plot)) || plotNum<=0){ alert("Plot me sirf Number dalo, 0 nahi"); return false; } if(cov<10||cov>90){ alert("Coverage 10% se 90% ke beech hona chahiye"); return false; } return true; };
  const saveEst = ()=>{ const e={name:cname||"No Name",geo,built:built115,total:finalTotal,date:today,quoteNo,version}; const nh=[e,...history].slice(0,10); setHistory(nh); try{ localStorage.setItem("aw_history_v31",JSON.stringify(nh)); }catch(e){} alert(`Estimate ${version} Save - Quote ${quoteNo}`); const nq=makeQuote(); setQuoteNo(nq); try{ localStorage.setItem("aw_quote_v31",nq); }catch(e){} };
  const wa = ()=>{ const t=`${COMPANY.name} ${quoteNo} - ${cname||geo} - ${geo} - ${bhk} BHK - Built ${built115} Sqft - ${contract} - Total Rs.${inr(finalTotal)} ${gstOn?"With GST":"GST Extra"} - Valid ${validTill} - ${inWords(finalTotal)}`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,"_blank"); };
  const pdf = async ()=>{
    const doc=new jsPDF();
    doc.setFontSize(24); doc.setFont("helvetica","bold"); doc.text(COMPANY.name,14,16);
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(`${COMPANY.city} | Phone: ${COMPANY.phone} | GSTIN: ${COMPANY.gstin}`,14,23);
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(`Quote No: ${quoteNo} | Date: ${today} | Valid Till: ${validTill} (15 Days) | ${version}`,14,31);
    doc.text(`Client: ${cname||"Not Provided"} | Phone: ${cphone||"Not Provided"}`,14,38);
    doc.text(`Plot ${plotNum} Sqft | Coverage ${cov}% | Ground ${ground} + 15% ${extra} = Built-up ${built115} Sqft (${sqmt} Sqmt) | ${bhk} BHK | ${getLabel(storeys)}`,14,45);
    doc.text(`Package: ${pkg} Rs.${pkgRate} | Mode: ${contract} | Timeline: ${timeline}`,14,52);
    doc.setFontSize(13); doc.text(`Grand Total: Rs. ${inr(finalTotal)} ${gstOn?`(With GST - CGST ${inr(cgst)} + SGST ${inr(sgst)})`:"(GST Extra)"}`,14,62);
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(`In Words: ${inWords(finalTotal)}`,14,69);
    doc.text(`Effective Rate: Rs.${effRate}/sqft | ${profitLabel} | $ ${usd} (Approx @ Rs.${USD_RATE})`,14,76);
    let y=84;
    if(sitePhoto){ try{ doc.addImage(sitePhoto, "JPEG", 14, y, 60, 35); doc.text("Site Photo", 80, y+10); y+=40; }catch(e){} }
    doc.setFont("helvetica","bold"); doc.text("BOQ - Single BOQ = Single Total",14,y); y+=7; doc.setFont("helvetica","normal"); doc.setFontSize(8);
    mats.forEach((m,i)=>{ if(y>265){doc.addPage(); y=16;} doc.text(`${i+1}. ${m.name} - ${m.company} - ${m.qty} ${m.unit} x Rs.${m.rate} = Rs.${inr(m.qty*m.rate)}`,14,y); y+=6; });
    y+=4; doc.setFont("helvetica","bold"); doc.text(`Owner Rs.${inr(ownerCost)} + Contractor Rs.${inr(contCost)} + Labour Rs.${inr(labourCost)} + Profit Rs.${inr(profit)} = Rs.${inr(baseTotal)}`,14,y); y+=7;
    doc.text(`Payment: 30% Rs.${inr(Math.round(finalTotal*0.30))} | 30% Rs.${inr(Math.round(finalTotal*0.30))} | 30% Rs.${inr(Math.round(finalTotal*0.30))} | 10% Rs.${inr(Math.round(finalTotal*0.10))}`,14,y); y+=7;
    doc.setFont("helvetica","normal"); doc.text("NOT Included: Govt Approval / Map Passing, Borewell, Compound Wall, Furniture, Interior",14,y); y+=7;
    doc.text("Terms: Approximate, final may vary 10-15%. Valid 15 days.",14,y); y+=7;
    doc.text(`Signature: Client __________  Contractor __________  Date: ${today}`,14,y);
    doc.save(`${COMPANY.name}_${quoteNo}_${built115}.pdf`);
  };
  return (
  <div className={`min-h-screen bg-[#02020a] text-white p-2 pb-32 ${bigText?"text-[15px]":""}`}>
    <div className="max-w-[720px] mx-auto">
      <div className="bg-[#0f141f] border border-[#d4af37]/20 rounded-2xl px-4 py-2 mb-2 text-center">
        <b>{COMPANY.name} <span className="text-[#d4af37]">- V31.2</span></b>
        <div className="text-[11px] text-white/70">{COMPANY.city} | {COMPANY.phone} | GSTIN: {COMPANY.gstin}</div>
        <div className="text-[11px]">Quote: {quoteNo} | Date: {today} | Valid: {validTill} | {version} <button onClick={newQuote} className="ml-1 px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-bold">New Quote</button></div>
      </div>
      <div className="flex justify-between items-center bg-[#0f141f] border rounded-2xl px-4 py-2.5 mb-2">
        <b>Estimate <span className="text-[#d4af37]">V31.2</span></b>
        <div className="flex bg-black rounded-full p-1 gap-1">
          <button onClick={()=>setView("all")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="all"?"bg-white text-black":"text-white/70"}`}>All: {mats.length}</button>
          <button onClick={()=>setView("owner")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="owner"?"bg-white text-black":"text-white/70"}`}>Owner: {ownerMats.length}</button>
          <button onClick={()=>setView("contractor")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="contractor"?"bg-[#d4af37] text-black":"text-white/70"}`}>Contractor: {contMats.length}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button onClick={()=>setShowUSD(!showUSD)} className="px-3 py-1 rounded-full bg-black border text-[12px]">{showUSD?"Show in Rs.":"Show in $ + Sqmt"}</button>
        <button onClick={()=>setBigText(!bigText)} className="px-3 py-1 rounded-full bg-black border text-[12px]">{bigText?"Normal":"Big Text"}</button>
        <button onClick={()=>rebuildBOQ(false)} className="px-3 py-1 rounded-full bg-[#d4af37] text-black text-[12px] font-bold">🔄 Rebuild BOQ</button>
        <span className="text-[12px] text-green-400 font-bold py-1">✓ Draft Saved | {version} | Auto-Rebuild ON</span>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">{[1,2,3].map(n=><div key={n} className={`text-center text-[12px] py-1.5 r      {phase===1 && <div className="bg-[#0f141f] border rounded-[24px] p-4">
        <h2 className="font-black text-[#d4af37] mb-3">Page 1 - Contract + Location</h2>
        <div className="grid gap-2 mb-3">{[["full","With Material - Turnkey","All Materials + Labour Included - 550/sqft Labour"],["centring","Without Material - Centering + Labour","Owner Provides Material - 450/sqft Labour"],["labour","Labour Only","Sirf Mistri/Beldar - Ply/Batta Nahi - No Extra Labour"]].map(([id,label,desc])=>(
          <button key={id} onClick={()=>{setContract(id as any);}} className={`text-left p-4 rounded-[16px] border ${contract===id?"bg-white text-black":"bg-[#1a2332] text-white"}`}><div className="font-black text-[13px]">{label} {contract===id&&<span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">Selected</span>}</div><div className="text-[12px] mt-1">{desc}</div></button>
        ))}</div>
        <div className="text-[12px] font-bold text-[#d4af37] mb-2">BHK - Ek hi chunenge</div>
        <div className="grid grid-cols-3 gap-2 mb-3">{[1,2,3].map(b=>(<button key={b} onClick={()=>setBhk(b)} className={`py-3 rounded-[16px] border font-black ${bhk===b?"bg-white text-black":"bg-[#1a2332]"}`}>{b} BHK<br/><span className="text-[11px] font-normal">Doors: {b===1?6:b===2?8:10}</span></button>))}</div>
        <div className="text-[11px] mb-3">Room: {bhk} BHK = Living + Kitchen + {bhk} Bedroom + {bhk} Bath + Balcony | Contract badalte hi BOQ Auto-Rebuild hoga</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-black/60 border rounded-[18px] p-3"><div className="text-[12px] font-black text-[#d4af37]">Plot Area</div><input type="number" value={plot} onChange={e=>setPlot(e.target.value)} className="w-full bg-black border rounded-full px-3 py-2.5 text-[18px] font-black text-center" /><div className="text-[12px]">Sirf Number</div></div>
          <div className="bg-black/60 border rounded-[18px] p-3"><div className="text-[12px] font-black text-cyan-300">Coverage (10-90%)</div><input type="number" min={10} max={90} value={cov} onChange={e=>setCov(parseInt(e.target.value)||0)} className="w-full bg-black border rounded-full px-3 py-2.5 text-[18px] font-black text-center" /><div className="text-[12px]">{plotNum} x {cov}% = {ground}</div></div>
        </div>
        <select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black border rounded-full px-3 py-3.5 mb-1">{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{getLabel(String(n))}</option>)}</select>
        <div className="text-[12px] mb-3">Selected: {getLabel(storeys)} | Timeline: {timeline} | Curing: {14+(storeysNum*7)} Days</div>
        <input value={cname} onChange={e=>setCname(e.target.value)} placeholder="Client Name * Required" className="w-full bg-black/50 border rounded-full px-4 py-3 mb-2" />
        <input value={cphone} onChange={e=>setCphone(e.target.value)} placeholder="Client Phone * 10 Digit" maxLength={10} className="w-full bg-black/50 border rounded-full px-4 py-3 mb-3" />
        <div className="bg-white/5 border rounded-[16px] p-3 mb-3">
          <div className="flex justify-between"><b className="text-[13px] text-cyan-300">Location + GPS + Site Photo</b><button onClick={gps} className="text-[12px] px-3 py-1 rounded-full bg-cyan-400 text-black font-black">{gpsOk?`${geo} - GPS Verified`:"Use GPS"}</button></div>
          <input value={geo} onChange={e=>setGeo(e.target.value)} className="w-full bg-black border rounded-full px-4 py-3 mt-2" placeholder="Search City" />
          <div className="flex flex-wrap gap-1 mt-2">{CITIES.slice(0,12).map(c=><button key={c} onClick={()=>setGeo(c)} className="text-[11px] bg-white/10 px-2 py-1 rounded-full">{c} Rs.{getRate(c)}</button>)}</div>
          <label className="block mt-3 text-[12px] font-bold">📸 Site Photo Upload - PDF me bhi jayegi {sitePhoto && <span className="text-green-400">✓ Photo Selected</span>}</label>
          <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setSitePhoto(String(r.result)); r.readAsDataURL(f); } }} className="w-full bg-black border rounded-full px-3 py-2 mt-1 text-[12px]" />
          {sitePhoto && <img src={sitePhoto} alt="Site" className="w-full h-[160px] object-cover rounded-xl mt-2" />}
        </div>
        <div className="bg-[#d4af37]/10 border rounded-[18px] p-3 mb-3">
          <div className="text-[12px] font-black text-[#d4af37] mb-2">Profit {profitP}% = Rs.{inr(profit)} | GST {gstOn?"ON":"OFF"}</div>
          <input type="range" min={5} max={50} value={profitP} onChange={e=>setProfitP(parseInt(e.target.value))} className="w-full accent-[#d4af37]" />
          <button onClick={()=>setGstOn(!gstOn)} className="mt-2 px-3 py-1.5 rounded-full bg-white text-black text-[12px] font-black">{gstOn?"GST ON - CGST 9% + SGST 9%":"GST OFF - GST Extra"}</button>
          <div className="grid grid-cols-3 gap-2 mt-3">{(["basic","standard","premium"] as const).map(k=>(<div key={k} className={`rounded-[16px] border p-3 relative ${pkg===k?"bg-white text-black":"bg-black/40"}`}><button onClick={()=>{setEditPkg(k); setERate(String(pkgRates[k]));}} className="absolute top-1 right-1 text-[11px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">Edit</button><button onClick={()=>setPkg(k)} className="w-full text-left mt-3"><div className="text-[12px] capitalize">{k}</div><div className="font-black">Rs.{pkgRates[k]} / sqft</div></button></div>))}</div>
          <div className="text-[11px] text-[#d4af37] mt-2">Package badalte hi Material Rate auto-change hoga</div>
        </div>
        <div className="bg-yellow-400/10 border rounded-[16px] p-3 text-[12px] text-yellow-200 mb-3">⚠️ Approximate. Final may vary 10-15%. Valid till {validTill} (15 days).</div>
        <button onClick={()=>{if(validate()) setPhase(2)}} className="w-full bg-[#d4af37] text-black font-black py-4 rounded-full">Next - Step 2 →</button>
      </div>}
      {phase===2 && <div className="bg-[#0f141f] border rounded-[24px] p-4">
        <h2 className="font-black text-[#d4af37] mb-3">Page 2 - Rates & Brands - Sabhi {mats.length} Item</h2>
        <div className="grid gap-1 mb-3">{mats.map(m=>(<div key={m.id} className="flex justify-between text-[12px] bg-white/5 px-2 py-1.5 rounded-full"><span>{m.name} - {m.company}</span><span>{m.qty} {m.unit} x Rs.{m.rate} = Rs.{inr(m.qty*m.rate)}</span></div>))}</div>
        <div className="text-[12px] mb-3">Qty = Built {built115} x Factor | Ex: Cement {built115} x 0.20 = {Math.round(built115*0.20)} Bags</div>
        <div className="flex gap-2"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 rounded-full py-3.5">Back</button><button onClick={()=>{if(validate()) setPhase(3)}} className="flex-[2] bg-white text-black font-black py-3.5 rounded-full">Next - Final →</button></div>
      </div>}
      {phase===3 && <div className="bg-[#0f141f] border rounded-[24px] p-4">
        <div className="flex justify-between mb-3"><h2 className="font-black text-[#d4af37]">Page 3 - Final - {quoteNo}</h2><button onClick={()=>setPhase(2)} className="text-[12px] px-3 py-1 rounded-full bg-white/10">Back</button></div>
        <div className="bg-black/60 border rounded-[16px] p-3 mb-3 text-[12px]">Owner Rs.{inr(ownerCost)} + Contractor Rs.{inr(contCost)} + Labour Rs.{inr(labourCost)} + Profit Rs.{inr(profit)} = Rs.{inr(baseTotal)} {gstOn?`+ GST ${inr(gstAmt)}`:"+ GST Extra"} = Rs.{inr(finalTotal)} | {today} | Valid: {validTill}</div>
        <table className="w-full text-[13px]"><tbody>{list.map((m,i)=>(<tr key={m.id} className="border-b border-white/10"><td className="py-2 pr-1">{i+1}. {m.name} - {m.company}<br/><span className="text-[11px] text-white/60">{m.factor?`${m.factor} ${m.unit}/sqft`:"Fixed"} | {m.owner?"Owner":"Contractor"}</span></td><td className="text-right">{m.qty} {m.unit} x Rs.{m.rate} = <b>Rs.{inr(m.qty*m.rate)}</b></td><td><button onClick={()=>{setEditMat(i); setEQty(String(m.qty)); setEMatRate(String(m.rate));}} className="ml-2 text-[11px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">Edit</button></td></tr>))}</tbody></table>
        {editMat!==null && <div className="bg-white text-black rounded-xl p-3 mt-2"><b>Edit {list[editMat].name}</b><input value={eQty} onChange={e=>setEQty(e.target.value)} placeholder="Qty" className="w-full border rounded-full px-3 py-2 mt-2 text-black" /><input value={eMatRate} onChange={e=>setEMatRate(e.target.value)} placeholder="Rate" className="w-full border rounded-full px-3 py-2 mt-2 text-black" /><div className="flex gap-2 mt-2"><button onClick={()=>setEditMat(null)} className="flex-1 bg-gray-200 rounded-full py-2">Cancel</button><button onClick={()=>saveMat(editMat)} className="flex-1 bg-black text-white rounded-full py-2 font-bold">Save - Ab Edit nahi udega</button></div></div>}
        {sitePhoto && <div className="mt-3"><b className="text-[12px]">Site Photo - PDF me bhi jayegi</b><img src={sitePhoto} alt="Site" className="w-full h-[160px] object-cover rounded-xl mt-1" /></div>}
        <div className="bg-black/60 border rounded-[16px] p-3 mt-3 text-[12px]"><b className="text-[#d4af37]">Payment</b><div>30% Rs.{inr(Math.round(finalTotal*0.30))} | 30% Rs.{inr(Math.round(finalTotal*0.30))} | 30% Rs.{inr(Math.round(finalTotal*0.30))} | 10% Rs.{inr(Math.round(finalTotal*0.10))}</div><b className="text-[#d4af37] block mt-2">Timeline: {timeline} | Valid: {validTill}</b><div className="mt-1">❌ NOT Included: Govt Approval, Borewell, Compound Wall, Furniture, Interior</div><div className="mt-1">{COMPANY.name} | {COMPANY.phone} | GSTIN: {COMPANY.gstin} | Signature: Client ____ Contractor ____</div></div>
        <div className="font-black text-[18px] mt-3">Final: Rs.{inr(finalTotal)}{showUSD?` = $${usd}`:""} | Effective Rs.{effRate}/sqft</div>
        <div className="text-[11px] italic mt-1">{inWords(finalTotal)}</div>
        <div className="flex gap-2 mt-3"><button onClick={wa} className="flex-1 bg-green-600 rounded-full py-3 font-bold">WhatsApp</button><button onClick={pdf} className="flex-1 bg-blue-600 rounded-full py-3 font-bold">Download PDF</button></div>
        <div className="flex gap-2 mt-2"><button onClick={saveEst} className="flex-1 bg-white/10 rounded-full py-3">💾 Save {version}</button><button onClick={newQuote} className="flex-1 bg-[#d4af37] text-black rounded-full py-3 font-bold">🆕 New Quote</button></div>
        <div className="mt-3"><b className="text-[13px]">History</b>{history.length===0?<div className="text-[12px] text-white/60">Koi history nahi</div>:history.map((h,i)=><div key={i} className="text-[12px] bg-white/5 px-2 py-1.5 rounded-full mt-1">{h.version} - {h.quoteNo} - {h.name} - {h.built} Sqft - Rs.{inr(h.total)} - {h.date}</div>)}</div>
      </div>}
    </div>
    {editPkg && <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999]"><div className="bg-white text-black rounded-2xl p-4 w-full max-w-[400px]"><h3 className="font-black capitalize">Edit {editPkg} Package</h3><input value={eRate} onChange={e=>setERate(e.target.value)} type="number" className="w-full border rounded-full px-3 py-3 mt-2 text-black" /><div className="text-[12px] mt-1">Abhi: Rs.{pkgRates[editPkg]} | Save ke baad Auto-Rebuild ho jayega</div><div className="flex gap-2 mt-3"><button onClick={()=>setEditPkg(null)} className="flex-1 bg-gray-200 rounded-full py-3">Cancel</button><button onClick={savePkg} className="flex-1 bg-black text-white rounded-full py-3 font-bold">Save</button></div></div></div>}
  </div>
  );
}ounded-full font-bold ${phase===n?"bg-[#d4af37] text-black":"bg-white/10"}`}>{n===1?"Contract + Location":n===2?"Rates":"Estimate"}</div>)}</div>
      <div className="bg-black/60 border border-cyan-400/20 rounded-2xl px-3 py-2 mb-3 text-center">
        <div className="text-[12px] text-[#d4af37] font-bold">Base Rs.{cityRate} | Built-up {built115} Sqft ({sqmt} Sqmt) | {today}</div>
        <div className="font-black text-[16px]">Total Rs.{inr(finalTotal)}{showUSD?` = $${usd} (Approx @ ${USD_RATE})`:""}</div>
        <div className="text-[12px]">Owner Rs.{inr(ownerCost)} + Contractor Rs.{inr(contCost)} + Labour Rs.{inr(labourCost)} ({labourRate}/sqft) + Profit Rs.{inr(profit)} = Rs.{inr(baseTotal)}</div>
        <div className="text-[12px] text-cyan-300">{plotNum} x {cov}% = {ground} + 15% {extra} = {built115} | {gstOn?`GST CGST ${inr(cgst)} + SGST ${inr(sgst)}`:"GST Extra"} | Effective Rs.{effRate}/sqft</div>
        <div className="text-[11px] italic">{inWords(finalTotal)}</div>
        <div className="text-[11px] text-[#d4af37]">BOQ Sum = Grand Total - Koi Fark Nahi | {profitLabel}</div>
      </div>
  useEffect(()=>{ rebuildBOQ(false); // eslint-disable-next-line
  },[]);
  useEffect(()=>{ if(mats.length===0) return; const t=setTimeout(()=>rebuildBOQ(true), 150); return ()=>clearTimeout(t); // eslint-disable-next-line
  },[geo,pkg,contract,bhk,storeys,plot,cov,pkgRates]);
  const newQuote = ()=>{ const q=makeQuote(); setQuoteNo(q); try{ localStorage.setItem("aw_quote_v31",q); }catch(e){} alert(`Naya Quote: ${q}`); };
  useEffect(()=>{ try{ const h=JSON.parse(localStorage.getItem("aw_history_v31")||"[]"); setHistory(h); const d=JSON.parse(localStorage.getItem("aw_draft_v31")||"{}"); if(d.cname) setCname(d.cname); if(d.cphone) setCphone(d.cphone); }catch(e){} },[]);
  useEffect(()=>{ try{ localStorage.setItem("aw_draft_v31", JSON.stringify({cname,cphone,geo,plot,storeys,pkg,bhk})); }catch(e){} },[cname,cphone,geo,plot,storeys,pkg,bhk]);
