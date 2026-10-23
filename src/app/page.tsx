"use client";
import { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";

if (typeof window !== 'undefined' && !(window as any)._promptPatched) {
  (window as any)._promptPatched = true;
  // @ts-ignore
  window.prompt = (message?: string, _default?: string) => {
    console.warn("ABuildWise LOCK: prompt() blocked, use EDIT2 modal ->", message);
    return null;
  };
}
if (typeof window !== 'undefined') {
  const hideOldEdit = () => {
    try {
      document.querySelectorAll('div').forEach(parent => {
        const btns = Array.from(parent.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'EDIT' || b.textContent?.trim() === 'EDIT2');
        if (btns.length >= 2) {
          const hasEdit2 = btns.some(b => b.textContent?.trim() === 'EDIT2');
          if (hasEdit2) {
            btns.forEach(b => {
              if (b.textContent?.trim() === 'EDIT' && !b.getAttribute('data-new-edit2')) {
                (b as HTMLElement).style.display = 'none';
                b.setAttribute('data-old-hidden', '1');
              }
            });
          }
        }
      });
    } catch {}
  };
  setTimeout(hideOldEdit, 500);
  setInterval(hideOldEdit, 1500);
}
const CITIES_DB = ["Mumbai","Thane","Pune","Nagpur","Nashik","Aurangabad","Delhi NCR","Bangalore","Hyderabad","Indore","Bhopal","Pohegaon","Kopargaon","Shirdi","Sangamner","Rahata","Shrirampur","Ahmednagar","Phanda","Berasia","Mhow","Depalpur","Kamptee", "Balaghat","Seoni","Mandla","Waraseoni","Katangi","Lalbarra","Keolari","Nainpur","Bhusawal","Khandwa","Burhanpur","Jalgaon","Dewas"];
const DISTRICT_MAP: Record<string, string> = { "phanda": "bhopal", "berasia": "bhopal", "mhow": "indore", "depalpur": "indore", "pohegaon": "kopargaon", "rahata": "kopargaon", "shirdi": "kopargaon", "waraseoni": "balaghat", "katangi": "balaghat", "lalbarra": "balaghat", "keolari": "seoni", "lakhnadon": "seoni", "nainpur": "mandla", "bichhiya": "mandla", };
const CITY_RATE_DB: Record<string, number> = { "mumbai": 2250, "thane": 2180, "pune": 1750, "nagpur": 2000, "nashik": 1650, "indore": 1800, "bhopal": 1550, "bangalore": 1950, "delhi ncr": 2120, "pohegaon": 1350, "kopargaon": 1380, "shirdi": 1420, "ahmednagar": 1450, "balaghat": 1520, "seoni": 1510, "mandla": 1500, "waraseoni": 1525, "katangi": 1515, "lalbarra": 1490, "keolari": 1505, "nainpur": 1495, "bhusawal": 2000, "khandwa": 1850, "burhanpur": 1820, "jalgaon": 1980, "dewas": 1720, };
const CITY_COVERAGE_MAP: Record<string, number> = { "mumbai": 0.55, "thane": 0.56, "pune": 0.60, "nagpur": 0.64, "balaghat": 0.62, "seoni": 0.62, "mandla": 0.60, "waraseoni": 0.62, "katangi": 0.61, "delhi ncr": 0.60, "indore": 0.63, "bhopal": 0.62, "nashik": 0.62, "bangalore": 0.58, "bhusawal": 0.62, "khandwa": 0.62, };
function getCityRate(city: string): number {
  const k = city.toLowerCase().trim();
  const mapped = DISTRICT_MAP[k] || k;
  if (CITY_RATE_DB[mapped]) return CITY_RATE_DB[mapped];
  if (CITY_RATE_DB[k]) return CITY_RATE_DB[k];
  let hash = 0;
  for(let i=0;i<k.length;i++){ hash = k.charCodeAt(i) + ((hash<<5)-hash); }
  return 1700 + (Math.abs(hash) % 450);
}
function getLiveCoverage(city: string, plotArea: number){
  const c = city.toLowerCase().trim();
  if(CITY_COVERAGE_MAP[c]) return CITY_COVERAGE_MAP[c];
  let base = 0.65;
  if(plotArea < 800) base = 0.80;
  else if(plotArea < 1200) base = 0.75;
  else if(plotArea < 2000) base = 0.68;
  else if(plotArea < 3000) base = 0.62;
  else if(plotArea < 5000) base = 0.55;
  else base = 0.48;
  return Math.round(base*100)/100;
}
function getPLabel(storeys: string){
  const s = parseInt(storeys);
  if(s===1) return "P1 = Ground Floor Only";
  if(s===2) return "P2 = Ground + 1 Floor";
  return `P${s} = Ground + ${s-1} Floors`;
}
const COMPANY_MASTER: Record<string, {name:string, mult:number, label:string}[]> = {
  cement: [{name:"ULTRATECH", mult:1, label:"LIVE"}, {name:"ACC", mult:0.97, label:"-3%"}, {name:"AMBUJA", mult:0.95, label:"-5%"}, {name:"BIRLA", mult:0.96, label:"-4%"}, {name:"DALMIA", mult:0.94, label:"-6%"}],
  steel: [{name:"KAMDHENU_NXT", mult:1, label:"LIVE"}, {name:"TATA_TISCON", mult:1.16, label:"+16%"}, {name:"JINDAL", mult:1.09, label:"+9%"}, {name:"JSW", mult:1.12, label:"+12%"}, {name:"SAIL", mult:1.05, label:"+5%"}],
  ply: [{name:"Kitply", mult:1, label:"LIVE 12mm"}, {name:"Greenply", mult:1.05, label:"+5%"}, {name:"Century", mult:1.1, label:"Premium"}, {name:"Local Ply", mult:0.9, label:"Budget"}],
  batta: [{name:"Sagwan Batta", mult:1, label:"LIVE"}, {name:"Neem Batta", mult:0.92, label:"-8%"}, {name:"Pine Batta", mult:0.95, label:"-5%"}, {name:"Local Batta", mult:0.85, label:"-15%"}],
  jack: [{name:"MS Jack Prop", mult:1, label:"LIVE"}, {name:"Heavy Duty Jack", mult:1.12, label:"+12%"}, {name:"Adjustable Jack", mult:1.08, label:"+8%"}, {name:"Rental Jack", mult:0.8, label:"Rent -20%"}],
  bricks: [{name:"Biltech AAC", mult:1, label:"LIVE"}, {name:"Jindal AAC", mult:1.08, label:"+8%"}, {name:"Ultratech AAC", mult:1.05, label:"+5%"}, {name:"Red Brick Local", mult:0.9, label:"Budget"}, {name:"Flyash Brick", mult:0.85, label:"Eco"}],
  sand: [{name:"M-Sand Local", mult:1, label:"LIVE"}, {name:"Double Wash M-Sand", mult:1.1, label:"Premium"}, {name:"River Sand", mult:1.15, label:"+15%"}, {name:"Crusher Sand", mult:0.95, label:"-5%"}],
  aggregate: [{name:"20mm Local", mult:1, label:"LIVE"}, {name:"10mm Aggregate", mult:0.95, label:"-5%"}, {name:"40mm Aggregate", mult:1.08, label:"+8%"}, {name:"Crushed Stone", mult:1, label:"Std"}],
  electrical: [{name:"Polycab", mult:1, label:"LIVE"}, {name:"Havells", mult:1.08, label:"+8%"}, {name:"Finolex", mult:1.05, label:"+5%"}, {name:"RR Kabel", mult:1.03, label:"+3%"}, {name:"KEI", mult:0.98, label:"-2%"}],
  plumbing: [{name:"Ashirvad", mult:1, label:"LIVE"}, {name:"Astral", mult:1.07, label:"+7% CPVC"}, {name:"Supreme", mult:0.97, label:"-3%"}, {name:"Finolex", mult:1.02, label:"+2%"}, {name:"Prince", mult:0.95, label:"Budget"}],
  tiles: [{name:"Kajaria", mult:1, label:"LIVE"}, {name:"Somany", mult:0.97, label:"-3%"}, {name:"Johnson", mult:1.05, label:"Premium"}, {name:"RAK Ceramics", mult:1.08, label:"+8%"}, {name:"Morbi Local", mult:0.88, label:"Budget -12%"}],
  paint: [{name:"Asian Paints", mult:1, label:"LIVE"}, {name:"Berger", mult:0.95, label:"-5%"}, {name:"Dulux", mult:1.08, label:"Premium"}, {name:"Nerolac", mult:0.98, label:"-2%"}, {name:"Indigo", mult:0.92, label:"Budget"}],
  waterproofing: [{name:"Dr Fixit", mult:1, label:"LIVE"}, {name:"Fosroc", mult:1.1, label:"+10%"}, {name:"Sika", mult:1.12, label:"Premium +12%"}, {name:"Choksey", mult:0.95, label:"-5%"}],
  doors: [{name:"Teak Wood", mult:1, label:"LIVE"}, {name:"WPC Door", mult:0.85, label:"Waterproof"}, {name:"Flush Door Green", mult:0.75, label:"Budget -25%"}, {name:"Mica Door", mult:0.9, label:"-10%"}, {name:"Sagwan Premium", mult:1.2, label:"Premium +20%"}],
  windows: [{name:"Jindal Aluminium", mult:1, label:"LIVE"}, {name:"Fenesta UPVC", mult:1.18, label:"Premium +18%"}, {name:"Aluplast", mult:1.12, label:"+12%"}, {name:"Local Aluminium", mult:0.9, label:"Budget"}],
  glass: [{name:"Saint-Gobain", mult:1, label:"LIVE 12mm"}, {name:"Asahi", mult:1.05, label:"+5%"}, {name:"Modiguard", mult:0.97, label:"-3%"}, {name:"Toughened Glass", mult:1.15, label:"Strong +15%"}],
  railing: [{name:"Jindal SS304", mult:1, label:"LIVE"}, {name:"Jindal SS202", mult:0.88, label:"Budget -12%"}, {name:"MS Railing", mult:0.75, label:"MS -25%"}, {name:"Glass Railing", mult:1.2, label:"Premium +20%"}],
  pop: [{name:"Gyproc POP", mult:1, label:"LIVE"}, {name:"Armstrong Ceiling", mult:1.15, label:"Premium"}, {name:"Anutone", mult:1.08, label:"+8%"}, {name:"Local POP", mult:0.88, label:"Budget"}],
  sanitary: [{name:"Cera", mult:1, label:"LIVE"}, {name:"Hindware", mult:1.05, label:"+5%"}, {name:"Jaquar", mult:1.18, label:"Premium +18%"}, {name:"Kohler", mult:1.25, label:"Luxury +25%"}, {name:"Parryware", mult:0.95, label:"-5%"}],
  mistri: [{name:"Mistri Standard", mult:1, label:"LIVE Rs.750"}, {name:"Premium Mistri", mult:1.15, label:"Expert +15%"}, {name:"Thekedar Team", mult:1.1, label:"Contract"}, {name:"Local Mistri", mult:0.9, label:"Budget"}],
  beldar: [{name:"Beldar Standard", mult:1, label:"LIVE Rs.500"}, {name:"Skilled Beldar", mult:1.1, label:"+10%"}, {name:"Local Beldar", mult:0.92, label:"Budget"}, {name:"Helper Beldar", mult:0.85, label:"-15%"}],
  curing: [{name:"Local Curing", mult:1, label:"LIVE"}, {name:"Chemical Curing", mult:1.25, label:"Fast +25%"}, {name:"Pond Curing", mult:0.95, label:"Std"}, {name:"Spray Curing", mult:1.1, label:"+10%"}],
  lift: [{name:"OTIS", mult:1, label:"LIVE"}, {name:"KONE", mult:1.1, label:"Premium +10%"}, {name:"SCHINDLER", mult:1.15, label:"Luxury +15%"}, {name:"JOHNSON", mult:1.05, label:"+5%"}, {name:"Budget Lift", mult:0.92, label:"Budget"}],
}
type EditState = { idx:number, qty:number, rate:number, company:string, cat:string, id:string } | null;
type BoxEditModal = { type:"plot"|"coverage"|"ground"|"floor"|"basic"|"standard"|"premium", value:string } | null;
export default function Page(){
  const [geo,setGeo]=useState("Nagpur");
  const [liveLabel,setLiveLabel]=useState("CURRENT LOCATION");
  const [show,setShow]=useState(false);
  const [plotArea,setPlotArea]=useState("2000");
  const [storeys,setStoreys]=useState("1");
  const [currency,setCurrency]=useState("inr");
  const [phase,setPhase]=useState(1);
  const [pkg,setPkg]=useState("standard");
  const [steelCompany,setSteelCompany]=useState("kamdhenu_nxt");
  const [cementCompany,setCementCompany]=useState("ultratech");
  const [liftCompany,setLiftCompany]=useState("otis");
  const [apiData,setApiData]=useState<any>({ ratePerSqft: 2000, coverage:0.64, materials:[], logic:"LIVE", cementRate: 356, steelRate: 65, transportExtra: 0 });
  const [manualBuiltUp,setManualBuiltUp]=useState("1200");
  const [isManual,setIsManual]=useState(false);
  const [edit, setEdit] = useState<EditState>(null);
  const [customMaterials, setCustomMaterials] = useState<any[]|null>(null);
  const [currentLatLng, setCurrentLatLng] = useState<{lat:number,lng:number}|null>(null);
  const [boxEditModal, setBoxEditModal] = useState<BoxEditModal>(null);
  const [manualCoverageAdd, setManualCoverageAdd] = useState<number|null>(null);
  const [customPkgRatesAdd, setCustomPkgRatesAdd] = useState<{basic:number|null, standard:number|null, premium:number|null}>({basic:null, standard:null, premium:null});
  const [dailyFluc, setDailyFluc] = useState(1);
  useEffect(()=>{
    const day = new Date().getDate();
    const fluc = 1 + ((day % 7) - 3) * 0.006;
    setDailyFluc(fluc);
  },[]);
  const [debouncedPlotArea, setDebouncedPlotArea] = useState("2000");
  const [debouncedGeo, setDebouncedGeo] = useState("Nagpur");
  useEffect(()=>{ const t=setTimeout(()=>setDebouncedPlotArea(plotArea),500); return ()=>clearTimeout(t); },[plotArea]);
  useEffect(()=>{ const t=setTimeout(()=>setDebouncedGeo(geo),500); return ()=>clearTimeout(t); },[geo]);
  const fetchData = async (cityName = geo, lat?:number, lng?:number) => {
    let localRate = getCityRate(cityName);
    if(pkg==="basic" && customPkgRatesAdd.basic) localRate = customPkgRatesAdd.basic;
    if(pkg==="standard" && customPkgRatesAdd.standard) localRate = customPkgRatesAdd.standard;
    if(pkg==="premium" && customPkgRatesAdd.premium) localRate = customPkgRatesAdd.premium;
    const latLngQ = lat && lng? `&lat=${lat}&lng=${lng}` : currentLatLng? `&lat=${currentLatLng.lat}&lng=${currentLatLng.lng}` : "";
    const res = await fetch(`/api/rates?city=${encodeURIComponent(cityName)}&plotArea=${plotArea}&storeys=${storeys}&package=${pkg}&rate=${localRate}&steelCompany=${steelCompany}&cementCompany=${cementCompany}&liftCompany=${liftCompany}&currency=${currency}${latLngQ}`);
    const data = await res.json();
    if(manualCoverageAdd!==null){
      data.coverage = manualCoverageAdd;
      data.groundFloorPlate = Math.round(parseInt(plotArea)*manualCoverageAdd);
      data.builtUpArea = Math.round(parseInt(plotArea)*manualCoverageAdd)*parseInt(storeys);
    }
    setApiData(data);
    if(!isManual) setManualBuiltUp(String(data.builtUpArea || 1200));
  };
  useEffect(()=>{ fetchData(debouncedGeo); },[debouncedGeo,debouncedPlotArea,storeys,pkg,steelCompany,cementCompany,liftCompany,currency,manualCoverageAdd,customPkgRatesAdd]);
  const getLiveLocation = () => {
    if(!navigator.geolocation){ alert("GPS not supported"); return; }
    setLiveLabel("Fetching GPS...");
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const {latitude, longitude} = pos.coords;
      setCurrentLatLng({lat:latitude,lng:longitude});
      try{
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const d = await rev.json();
        const city = d.address?.city || d.address?.town || d.address?.village || "Nagpur";
        setGeo(city);
        setLiveLabel(`${city.toUpperCase()} LIVE GPS`);
        fetchData(city, latitude, longitude);
      }
      catch{
        setLiveLabel(`NAGPUR LIVE GPS`);
        fetchData("Nagpur", latitude, longitude);
      }
    },()=>{ setLiveLabel("GPS Denied"); });
  };
  const plotNum = parseInt(plotArea)||2000;
  const liveCoverage = getLiveCoverage(geo, plotNum);
  const coverage = manualCoverageAdd!==null ? manualCoverageAdd : (apiData.coverage || liveCoverage);
  const ratePerSqft = apiData.ratePerSqft || getCityRate(geo);
  const groundPlate = Math.round(plotNum*coverage);
  const autoTca = Math.round(plotNum*coverage) * (parseInt(storeys)||1);
  const tca = isManual? (parseInt(manualBuiltUp)||autoTca) : autoTca;
  const baseMaterials = useMemo(()=>{
    const mats = apiData.materials || [];
    return mats;
  },[apiData, storeys]);
  const finalMaterials = customMaterials || baseMaterials;
  useEffect(()=>{ if(edit) return; setCustomMaterials(null); },[apiData.materials]);
  const grandTotal = apiData.grandTotal || 0;
  const displayTotal = `₹${grandTotal.toLocaleString("en-IN")}`;
  const effectiveRate = apiData.effectiveRatePerSqft || Math.round(grandTotal / (tca || 1));
  const baseRateDisplay = apiData.baseRatePerSqft || getCityRate(geo);
  const applyEdit = () => {
    if(!edit) return;
    const updated = [...finalMaterials];
    updated[edit.idx] = {...updated[edit.idx], qty: edit.qty, rate: edit.rate, company: edit.company, amount: Math.round(edit.qty * edit.rate), name: `${updated[edit.idx].id.toUpperCase()} - ${edit.company}`};
    const newMatTotal = updated.reduce((s:any,i:any)=>s+i.amount,0);
    const newSub = newMatTotal + (apiData.finishing||0);
    const newGrand = Math.round(newSub * 1.05);
    setApiData((prev:any)=>({...prev, materials: updated, materialTotal: newMatTotal, subTotal: newSub, grandTotal: newGrand, grandTotalINR: newGrand}));
    setCustomMaterials(updated);
    setEdit(null);
  }
  const applyBoxEditModal = () => {
    if(!boxEditModal) return;
    const val = boxEditModal.value;
    if(boxEditModal.type==="plot"){ const n = parseInt(val); if(n>0) setPlotArea(String(n)); }
    else if(boxEditModal.type==="coverage"){ let n = parseFloat(val); if(n>1) n=n/100; if(n>0 && n<=1) setManualCoverageAdd(n); }
    else if(boxEditModal.type==="ground"){ const n = parseInt(val); if(n>0){ const cov = n/plotNum; if(cov>0 && cov<=1) setManualCoverageAdd(Math.round(cov*100)/100); } }
    else if(boxEditModal.type==="floor"){ const n = parseInt(val); if(n>=1 && n<=50) setStoreys(String(n)); }
    else if(boxEditModal.type==="basic"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, basic:n})); }
    else if(boxEditModal.type==="standard"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, standard:n})); }
    else if(boxEditModal.type==="premium"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, premium:n})); }
    setBoxEditModal(null);
  }
  const handleWhatsApp = () => {
    const text = `ABuildWise OS - ${geo.toUpperCase()} Plot: ${plotNum} Coverage: ${Math.round(coverage*100)}% = ${groundPlate} Total: ${tca} Grand: Rs.${grandTotal.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const handlePDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    let y = 26;
    doc.setFillColor(15, 20, 31);
    doc.rect(0,0,W,22,'F');
    doc.setDrawColor(34,211,238);
    doc.line(0,22,W,22);
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.text("ABuildWise OS",10,10);
    doc.setFontSize(7);
    doc.setTextColor(34,211,238);
    doc.text(`BASE Rs.${baseRateDisplay} | EFF Rs.${effectiveRate} - ${tca} SQFT - ${geo.toUpperCase()}`,10,16);
    doc.setFillColor(14,165,233,0.15);
    doc.setDrawColor(34,211,238);
    doc.roundedRect(8,y,W-16,10,2,2,'FD');
    doc.setTextColor(34,211,238);
    doc.setFontSize(7);
    doc.text(`${geo.toUpperCase()} LIVE GPS | ${Math.round(coverage*100)}% Coverage | Cement Rs.${apiData.cementRate} | Steel Rs.${apiData.steelRate}`,12,y+6);
    y=40;
    doc.setFillColor(15,39,78);
    doc.setDrawColor(0,229,255);
    doc.roundedRect(8,y,W-16,52,4,4,'FD');
    doc.setFillColor(0,229,255);
    doc.roundedRect(12,y+2,48,7,2,2,'F');
    doc.setTextColor(0,0,0);
    doc.setFontSize(7);
    doc.text("BUILT-UP BOX - 1 PAGE",14,y+6.5);
    const boxW=(W-26)/2;
    let bx=12, by=y+12;
    const boxes=[{l:"PLOT AREA",v:`${plotNum} SQFT`},{l:"COVERAGE LIVE",v:`${Math.round(coverage*100)}% - ${groundPlate} SQFT`},{l:"GROUND PLATE",v:`${groundPlate} SQFT`},{l:getPLabel(storeys),v:`${tca} SQFT`}];
    boxes.forEach((b,i)=>{
      doc.setFillColor(10,26,51);
      doc.roundedRect(bx,by,boxW,13,2.5,2.5,'FD');
      doc.setFontSize(5);
      doc.setTextColor(140,160,180);
      doc.text(b.l,bx+2.5,by+3.5);
      doc.setFontSize(7);
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold");
      doc.text(b.v,bx+2.5,by+8);
      if(i%2===0){bx+=boxW+2;}else{bx=12;by+=15;}
    });
    by+=2;
    doc.setFillColor(8,20,40);
    doc.roundedRect(12,by,W-24,7,2,2,'F');
    doc.setFontSize(5.5);
    doc.setTextColor(140,160,180);
    doc.text("BUILT-UP FORMULA",14,by+4.5);
    doc.setTextColor(0,229,255);
    doc.text(`${plotNum} x ${Math.round(coverage*100)}% = ${groundPlate} x ${storeys} = ${tca} SQFT`,W-16,by+4.5,{align:'right'});
    by+=9;
    doc.setFillColor(0,229,255);
    doc.roundedRect(12,by,W-42,8,4,4,'F');
    doc.setFillColor(17,42,74);
    doc.roundedRect(W-28,by,16,8,4,4,'F');
    doc.setTextColor(0,0,0);
    doc.setFontSize(7);
    doc.text(`TOTAL BUILT-UP: ${tca} SQFT`,14,by+5.2);
    doc.setTextColor(255,255,255);
    doc.setFontSize(5.5);
    doc.text(`${geo.toUpperCase()} LIVE`,W-26,by+5);
    y=by+14;
    doc.setTextColor(255,255,255);
    doc.setFontSize(9);
    doc.text("TOTAL COST ESTIMATE - LIVE",10,y);
    y+=3;
    const costBoxW=(W-20)/3;
    const costs=[{label:"BASIC",rate:basicRateShow,total:Math.round(groundPlate*basicRateShow)},{label:"STANDARD LIVE",rate:standardRateShow,total:Math.round(groundPlate*standardRateShow)},{label:"PREMIUM",rate:premiumRateShow,total:Math.round(groundPlate*premiumRateShow)}];
    costs.forEach((c,i)=>{
      const cx=8+i*(costBoxW+2);
      if(c.label==="STANDARD LIVE"){doc.setFillColor(0,229,255);}else{doc.setFillColor(17,42,74);}
      doc.roundedRect(cx,y,costBoxW,16,3,3,'F');
      doc.setFontSize(6);
      doc.setTextColor(c.label==="STANDARD LIVE"?0:200);
      doc.text(c.label,cx+3,y+4);
      doc.setFontSize(9);
      doc.setFont("helvetica","bold");
      doc.setTextColor(c.label==="STANDARD LIVE"?0:255);
      doc.text(`Rs.${c.rate}/sqft`,cx+3,y+9);
      doc.setFontSize(6);
      doc.text(`Total: Rs.${(c.total/100000).toFixed(2)} Lakh`,cx+3,y+13);
    });
    y+=22;
    doc.setTextColor(255,255,255);
    doc.setFontSize(9);
    doc.text(`${geo} - ${pkg.toUpperCase()} - Materials`,10,y);
    y+=4;
    finalMaterials.forEach((m:any)=>{
      if(y>270){doc.addPage(); y=10;}
      doc.setFillColor(255,255,255,0.05);
      doc.roundedRect(8,y,W-16,6.5,1.5,1.5,'F');
      doc.setFontSize(6);
      doc.setTextColor(200,200,200);
      doc.text(`${m.id.toUpperCase()} - ${m.company} - ${m.qty} @ Rs.${m.rate}`.substring(0,62),10,y+4);
      doc.setFont("helvetica","bold");
      doc.setTextColor(255,255,255);
      doc.text(`Rs.${m.amount.toLocaleString()}`,W-12,y+4,{align:'right'});
      y+=8;
    });
    y+=2;
    doc.setFillColor(34,211,238);
    doc.roundedRect(8,y,W-16,12,3,3,'F');
    doc.setTextColor(0,0,0);
    doc.setFontSize(10);
    doc.text(`GRAND TOTAL LIVE: Rs.${grandTotal.toLocaleString('en-IN')} | EFF Rs.${effectiveRate}/SQFT`,12,y+7.5);
    doc.save(`${geo}_${tca}SQFT_ABuildWise_OS.pdf`);
  };
  const cityBaseRate = getCityRate(geo);
  const basicRateShow = customPkgRatesAdd.basic || Math.round(cityBaseRate*0.82);
  const standardRateShow = customPkgRatesAdd.standard || cityBaseRate;
  const premiumRateShow = customPkgRatesAdd.premium || Math.round(cityBaseRate*1.38);
  return (
    <div className="min-h-screen bg-[#02020a] text-white flex flex-col items-center p-2 pb-32 overflow-y-auto">
      <div className="w-full max-w-[720px]">
        <div className="flex justify-between items-center bg-[#0f141f] border border-cyan-400/20 rounded-full px-4 py-2.5 mb-4">
          <span className="font-bold text-[13px]">ABuildWise OS</span>
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">BASE ₹{baseRateDisplay} | EFF ₹{effectiveRate} • {tca} SQFT</span>
        </div>
        {phase===1 && (
          <div className="bg-[#0f141f]/80 border border-white/10 rounded-[18px] p-4">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-[12px]">Project Config • LIVE MARKET RATE</h2><button onClick={getLiveLocation} className="text-[9px] px-3 py-1 rounded-full bg-cyan-400 text-black font-bold">{liveLabel}</button></div>
            <div className="relative z-[100]">
              <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-4 py-3 text-[12px] outline-none" placeholder="City search" />
              {show && (<div className="absolute left-0 right-0 top-full mt-2 bg-[#1e293b] border border-cyan-400/40 rounded-xl z-[9999] max-h-[200px] overflow-y-auto">{CITIES_DB.filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,15).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-4 py-2 text-[12px] hover:bg-cyan-500/20 cursor-pointer flex justify-between"><span>{c}</span><span className="text-cyan-300">₹{getCityRate(c)}/sqft LIVE</span></div>)}</div>)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px]"><option value="ultratech">Ultratech ₹{apiData.cementRate} LIVE</option><option value="acc">ACC ₹{Math.round(apiData.cementRate*0.97)} LIVE</option><option value="ambuja">Ambuja ₹{Math.round(apiData.cementRate*0.95)} LIVE</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px]"><option value="kamdhenu_nxt">Kamdhenu ₹{apiData.steelRate} LIVE</option><option value="tata_tiscon">Tata ₹{Math.round(apiData.steelRate*1.16)} LIVE</option></select>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[{id:"basic", label:"BASIC", rate: basicRateShow, desc:"-18% • Low"}, {id:"standard", label:"STANDARD LIVE", rate: standardRateShow, desc:"MARKET"}, {id:"premium", label:"PREMIUM", rate: premiumRateShow, desc:"+38% • High"}].map(p=>(
                <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[12px] border p-2 text-left ${pkg===p.id?"bg-cyan-400 text-black border-cyan-400 font-bold":"bg-black/40 border-white/10"}`}><div className="text-[10px]">{p.label}</div><div className="text-[13px]">₹{p.rate}</div><div className="text-[8px] opacity-60">{p.desc}</div></button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"basic", value:String(basicRateShow)})} className="bg-white/10 border border-cyan-400/30 rounded-full py-1.5 text-[9px] font-bold">BASIC EDIT ₹{basicRateShow}</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"standard", value:String(standardRateShow)})} className="bg-cyan-400/20 border border-cyan-400/50 rounded-full py-1.5 text-[9px] font-bold text-cyan-300">STANDARD EDIT ₹{standardRateShow}</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"premium", value:String(premiumRateShow)})} className="bg-white/10 border border-cyan-400/30 rounded-full py-1.5 text-[9px] font-bold">PREMIUM EDIT ₹{premiumRateShow}</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3 text-[12px]" /><div className="text-[8px] text-cyan-300 mt-1 ml-3">Coverage LIVE: {Math.round(coverage*100)}% • {groundPlate} Ground</div></div>
              <div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3 text-[12px] font-bold">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="mt-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/50 rounded-[16px] p-3">
              <div className="flex justify-between items-center mb-2"><h3 className="font-black text-[11px] tracking-wider text-cyan-300">🏗️ BUILT-UP BOX - 1 PAGE</h3><span className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold">LIVE AUTO</span></div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>PLOT AREA</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"plot", value:plotArea})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[13px]">{plotNum} SQFT</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-cyan-400/30"><div className="text-[8px] opacity-60 flex justify-between"><span>COVERAGE LIVE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"coverage", value:String(Math.round(coverage*100))})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[13px] text-cyan-300">{Math.round(coverage*100)}% • {groundPlate} SQFT</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>GROUND PLATE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"ground", value:String(groundPlate)})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[12px]">{groundPlate} SQFT</div><div className="text-[7px] opacity-50">{plotNum} x {Math.round(coverage*100)}% = {groundPlate}</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>{getPLabel(storeys)}</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"floor", value:storeys})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[12px]">{storeys==="1" ? "Ground Floor Only" : `P${storeys} = ${parseInt(storeys)-1} Floor Up`}</div><div className="text-[7px] opacity-50">{storeys==="1" ? `${groundPlate} SQFT Total` : `${groundPlate} x ${storeys} = ${tca}`}</div></div>
              </div>
              <div className="mt-2 bg-black/60 rounded-full px-3 py-2 border border-cyan-400/20 flex justify-between items-center"><span className="text-[9px] opacity-70">BUILT-UP FORMULA</span><span className="text-[10px] font-bold text-cyan-300">{plotNum} x {Math.round(coverage*100)}% = {groundPlate} x {storeys} = {tca} SQFT</span></div>
              <div className="mt-2 flex gap-2"><div className="flex-1 bg-cyan-400 text-black rounded-full py-1.5 text-center font-black text-[11px]">TOTAL BUILT-UP: {tca} SQFT</div><div className="bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-[9px]">📍 {geo.toUpperCase()} LIVE</div></div>
            </div>
            <button onClick={()=>setPhase(2)} className="w-full mt-4 mb-6 bg-white text-black font-bold py-3.5 rounded-full text-[12px] shadow-[0_0_20px_rgba(34,211,238,0.5)]">GENERATE — {displayTotal} • BASE ₹{baseRateDisplay} | EFF ₹{effectiveRate} • {tca} SQFT • {finalMaterials.length} ITEMS LIVE</button>
            <div className="h-24 w-full"></div>
            {boxEditModal && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]"><div className="bg-[#1e293b] border border-cyan-400/50 rounded-[16px] p-4 w-full max-w-[340px]"><h3 className="font-bold text-[12px] mb-1">EDIT {boxEditModal.type.toUpperCase()} - UNLOCKED</h3><input autoFocus type="number" value={boxEditModal.value} onChange={e=>setBoxEditModal({...boxEditModal, value:e.target.value})} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-4 py-3 text-[14px] font-bold outline-none" /><div className="flex gap-2 mt-4"><button onClick={()=>setBoxEditModal(null)} className="flex-1 bg-white/10 rounded-full py-2.5 text-[11px]">CANCEL</button><button onClick={applyBoxEditModal} className="flex-1 bg-cyan-400 text-black font-bold rounded-full py-2.5 text-[11px]">APPLY UNLOCK</button></div></div></div>)}
          </div>
        )}
        {phase===2 && (
          <div className="bg-[#0f141f]/90 border border-cyan-400/30 rounded-[18px] p-4 mb-24">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-[12px]">{geo} • BASE ₹{baseRateDisplay} | EFF ₹{effectiveRate} • {tca} SQFT</h2><button onClick={()=>setPhase(1)} className="text-[10px] px-3 py-1 rounded-full bg-white/10">← BACK</button></div>
            <div className="max-h-[45vh] overflow-y-auto">{finalMaterials.map((m:any, idx:number)=><div key={m.id} className="flex justify-between bg-white/5 rounded-full px-3 py-2 text-[11px] mb-1"><span className="w-[60%] truncate">{m.name} — {m.qty} @ ₹{m.rate}</span><div className="flex gap-2 items-center"><span className="font-bold">₹{m.amount.toLocaleString()}</span><button onClick={()=>setEdit({idx, qty:m.qty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-cyan-400 text-black px-3 py-1 rounded-full text-[9px] font-bold">EDIT</button></div></div>)}</div>
            {edit && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]"><div className="bg-[#1e293b] border border-cyan-400/40 rounded-[16px] p-4 w-full max-w-[360px]"><h3 className="font-bold text-[12px] mb-3">EDIT LIVE - {finalMaterials[edit.idx]?.id.toUpperCase()}</h3><div className="space-y-3"><div><div className="text-[9px] opacity-60">Quantity</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-3 py-2 text-[12px]" /></div><div><div className="text-[9px] opacity-60">Company</div><select value={edit.company} onChange={e=>setEdit({...edit, company: e.target.value})} className="w-full bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px] font-bold">{(COMPANY_MASTER[edit.id] || [{name:edit.company, mult:1, label:"LIVE"}]).map((c:any)=>(<option key={c.name} value={c.name}>{c.name} - {c.label}</option>))}</select></div><div><div className="text-[9px] opacity-60">Rate ₹ LIVE</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-3 py-2 text-[12px] font-bold" /></div></div><div className="flex gap-2 mt-4"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 rounded-full py-2.5 text-[11px]">CANCEL</button><button onClick={applyEdit} className="flex-1 bg-cyan-400 text-black font-bold rounded-full py-2.5 text-[11px]">APPLY LOCK</button></div></div></div>)}
            <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={handleWhatsApp} className="bg-green-600 text-white font-bold py-2.5 rounded-full text-[11px]">WhatsApp</button><button onClick={handlePDF} className="bg-white text-black font-bold py-2.5 rounded-full text-[11px]">PDF</button></div>
            <div className="mt-2 text-[11px] bg-black/30 p-3 rounded-xl"><div className="flex justify-between font-bold text-cyan-300"><span>Grand Total LIVE</span><span>₹{grandTotal.toLocaleString()}</span></div><div className="text-[8px] opacity-50 mt-1">BASE ₹{baseRateDisplay} | EFF ₹{effectiveRate} | Cement ₹{apiData.cementRate} LIVE | Steel ₹{apiData.steelRate} LIVE</div></div>
            <div className="h-20"></div>
          </div>
        )}
      </div>
    </div>
  );
}
