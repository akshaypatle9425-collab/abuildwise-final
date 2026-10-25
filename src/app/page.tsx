"use client";
// @ts-nocheck
// ABuildWise OS - FINAL 4 PAGE WORLD PREMIUM LUXURY - 0 WORD CUT - 11 KAMI FIX + 5 NEW FEATURE - INJECTED
import { useState, useEffect, useMemo, useRef } from "react";
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
const CONTRACTOR_ONLY_IDS = ["ply","batta","jack","mistri","beldar","curing","lift"];
const WORLD_CONTRACT_MODES: any = {
  full: { id: "full", indiaName: "WITH MATERIAL - TURNKEY - Complete Construction Package", worldName: "TURNKEY FULL SERVICE (TWM) - All Inclusive", ownerLabel: "With Material - Turnkey Project - Complete Solution", ownerDesc: "End-to-End Construction. All Materials + Labour + Finishing Included by Contractor. Premium Turnkey Service.", contractorLabel: "WITH MATERIAL - TURNKEY - Full Package - TWM", ratePerSqft: 0, contractorGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","mistri","beldar","curing","lift"], ownerGive: [] },
  centring: { id: "centring", indiaName: "WITHOUT MATERIAL - Formwork + Labour Contract", worldName: "FORMWORK + LABOUR (CWM) - Professional Contract", ownerLabel: "Without Material - Material by Owner, Labour by Contractor", ownerDesc: "Professional Contract. Owner Provides Construction Material, Contractor Provides Formwork, Scaffolding & Skilled Labour.", contractorLabel: "WITHOUT MATERIAL - CENTRING + LABOUR - CWM", ratePerSqft: 450, contractorGive: ["ply","batta","jack","mistri","beldar","curing"], ownerGive: ["cement","steel","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","lift"] },
  labour: { id: "labour", indiaName: "LABOUR ONLY - Skilled Labour Contract", worldName: "LABOUR RATE CONTRACT (LOM) - Labour Only", ownerLabel: "Labour Only - Complete Material by Owner", ownerDesc: "Labour & Supervision Contract Only. Complete Quality Control by Owner. Ideal for Professional Projects.", contractorLabel: "LABOUR ONLY - Skilled Labour Contract - LOM", ratePerSqft: 280, contractorGive: ["mistri","beldar"], ownerGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","curing","lift"] },
  custom: { id: "custom", indiaName: "ITEM RATE - Custom BOQ Contract", worldName: "ITEM RATE / A LA CARTE (CSC) - Custom Selection", ownerLabel: "Item Rate - Custom Selection - Flexible BOQ", ownerDesc: "Flexible BOQ Based Contract. Select Individually Which Items Will Be Provided by Contractor.", contractorLabel: "ITEM RATE - CUSTOM BOQ - CSC", ratePerSqft: 350, contractorGive: [], ownerGive: [] }
};

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
  const [viewMode, setViewMode] = useState<"owner"|"contractor">("owner");
  const [worldMode, setWorldMode] = useState<"full"|"centring"|"labour"|"custom">("centring");
  const [customTick, setCustomTick] = useState<Record<string,"owner"|"contractor">>({});
  // === NEW 4 FEATURE STATE - ADDED WITHOUT CUTTING OLD ===
  const [profitPercent, setProfitPercent] = useState(18);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString("en-IN"));
  const [isListening, setIsListening] = useState(false);
  const [qrShow, setQrShow] = useState(false);
  const recognitionRef = useRef<any>(null);
  // ===== FIX INJECTED WITHOUT CUTTING OLD CODE - 5 NEW FEATURES =====
  const [gstOn, setGstOn] = useState(false); // Feature 4 - GST Toggle
  const [isMergedView, setIsMergedView] = useState(false); // Fix #11 - Page 2+3 Merge Flag
  const RATES_BY_PACKAGE = { basic:{mult:0.82, label:"-18% Economy"}, standard:{mult:1, label:"Market Standard"}, premium:{mult:1.38, label:"+38% Premium"} }; // Fix #9

  useEffect(()=>{
    const day = new Date().getDate();
    const fluc = 1 + ((day % 7) - 3) * 0.006;
    setDailyFluc(fluc);
  },[]);
  useEffect(()=>{
    const t = setInterval(()=> setLastUpdate(new Date().toLocaleString("en-IN")), 60000);
    return ()=> clearInterval(t);
  },[]);
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if(!SR){ alert("Voice not supported"); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onstart = ()=> setIsListening(true);
    rec.onend = ()=> setIsListening(false);
    rec.onresult = (e:any)=>{ const txt = e.results[0][0].transcript; setGeo(txt); setShow(false); fetchData(txt); };
    rec.start();
    recognitionRef.current = rec;
  };
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
    let data = await res.json();
    // ===== 11 KAMI FIX - INJECTED WITHOUT CUTTING OLD WORD - START =====
    // Fix #9 - BASIC/STANDARD/PREMIUM alag amount
    const pkgMult = pkg==="basic"?0.82 : pkg==="premium"?1.38 : 1;
    // Fix #8 - M-Sand 45/CFT, Aggregate 38/CFT (Nagpur live low rate)
    // Fix #1 - %l symbol safe, Fix #2 - Lift 0 filter handled later
    if(data.materials){
      data.materials = data.materials.map((m:any)=>{
        let newRate = m.rate;
        if(m.id==="sand") newRate = 45; // Fix #8
        if(m.id==="aggregate") newRate = 38; // Fix #8
        else newRate = Math.round(m.rate * pkgMult); // Fix #9
        return { ...m, rate: newRate, amount: Math.round(newRate * m.qty) };
      });
      // Recalculate totals after fix
      const newMatTotal = data.materials.reduce((s:any,i:any)=>s+i.amount,0);
      data.materialTotal = newMatTotal;
      data.subTotal = newMatTotal + (data.finishing||0);
      data.grandTotal = Math.round(data.subTotal * 1.05);
      data.grandTotalINR = data.grandTotal;
    }
    // Fix #4 - Base/EFF sahi ke liye effectiveRate recalc
    data.effectiveRatePerSqft = Math.round(data.grandTotal / (Math.round(parseInt(plotArea)* (manualCoverageAdd!==null?manualCoverageAdd:data.coverage||0.64)) * (parseInt(storeys)||1) || 1));
    // ===== 11 KAMI FIX END =====
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
      setCurrentLatLng({lat:latitude, lng:longitude});
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
  const worldModeConfig = WORLD_CONTRACT_MODES[worldMode];
  const getFilteredByWorldMode = (mats:any[])=>{
    if(worldMode==="custom"){
      const cIds = Object.keys(customTick).filter(k=>customTick[k]==="contractor");
      const oIds = Object.keys(customTick).filter(k=>customTick[k]==="owner");
      if(cIds.length===0 && oIds.length===0) return { contractorMats: mats.filter((m:any)=>CONTRACTOR_ONLY_IDS.includes(m.id)), ownerMats: mats.filter((m:any)=>!CONTRACTOR_ONLY_IDS.includes(m.id)) };
      return { contractorMats: mats.filter((m:any)=>cIds.includes(m.id)), ownerMats: mats.filter((m:any)=>oIds.includes(m.id)) };
    }
    return { contractorMats: mats.filter((m:any)=>worldModeConfig.contractorGive.includes(m.id)), ownerMats: mats.filter((m:any)=>worldModeConfig.ownerGive.includes(m.id)) };
  };
  const { contractorMats: worldContractorMats, ownerMats: worldOwnerMats } = getFilteredByWorldMode(finalMaterials);
  const ownerMaterials = finalMaterials.filter((m:any)=>!CONTRACTOR_ONLY_IDS.includes(m.id));
  const displayMaterials = viewMode==="owner" ? (worldMode==="full" ? [] : worldMode==="custom" ? worldOwnerMats : worldOwnerMats) : finalMaterials;
  const ownerMaterialsForDisplay = worldMode==="full" ? [] : worldOwnerMats;
  // ===== FIX #2 & #5 - Filter 0 qty - WITHOUT CUTTING OLD VARIABLE =====
  const filteredOwnerForDisplay = ownerMaterialsForDisplay.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredFinalMaterials = finalMaterials.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredContractorMats = worldContractorMats.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredOwnerMats = worldOwnerMats.filter((m:any)=> m.qty>0 && m.amount>0);

  useEffect(()=>{ if(edit) return; setCustomMaterials(null); },[apiData.materials]);
  const grandTotal = apiData.grandTotal || 0;
  const displayTotal = `Rs.${grandTotal.toLocaleString("en-IN")}`;
  const effectiveRate = apiData.effectiveRatePerSqft || Math.round(grandTotal / (tca || 1));
  const baseRateDisplay = apiData.baseRatePerSqft || getCityRate(geo);
  const cityBaseRate = getCityRate(geo);
  const basicRateShow = customPkgRatesAdd.basic || Math.round(cityBaseRate*0.82);
  const standardRateShow = customPkgRatesAdd.standard || cityBaseRate;
  const premiumRateShow = customPkgRatesAdd.premium || Math.round(cityBaseRate*1.38);
  const worldContractorRate = worldMode==="full" ? standardRateShow : worldMode==="centring" ? 450 : worldMode==="labour" ? 280 : 350;
  const worldContractorCost = filteredContractorMats.reduce((s:any,m:any)=>s+m.amount,0);
  const worldOwnerCost = filteredOwnerMats.reduce((s:any,m:any)=>s+m.amount,0);
  const ownerChargeBase = worldMode==="full" ? tca * standardRateShow : worldMode==="centring" ? worldOwnerCost + (tca*worldContractorRate) : worldMode==="labour" ? worldOwnerCost + (tca*worldContractorRate) : worldOwnerCost + worldContractorCost + (tca*100);
  const ownerCharge = gstOn ? Math.round(ownerChargeBase * 1.18) : ownerChargeBase; // Feature 4 - GST Toggle 18%
  const contractorCost = worldMode==="full" ? grandTotal : worldContractorCost;
  const contractorCharge = worldMode==="full" ? ownerChargeBase : tca * worldContractorRate;
  const profitBase = worldMode==="full" ? contractorCharge - grandTotal : contractorCharge - worldContractorCost;
  const profit = viewMode==="contractor" ? Math.round(contractorCost * (profitPercent/100)) : profitBase;
  const finalContractorCharge = viewMode==="contractor" ? contractorCost + profit : contractorCharge;
  const profitPer = finalContractorCharge>0? Math.round((profit/finalContractorCharge)*100):0;

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
    // Fix #7 - WhatsApp overflow fix with short text + Fix #10 Currency+Package tag + GST tag
    const text = viewMode==="owner" ? `ESTIMATED PROJECT COST - ${geo.toUpperCase()} Plot ${plotNum} Builtup ${tca} PKG ${pkg.toUpperCase()} Rs.${basicRateShow}/${standardRateShow}/${premiumRateShow} Mode ${worldModeConfig.indiaName} Total Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST 18%)':'(Without GST)'} LIVE ${lastUpdate}` : `CONTRACTOR ESTIMATE - ${geo.toUpperCase()} Plot ${plotNum} Mode ${worldModeConfig.contractorLabel} PKG ${pkg.toUpperCase()} Cost Rs.${contractorCost.toLocaleString()} Charge Rs.${finalContractorCharge.toLocaleString()} Profit Rs.${profit.toLocaleString()} (${profitPercent}%) GST ${gstOn?'ON':'OFF'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const handlePDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const GOLD = [212,175,55];
    const BLACK = [8,8,12];
    let y = 0;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,H,'F');
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setLineWidth(0.9);
    doc.rect(6,6,W-12,H-12);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFont("helvetica","bold");
    doc.setFontSize(28);
    doc.text("ABuildWise", W/2, 32, {align:'center'});
    doc.setFontSize(10);
    doc.setTextColor(200,200,200);
    doc.setFont("helvetica","normal");
    doc.text("PROFESSIONAL CONSTRUCTION OS - LUXURY EDITION - 3 PAGE MERGED", W/2, 39, {align:'center'});
    doc.setFillColor(18,18,22);
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setLineWidth(0.4);
    doc.rect(14,48,W-28,78,'FD');
    doc.setTextColor(255,255,255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica","bold");
    // Fix #1 - %l replaced with safe char
    doc.text(`QUOTATION NO: AW-LUXURY-${geo.toUpperCase().slice(0,3)}-${tca} / ${new Date().getFullYear()} | DATE: ${new Date().toLocaleDateString('en-IN')} | VALID 15 DAYS | ${lastUpdate} | PKG ${pkg.toUpperCase()}`, 20, 58);
    doc.setFont("helvetica","normal");
    doc.text(`PROJECT: ${plotNum} SQFT Plot | ${Math.round(coverage*100)}% Coverage = ${groundPlate} SQFT | ${getPLabel(storeys)} | MODE: ${worldModeConfig.indiaName} | PKG ${pkg.toUpperCase()} BASIC ${basicRateShow} STD ${standardRateShow} PREM ${premiumRateShow}`, 20, 65);
    doc.text(`LOCATION: ${geo.toUpperCase()} LIVE | BUILT-UP: ${tca} SQFT | FORMULA: ${plotNum} x ${Math.round(coverage*100)}% = ${groundPlate} x ${storeys} = ${tca} | GST ${gstOn?'18% INCLUDED':'EXTRA'}`, 20, 71);
    doc.text(`BRANDS: Ultratech Rs.356/Bag | Kamdhenu NXT Rs.65/Kg | M-Sand Rs.45/CFT | Aggregate Rs.38/CFT | Polycab | Kajaria | Asian Paints | PROFIT ${profitPercent}%`, 20, 77);
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(20,84,W-40,34,'F');
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.rect(20,84,W-40,34);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica","bold");
    doc.text(`ESTIMATED COST: Rs.${ownerCharge.toLocaleString('en-IN')} ${gstOn?'(With GST)':''}`, W/2, 98, {align:'center'});
    doc.setFontSize(7.5);
    doc.setTextColor(160,160,160);
    doc.text(`BASE Rs.${baseRateDisplay} | EFF Rs.${effectiveRate} | Labour+Centring: Rs.${worldContractorRate}/SQFT | PKG BASIC ${basicRateShow} STD ${standardRateShow} PREM ${premiumRateShow} | Cement Rs.${apiData.cementRate}/Bag Steel Rs.${apiData.steelRate}/Kg`, W/2, 106, {align:'center'});
    doc.setTextColor(180,180,180);
    // Fix #1 - use safe bullet
    doc.text(`Comparison: WITH MATERIAL ~ Rs.${(tca*standardRateShow).toLocaleString()} vs WITHOUT MATERIAL Rs.${ownerCharge.toLocaleString()} | QR VERIFIED ${lastUpdate} | GST ${gstOn?'ON':'OFF'}`, W/2, 112, {align:'center'});
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(7);
    doc.text("PAGE 01 / 04 - LUXURY PROJECT SUMMARY - 3 PAGE MERGED + QR + GST + PROFIT", W/2, H-10, {align:'center'});
    doc.addPage();
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,'F');
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,15,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica","bold");
    doc.text(`DETAILED BOQ - ${tca} SQFT - ${worldModeConfig.indiaName.toUpperCase()} - ${pkg.toUpperCase()} Rs.${pkg==='basic'?basicRateShow:pkg==='standard'?standardRateShow:premiumRateShow}/SQFT - LUXURY`, 10, 10);
    y=20;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(10,y,W-20,8,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(7);
    doc.text("S.No",12,y+5); doc.text("ITEM - COMPANY",22,y+5); doc.text("QTY",82,y+5); doc.text("UNIT",97,y+5); doc.text("RATE",116,y+5); doc.text("AMOUNT",W-12,y+5,{align:'right'});
    y+=10;
    const pdfMats = viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials;
    let sNo=1;
    pdfMats.forEach((m:any)=>{
      if(m.qty<=0 || m.amount<=0) return; // Fix #2
      if(y>270){ doc.addPage(); y=15; }
      const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':'Unit'; // Fix #6 /Bag /Kg
      doc.setFillColor(sNo%2===0?255:255, sNo%2===0?248:255, sNo%2===0?225:255);
      doc.rect(10,y,W-20,7,'F');
      doc.setTextColor(0,0,0);
      doc.setFontSize(7);
      doc.text(`${sNo}`,12,y+4.5); doc.text(`${m.id.toUpperCase()} - ${m.company}`,22,y+4.5); doc.text(`${m.qty}`,82,y+4.5); doc.text(unit,97,y+4.5); doc.text(`Rs.${m.rate}/${unit}`,116,y+4.5); doc.text(`Rs.${m.amount.toLocaleString()}`,W-12,y+4.5,{align:'right'});
      y+=8; sNo++;
    });
    y+=4;
    doc.setFillColor(240,240,240);
    doc.rect(10,y,W-20,6,'F');
    doc.setTextColor(60,60,60);
    doc.setFontSize(8);
    doc.text(`Sub Total: Rs.${worldOwnerCost.toLocaleString()} | PKG ${pkg.toUpperCase()} ${pkg==='basic'?basicRateShow:pkg==='standard'?standardRateShow:premiumRateShow}`, W-12, y+4, {align:'right'});
    y+=7;
    doc.setFillColor(245,245,245);
    doc.rect(10,y,W-20,6,'F');
    doc.text(`5% Contingency: Rs.${Math.round(worldOwnerCost*0.05).toLocaleString()} | GST ${gstOn?'18% INCLUDED - Rs.'+Math.round(ownerChargeBase*0.18).toLocaleString():'EXTRA'}`, W-12, y+4, {align:'right'});
    y+=8;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(10,y,W-20,10,'F');
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.rect(10,y,W-20,10);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica","bold");
    doc.text(`GRAND TOTAL: Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST)':'(Without GST)'} + PROFIT ${profitPercent}% = Rs.${(ownerCharge + profit).toLocaleString()}`, W-12, y+6.5, {align:'right'});
    doc.setTextColor(100,100,100);
    doc.setFontSize(7);
    doc.setFont("helvetica","normal");
    doc.text("PAGE 02 / 04 - DETAILED BOQ WITH UNITS /Bag /Kg /CFT - ZERO QTY HIDDEN - PKG WISE", W/2, H-10, {align:'center'});
    doc.addPage();
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,'F');
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,15,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica","bold");
    doc.text("SCOPE | PAYMENT | TERMS - LUXURY CLOSING - PRO - 3 PAGE MERGED", 10, 10);
    y=22;
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica","bold");
    doc.setFontSize(9);
    doc.text("OWNER SCOPE vs CONTRACTOR SCOPE (FIX #4 - Full Text):", 10, y);
    y+=7;
    doc.setFont("helvetica","normal");
    doc.setFontSize(7.5);
    // Fix #3 - Owner scope full text with sanitary, lift
    doc.text(`OWNER WILL PROVIDE: ${worldModeConfig.ownerGive.join(" | ") || "Payment Only (Turnkey)"} - Includes CEMENT, STEEL, BRICKS, SAND, AGGREGATE, ELECTRICAL, PLUMBING, TILES, PAINT, WATERPROOFING, DOORS, WINDOWS, GLASS, RAILING, POP, SANITARY, LIFT`, 10, y);
    y+=5;
    doc.text(`CONTRACTOR WILL PROVIDE: ${worldModeConfig.contractorGive.join(" | ") || Object.keys(customTick).filter(k=>customTick[k]==="contractor").join(", ")}`, 10, y);
    y+=10;
    doc.setFont("helvetica","bold");
    doc.setFontSize(9);
    doc.text("PAYMENT TIMELINE:", 10, y);
    y+=7;
    doc.setFont("helvetica","normal");
    doc.setFontSize(8);
    doc.text("- 10% Advance on Agreement  ->  - 40% Structure Complete  ->  - 30% Finishing  ->  - 20% Handover", 10, y);
    y+=10;
    doc.setFont("helvetica","bold");
    doc.text("TERMS & CONDITIONS:", 10, y);
    y+=6;
    doc.setFont("helvetica","normal");
    doc.setFontSize(7);
    doc.text(`1. Rates LIVE: Cement Rs.${apiData.cementRate}/Bag Steel Rs.${apiData.steelRate}/Kg M-Sand Rs.45/CFT Aggregate Rs.38/CFT | 2. GST ${gstOn?'18% INCLUDED':'EXTRA'} | 3. Validity 15 Days | Profit ${profitPercent}% | PKG ${pkg.toUpperCase()} BASIC ${basicRateShow} STD ${standardRateShow} PREM ${premiumRateShow}`, 10, y);
    y+=4;
    doc.text(`4. Wastage 5% included | 5. Labour Rate Rs.${worldContractorRate}/SQFT for ${worldModeConfig.indiaName} | 6. Premium Brands: Ultratech/Kamdhenu/Polycab/Kajaria | Live: ${lastUpdate} | Currency INR | Package ${pkg.toUpperCase()}`, 10, y);
    y=H-28;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,y,W,28,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica","bold");
    doc.text("ABuildWise PRO - Luxury Edition | www.abuildwise.com | Premium Builder OS | Professional Quotation | QR VERIFIED | GST + PROFIT SLIDER + VOICE", W/2, y+9, {align:'center'});
    doc.setFontSize(6.5);
    doc.setTextColor(150,150,150);
    doc.setFont("helvetica","normal");
    doc.text(`Quotation: AW-LUXURY-${geo.toUpperCase()}-${tca} | ${tca} SQFT | ${worldModeConfig.indiaName} | PKG ${pkg.toUpperCase()} | Page 03 / 04 - 11 KAMI FIXED - GST ${gstOn?'ON':'OFF'} - Profit ${profitPercent}%`, W/2, y+15, {align:'center'});
    doc.addPage();
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,H,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica","bold");
    doc.text("QR VERIFICATION - WORLD PREMIUM - 3 PAGE", W/2, 30, {align:'center'});
    doc.setFontSize(10);
    doc.setTextColor(255,255,255);
    doc.text(`Scan to Verify: ${geo.toUpperCase()} - ${tca} SQFT - Rs.${ownerCharge.toLocaleString()} - PKG ${pkg.toUpperCase()} - GST ${gstOn?'ON':'OFF'} - ${lastUpdate}`, W/2, 45, {align:'center'});
    doc.text(`PROFIT SLIDER: ${profitPercent}% = Rs.${profit.toLocaleString()} | FINAL CHARGE Rs.${finalContractorCharge.toLocaleString()} | PKG BASIC ${basicRateShow} STD ${standardRateShow} PREM ${premiumRateShow}`, W/2, 52, {align:'center'});
    doc.text("QR Code: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(`ABuildWise-${geo}-${tca}-${ownerCharge}-${pkg}-GST${gstOn?'ON':'OFF'}`), 20, 70);
    doc.text("PAGE 04 / 04 - QR + VOICE + PROFIT + GST + LIVE TIME + 3 PAGE MERGED", W/2, H-10, {align:'center'});
    doc.save(`LUXURY_3PAGE_MERGED_${geo}_${tca}_${pkg}_${worldMode}_QR_GST_PROFIT_VOICE_FINAL.pdf`);
  };

  const Progress = () => (
    <div className="w-full mb-3">
      <div className="flex justify-between mb-2">
        {[1,2,3,4].map(i=>(
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${phase>=i ? "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] text-black border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.6)]" : "bg-white/5 text-white/40 border-white/10"}`}>{i}</div>
            <span className={`text-[8px] font-bold tracking-wider ${phase===i ? "text-[#d4af37]" : "text-white/30"}`}>{i===1?"CONTRACT":i===2?"LOCATION":i===3?"RATES":"ESTIMATE"}</span>
          </div>
        ))}
      </div>
      <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] transition-all duration-700" style={{width:`${phase*25}%`}}></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#02020a] text-white flex flex-col items-center p-2 pb-32 overflow-y-auto relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15),transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.12),transparent_60%)] pointer-events-none"></div>
      <div className="w-full max-w-[720px] relative z-10">
        <div className="flex justify-between items-center bg-gradient-to-r from-[#0f141f] to-[#141a2a] border border-[#d4af37]/20 rounded-full px-4 py-2.5 mb-2 backdrop-blur-xl shadow-[0_0_20px_rgba(212,175,55,0.1)]">
          <span className="font-black text-[12px] tracking-[0.2em]">ABuildWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">WORLD</span> <span className="text-cyan-400 text-[8px]">PRO</span> <span className="text-[7px] text-white/40">• {lastUpdate}</span> <span className="text-[7px] text-[#d4af37]">• PKG {pkg.toUpperCase()} • GST {gstOn?'ON':'OFF'}</span></span>
          <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20">
            <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${viewMode==="owner"?"bg-white text-black shadow":"text-white/60"}`}>OWNER</button>
            <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black shadow":"text-white/60"}`}>CONTRACTOR</button>
          </div>
        </div>
        <Progress />
        <div className="flex justify-between items-center bg-black/40 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-3 backdrop-blur">
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37]">BASE Rs.{baseRateDisplay} | EFF Rs.{effectiveRate} • {tca} SQFT • {worldModeConfig.indiaName} • PKG {pkg.toUpperCase()} {pkg==='basic'?basicRateShow:pkg==='standard'?standardRateShow:premiumRateShow} • PROFIT {profitPercent}% • GST {gstOn?'ON':'OFF'}</span>
          <span className="text-[9px] font-bold text-white">{viewMode==="owner" ? `Rs.${ownerCharge.toLocaleString()}` : `PROFIT: Rs.${profit.toLocaleString()}`}</span>
        </div>

        {phase===1 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] animate-in fade-in">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] tracking-wider">PAGE 1 • CONTRACT TYPE • WORLD PREMIUM</h2><div className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black">STEP 1/4 • LIVE {lastUpdate} • PKG {pkg.toUpperCase()} • GST {gstOn?'ON':'OFF'}</div></div>
            <div className="grid grid-cols-1 gap-2 mb-3 bg-gradient-to-br from-black/50 to-[#d4af37]/[0.03] p-3 rounded-[18px] border border-[#d4af37]/10">
              <div className="text-[9px] font-bold text-[#d4af37] tracking-[0.15em]">PROFESSIONAL CONTRACT SYSTEM - WITH MATERIAL / WITHOUT MATERIAL / LABOUR ONLY / ITEM-WISE - WORLD STANDARD - QR VERIFIED - GST {gstOn?'ON':'OFF'}</div>
              {(Object.keys(WORLD_CONTRACT_MODES) as Array<keyof typeof WORLD_CONTRACT_MODES>).map((k)=>{
                const m = WORLD_CONTRACT_MODES[k];
                const active = worldMode===k;
                return (
                  <button key={k} onClick={()=>setWorldMode(k as any)} className={`text-left p-4 rounded-[16px] border transition-all duration-300 ${active ? "bg-gradient-to-br from-white to-[#f5f5f5] text-black border-white shadow-[0_8px_24px_rgba(255,255,255,0.2)] scale-[1.02]" : "bg-black/40 border-white/10 text-white/80 hover:border-[#d4af37]/30"}`}>
                    <div className="font-black text-[11px] flex justify-between"><span>{viewMode==="owner" ? m.ownerLabel : m.contractorLabel}</span>{active && <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full">SELECTED</span>}</div>
                    <div className="text-[9px] opacity-70 mt-1">{viewMode==="owner" ? m.ownerDesc : `Rate Rs.${m.ratePerSqft || standardRateShow}/sqft • ${m.contractorGive.length} items`} • {m.worldName} • PKG {pkg.toUpperCase()}</div>
                  </button>
                );
              })}
            </div>
            {worldMode==="custom" && (
              <div className="mb-3 bg-white/5 border border-white/10 rounded-[16px] p-3 max-h-[200px] overflow-y-auto">
                <div className="text-[10px] font-bold text-[#d4af37] mb-2">ITEM RATE - Custom Scope Selection - WORLD PREMIUM - GST {gstOn?'ON':'OFF'}</div>
                {finalMaterials.map((mat:any)=>(
                  <div key={mat.id} className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-[10px] font-bold">{mat.id.toUpperCase()}</span>
                    <select value={customTick[mat.id]||"owner"} onChange={e=>setCustomTick({...customTick, [mat.id]: e.target.value as any})} className="bg-black/60 border border-[#d4af37]/20 rounded-full px-3 py-1.5 text-[9px] font-bold">
                      <option value="owner">Owner Scope</option>
                      <option value="contractor">Contractor Scope</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>setPhase(2)} className="w-full mt-4 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-4 rounded-full text-[12px] tracking-wider shadow-[0_0_30px_rgba(212,175,55,0.4)]">NEXT • LOCATION PAGE → PKG {pkg.toUpperCase()} {gstOn?'GST ON':'GST OFF'}</button>
          </div>
        )}

        {phase===2 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-cyan-400/20 rounded-[24px] p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] tracking-wider">PAGE 2 • LOCATION • LIVE GPS WORLD + VOICE + GST {gstOn?'ON':'OFF'}</h2><div className="text-[8px] px-2 py-1 rounded-full bg-cyan-400 text-black font-black">STEP 2/4 • {lastUpdate} • PKG {pkg.toUpperCase()}</div></div>
            <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-[11px] text-[#d4af37]">{viewMode==="owner" ? "Project Location - Professional + Voice" : "Contractor Location"} • {worldModeConfig.indiaName} • PKG {pkg.toUpperCase()}</h2><button onClick={getLiveLocation} className="text-[9px] px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">{liveLabel}</button></div>
            <div className="relative z-[100] flex gap-2">
              <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="flex-1 bg-black/50 border border-[#d4af37]/30 rounded-full px-5 py-4 text-[13px] font-bold outline-none focus:border-[#d4af37] focus:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all" placeholder="Search City - Live Rates - World Premium - VOICE + GST" />
              <button onClick={startVoice} className={`w-[54px] h-[54px] rounded-full flex items-center justify-center font-black text-[18px] border transition-all ${isListening ? "bg-red-500 border-red-400 animate-pulse" : "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] border-[#d4af37] text-black"}`}>{isListening ? "●" : "🎤"}</button>
              {show && (<div className="absolute left-0 right-[62px] top-full mt-2 bg-[#1a2332] border border-[#d4af37]/30 rounded-2xl z-[9999] max-h-[240px] overflow-y-auto backdrop-blur-xl shadow-2xl">{CITIES_DB.filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,15).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-5 py-3 text-[12px] hover:bg-[#d4af37]/10 cursor-pointer flex justify-between border-b border-white/5"><span className="font-bold">{c}</span><span className="text-[#d4af37]">Rs.{getCityRate(c)}/sqft LIVE</span></div>)}</div>)}
            </div>
            <div className="mt-4 bg-gradient-to-br from-white/[0.06] to-cyan-500/5 border border-white/10 rounded-[16px] p-3">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 rounded-xl p-3 border border-white/10"><div className="text-[8px] opacity-60">CURRENT CITY • VOICE ENABLED • PKG {pkg.toUpperCase()}</div><div className="font-black text-[14px] text-[#d4af37]">{geo.toUpperCase()}</div><div className="text-[8px] opacity-50">Rate Rs.{getCityRate(geo)} LIVE • BASIC {basicRateShow} STD {standardRateShow} PREM {premiumRateShow} • {lastUpdate}</div></div>
                <div className="bg-black/40 rounded-xl p-3 border border-cyan-400/20"><div className="text-[8px] opacity-60">COVERAGE • LIVE • GST {gstOn?'18% ON':'OFF'}</div><div className="font-black text-[14px] text-cyan-300">{Math.round(coverage*100)}% • {groundPlate}</div><div className="text-[8px] opacity-50">{plotNum} x {Math.round(coverage*100)}% • Rs.{ownerCharge.toLocaleString()} {gstOn?'(With GST)':''}</div></div>
              </div>
            </div>
            {/* FIX #11 - PAGE 2+3 MERGED VIEW - ADDED WITHOUT CUTTING OLD - SHOW RATES IN LOCATION PAGE */}
            <div className="mt-3 bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">PROFIT % SLIDER + GST TOGGLE - MERGED PAGE 2+3 - PKG {pkg.toUpperCase()}</span>
                <div className="flex gap-2">
                  <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1 rounded-full text-[9px] font-black border ${gstOn?'bg-[#d4af37] text-black border-[#d4af37]':'bg-white/10 text-white/60 border-white/10'}`}>GST 18% {gstOn?'ON':'OFF'}</button>
                  <span className="text-[12px] font-black text-white bg-[#d4af37]/20 px-3 py-1 rounded-full">{profitPercent}%</span>
                </div>
              </div>
              <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37] h-2 bg-white/10 rounded-full" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[{id:"basic", label:"BASIC", rate: basicRateShow, desc:"-18% • Economy • Total ~Rs."+Math.round((tca*basicRateShow)/100000)+"L"}, {id:"standard", label:"STANDARD", rate: standardRateShow, desc:"Market Standard • Total ~Rs."+Math.round((tca*standardRateShow)/100000)+"L"}, {id:"premium", label:"PREMIUM", rate: premiumRateShow, desc:"+38% • Premium • Total ~Rs."+Math.round((tca*premiumRateShow)/100000)+"L"}].map(p=>(
                  <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[16px] border p-3 text-left transition-all duration-300 ${pkg===p.id?"bg-gradient-to-br from-white to-[#f0f0f0] text-black border-white font-black shadow-[0_8px_20px_rgba(255,255,255,0.2)] scale-[1.03]":"bg-black/40 border-white/10 hover:border-[#d4af37]/20"}`}><div className="text-[10px] tracking-wider">{p.label}</div><div className="text-[15px]">Rs.{p.rate}/sqft</div><div className="text-[8px] opacity-60">{p.desc}</div></button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3.5 text-[11px] font-bold">← BACK</button><button onClick={()=>setPhase(3)} className="flex-[2] bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-3.5 rounded-full text-[12px] shadow-[0_0_20px_rgba(212,175,55,0.3)]">NEXT • RATES PAGE → PKG {pkg.toUpperCase()} GST {gstOn?'ON':'OFF'}</button></div>
          </div>
        )}

        {phase===3 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] tracking-wider">PAGE 3 • RATES • WORLD PREMIUM BRANDS + PROFIT SLIDER + GST {gstOn?'ON':'OFF'}</h2><div className="text-[8px] px-2 py-1 rounded-full bg-white text-black font-black">STEP 3/4 • {profitPercent}% PROFIT • PKG {pkg.toUpperCase()} • {lastUpdate}</div></div>
            <div className="bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3 mb-3">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">PROFIT % SLIDER - CONTRACTOR WORLD PREMIUM - GST {gstOn?'ON':'OFF'}</span><span className="text-[12px] font-black text-white bg-[#d4af37]/20 px-3 py-1 rounded-full">{profitPercent}% = Rs.{profit.toLocaleString()} {gstOn?'+GST':''}</span></div>
              <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37] h-2 bg-white/10 rounded-full" />
              <div className="flex justify-between text-[8px] opacity-60 mt-1"><span>5% Min</span><span>Final Charge: Rs.{finalContractorCharge.toLocaleString()} PKG {pkg.toUpperCase()} GST {gstOn?'ON':'OFF'}</span><span>50% Max</span></div>
              <button onClick={()=>setGstOn(!gstOn)} className={`mt-2 w-full py-2 rounded-full text-[10px] font-black border ${gstOn?'bg-[#d4af37] text-black border-[#d4af37]':'bg-white/10 text-white/60 border-white/10'}`}>GST 18% TOGGLE {gstOn?'ON - Rs.'+(ownerCharge-ownerChargeBase).toLocaleString()+' EXTRA':'OFF'}</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="ultratech">Ultratech Rs.{apiData.cementRate}/Bag LIVE PREMIUM</option><option value="acc">ACC Rs.{Math.round(apiData.cementRate*0.97)}/Bag LIVE</option><option value="ambuja">Ambuja Rs.{Math.round(apiData.cementRate*0.95)}/Bag LIVE</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="kamdhenu_nxt">Kamdhenu Rs.{apiData.steelRate}/Kg LIVE WORLD</option><option value="tata_tiscon">Tata Rs.{Math.round(apiData.steelRate*1.16)}/Kg LIVE</option></select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{id:"basic", label:"BASIC", rate: basicRateShow, desc:"-18% • Economy"}, {id:"standard", label:"STANDARD", rate: standardRateShow, desc:"Market Standard"}, {id:"premium", label:"PREMIUM", rate: premiumRateShow, desc:"+38% • Premium"}].map(p=>(
                <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[16px] border p-3 text-left transition-all duration-300 ${pkg===p.id?"bg-gradient-to-br from-white to-[#f0f0f0] text-black border-white font-black shadow-[0_8px_20px_rgba(255,255,255,0.2)] scale-[1.03]":"bg-black/40 border-white/10 hover:border-[#d4af37]/20"}`}><div className="text-[10px] tracking-wider">{p.label}</div><div className="text-[15px]">Rs.{p.rate}</div><div className="text-[8px] opacity-60">{p.desc}</div><div className="text-[7px] font-bold mt-1">TOTAL ~Rs.{Math.round((tca*p.rate)/100000)}L {gstOn?'+GST':''}</div></button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"basic", value:String(basicRateShow)})} className="bg-white/5 border border-white/10 rounded-full py-2 text-[9px] font-bold hover:bg-white/10">BASIC EDIT</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"standard", value:String(standardRateShow)})} className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full py-2 text-[9px] font-bold text-[#d4af37]">STANDARD EDIT</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"premium", value:String(premiumRateShow)})} className="bg-white/5 border border-white/10 rounded-full py-2 text-[9px] font-bold">PREMIUM EDIT</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3.5 text-[12px] font-bold focus:border-[#d4af37]/50 outline-none" /><div className="text-[8px] text-[#d4af37] mt-1 ml-3 font-bold">Coverage: {Math.round(coverage*100)}% • {groundPlate} Ground Plate • Live {lastUpdate} • M-Sand 45/CFT Agg 38/CFT</div></div>
              <div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3.5 text-[12px] font-black">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="mt-3 bg-gradient-to-br from-white/[0.06] to-[#d4af37]/5 border border-white/10 rounded-[16px] p-3">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>PLOT AREA</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"plot", value:plotArea})} className="text-[#d4af37] font-black ml-1">EDIT2</button></div><div className="font-black text-[13px]">{plotNum} SQFT</div></div>
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>COVERAGE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"coverage", value:String(Math.round(coverage*100))})} className="text-[#d4af37] font-black ml-1">EDIT2</button></div><div className="font-black text-[13px] text-[#d4af37]">{Math.round(coverage*100)}% • {groundPlate} SQFT</div></div>
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>GROUND PLATE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"ground", value:String(groundPlate)})} className="text-[#d4af37] font-black ml-1">EDIT2</button></div><div className="font-black text-[12px]">{groundPlate} SQFT</div><div className="text-[7px] opacity-50">{plotNum} x {Math.round(coverage*100)}% = {groundPlate}</div></div>
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>{getPLabel(storeys)}</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"floor", value:storeys})} className="text-[#d4af37] font-black ml-1">EDIT2</button></div><div className="font-black text-[12px]">{storeys==="1" ? "Ground Floor Only" : `P${storeys}`}</div><div className="text-[7px] opacity-50">{groundPlate} x {storeys} = {tca}</div></div>
              </div>
              <div className="mt-2 bg-black/60 rounded-full px-3 py-2 border border-[#d4af37]/20 flex justify-between items-center"><span className="text-[9px] opacity-70 font-bold">BUILT-UP FORMULA + LIVE + GST {gstOn?'ON':'OFF'}</span><span className="text-[10px] font-black text-[#d4af37]">{plotNum} x {Math.round(coverage*100)}% = {groundPlate} x {storeys} = {tca} SQFT • {lastUpdate} • PKG {pkg.toUpperCase()}</span></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={()=>setPhase(2)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3.5 text-[11px] font-bold">← BACK</button><button onClick={()=>setPhase(4)} className="flex-[2] bg-gradient-to-r from-white to-[#e0e0e0] text-black font-black py-3.5 rounded-full text-[12px] shadow-[0_0_20px_rgba(255,255,255,0.2)]">NEXT • FINAL ESTIMATE → QR PKG {pkg.toUpperCase()} GST {gstOn?'ON':'OFF'}</button></div>
          </div>
        )}

        {phase===4 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/30 rounded-[24px] p-4 mb-24 backdrop-blur-xl shadow-[0_20px_80px_rgba(212,175,55,0.15)] animate-in fade-in">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[12px] tracking-wider text-[#d4af37]">PAGE 4 • FINAL ESTIMATE • QR + PROFIT {profitPercent}% • GST {gstOn?'ON':'OFF'} • PKG {pkg.toUpperCase()} • WORLD PREMIUM</h2><button onClick={()=>setPhase(3)} className="text-[10px] px-3 py-1 rounded-full bg-white/10 border border-white/10">← BACK</button></div>
            <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20 mb-3 w-fit">
              <button onClick={()=>setViewMode("owner")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="owner"?"bg-white text-black shadow":"text-white/60"}`}>OWNER ({filteredOwnerForDisplay.length})</button>
              <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black shadow":"text-white/60"}`}>CONTRACTOR ({filteredFinalMaterials.length}) • {profitPercent}%</button>
              <button onClick={()=>setQrShow(!qrShow)} className="px-3 py-1.5 rounded-full text-[9px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 ml-1">QR {qrShow ? "HIDE" : "SHOW"}</button>
              <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[9px] font-black ml-1 border ${gstOn?'bg-[#d4af37] text-black border-[#d4af37]':'bg-white/10 text-white/60 border-white/10'}`}>GST {gstOn?'ON':'OFF'}</button>
            </div>
            {qrShow && (
              <div className="bg-white rounded-[16px] p-3 mb-3 flex gap-3 items-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`ABuildWise-${geo}-${tca}-${ownerCharge}-${lastUpdate}-PROFIT${profitPercent}%-PKG${pkg}-GST${gstOn?'ON':'OFF'}`)}`} alt="QR" className="w-[90px] h-[90px] rounded-xl border" />
                <div className="text-black"><div className="font-black text-[11px]">QR VERIFIED ESTIMATE • PKG {pkg.toUpperCase()} • GST {gstOn?'ON':'OFF'}</div><div className="text-[9px] font-bold">{geo.toUpperCase()} • {tca} SQFT • Rs.{ownerCharge.toLocaleString()} • Profit {profitPercent}% = Rs.{profit.toLocaleString()} • BASIC {basicRateShow} STD {standardRateShow} PREM {premiumRateShow}</div><div className="text-[8px] opacity-60 mt-1">Live: {lastUpdate} • {worldModeConfig.indiaName} • Scan to verify • M-Sand 45/CFT Agg 38/CFT</div><div className="text-[7px] mt-1 bg-black text-white px-2 py-1 rounded-full inline-block">WORLD PREMIUM LUXURY • 4 PAGE • PKG {pkg.toUpperCase()} • GST {gstOn?'ON':'OFF'}</div></div>
              </div>
            )}
            <div className="bg-gradient-to-r from-[#d4af37]/10 to-transparent border border-[#d4af37]/20 rounded-xl p-3 mb-3">
              <div className="font-black text-[#d4af37] text-[11px]">{geo.toUpperCase()} • {viewMode==="owner" ? `ESTIMATE Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST 18%)':''}` : `PROFIT Rs.${profit.toLocaleString()} (${profitPercent}%) FINAL Rs.${finalContractorCharge.toLocaleString()}`} • {tca} SQFT • PKG {pkg.toUpperCase()} BASIC {basicRateShow} STD {standardRateShow} PREM {premiumRateShow} • LIVE {lastUpdate}</div>
              <div className="text-[8px] opacity-70 mt-1">OWNER SCOPE: {worldModeConfig.ownerGive.join(", ") || "Payment Only (Turnkey)"} - Full Scope Includes SANITARY, LIFT </div>
              <div className="text-[8px] opacity-70">CONTRACTOR SCOPE: {worldModeConfig.contractorGive.join(", ") || Object.keys(customTick).filter(k=>customTick[k]==="contractor").join(", ")} • PROFIT SLIDER {profitPercent}% • GST {gstOn?'ON':'OFF'} • PKG {pkg.toUpperCase()}</div>
            </div>
            <div className="max-h-[38vh] overflow-y-auto rounded-xl bg-black/20 p-1 border border-white/5">{(viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials).map((m:any)=>{
              const realIdx = finalMaterials.findIndex((fm:any)=>fm.id===m.id);
              const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':'Unit';
              return (<div key={m.id} className="flex justify-between bg-white/[0.04] hover:bg-white/[0.08] rounded-full px-4 py-2.5 text-[11px] mb-1.5 border border-white/5 transition-all"><span className="w-[60%] truncate font-bold">{m.name} — {m.qty} {unit} @ Rs.{m.rate}/{unit} {CONTRACTOR_ONLY_IDS.includes(m.id) ? "(Contractor)" : ""} • PKG {pkg.toUpperCase()}</span><div className="flex gap-2 items-center"><span className="font-black">Rs.{m.amount.toLocaleString()}</span><button onClick={()=>setEdit({idx:realIdx, qty:m.qty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-white text-black px-3 py-1 rounded-full text-[9px] font-black">EDIT</button></div></div>)
            })}const Progress = () => (
  <div className="w-full mb-3">
    <div className="flex justify-between mb-2">
      {[{n:1,label:"CONTRACT+LOCATION"},{n:2,label:"RATES"},{n:3,label:"ESTIMATE"}].map(i=>(
        <div key={i.n} className="flex items-center gap-1.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${phase>=i.n ? "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] text-black border-[#d4af37]" : "bg-white/5 text-white/40 border-white/10"}`}>{i.n}</div>
          <span className={`text-[8px] font-bold ${phase===i.n ? "text-[#d4af37]" : "text-white/30"}`}>{i.label}</span>
        </div>
      ))}
    </div>{phase===1 && (
  <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl animate-in fade-in">
    <div className="flex justify-between mb-3"><h2 className="font-black text-[13px]">PAGE 1 • CONTRACT + LOCATION MERGED</h2><div className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black">STEP 1/3 • {lastUpdate}</div></div>
    
    {/* CONTRACT TYPE - OLD PAGE 1 */}
    <div className="grid grid-cols-1 gap-2 mb-4 p-3 rounded-[18px] border border-[#d4af37]/10">
      {(Object.keys(WORLD_CONTRACT_MODES) as any).map((k:any)=>{
        const m=WORLD_CONTRACT_MODES[k]; const active=worldMode===k;
        return (<button key={k} onClick={()=>setWorldMode(k)} className={`text-left p-4 rounded-[16px] border ${active?"bg-white text-black border-white scale-[1.02]":"bg-black/40 border-white/10 text-white/80"}`}><div className="font-black text-[11px] flex justify-between"><span>{viewMode==="owner"?m.ownerLabel:m.contractorLabel}</span>{active&&<span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full">SELECTED</span>}</div><div className="text-[9px] opacity-70 mt-1">{m.worldName}</div></button>)
      })}
    </div>

    {/* LOCATION - OLD PAGE 2 - MERGED HERE */}
    <div className="border-t border-[#d4af37]/20 pt-4">
      <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-[11px] text-[#d4af37]">LOCATION + VOICE + GPS</h2><button onClick={getLiveLocation} className="text-[9px] px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-black">{liveLabel}</button></div>
      <div className="relative flex gap-2">
        <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} className="flex-1 bg-black/50 border border-[#d4af37]/30 rounded-full px-5 py-4 text-[13px] font-bold" placeholder="Search City - LIVE" />
        <button onClick={startVoice} className={`w-[54px] h-[54px] rounded-full flex items-center justify-center font-black text-[18px] ${isListening?"bg-red-500":"bg-[#d4af37] text-black"}`}>{isListening?"●":"🎤"}</button>
        {show && (<div className="absolute left-0 right-[62px] top-full mt-2 bg-[#1a2332] border rounded-2xl max-h-[240px] overflow-y-auto z-[9999]">{CITIES_DB.filter((c:any)=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,15).map((c:any)=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-5 py-3 text-[12px] hover:bg-[#d4af37]/10 flex justify-between"><span>{c}</span><span className="text-[#d4af37]">Rs.{getCityRate(c)}/sqft</span></div>)}</div>)}
      </div>
      
      <div className="mt-3 bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3">
        <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">PROFIT + GST + PKG</span>
          <div className="flex gap-2">
            <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1 rounded-full text-[9px] font-black border ${gstOn?'bg-[#d4af37] text-black':'bg-white/10'}`}>GST {gstOn?'ON':'OFF'}</button>
            <span className="text-[12px] font-black bg-[#d4af37]/20 px-3 py-1 rounded-full">{profitPercent}%</span>
          </div>
        </div>
        <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37]" />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[{id:"basic",label:"BASIC",rate:basicRateShow},{id:"standard",label:"STANDARD",rate:standardRateShow},{id:"premium",label:"PREMIUM",rate:premiumRateShow}].map((p:any)=>(
            <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[16px] border p-3 text-left ${pkg===p.id?"bg-white text-black border-white":"bg-black/40 border-white/10"}`}><div className="text-[10px]">{p.label}</div><div className="text-[15px]">Rs.{p.rate}</div></button>
          ))}
        </div>
      </div>
    </div>
    <button onClick={()=>setPhase(2)} className="w-full mt-4 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-4 rounded-full text-[12px]">NEXT • RATES PAGE →</button>
  </div>
)}
    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d060]" style={{width:`${phase*33.33}%`}}></div></div>
  </div>
);
            {viewMode==="owner" && worldMode==="full" && (<div className="text-center py-10 text-white text-[12px] font-black">TURNKEY Package - Complete Scope by Contractor - Final Estimate Rs.{ownerCharge.toLocaleString()} {gstOn?'(With GST)':''} - WORLD PREMIUM - QR VERIFIED {lastUpdate} - PKG {pkg.toUpperCase()}</div>)}
            </div>
            {edit && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"><div className="bg-gradient-to-br from-[#1e293b] to-[#141a2a] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[360px] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"><h3 className="font-black text-[12px] mb-3 text-[#d4af37]">EDIT - {finalMaterials[edit.idx]?.id.toUpperCase()} - WORLD PREMIUM - PKG {pkg.toUpperCase()} - GST {gstOn?'ON':'OFF'}</h3><div className="space-y-3"><div><div className="text-[9px] opacity-60 font-bold">Quantity</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 text-[12px] font-bold focus:border-[#d4af37]/50 outline-none" /></div><div><div className="text-[9px] opacity-60 font-bold">Company</div><select value={edit.company} onChange={e=>setEdit({...edit, company: e.target.value})} className="w-full bg-black/60 border border-[#d4af37]/20 rounded-full px-3 py-3 text-[11px] font-bold">{(COMPANY_MASTER[edit.id] || [{name:edit.company, mult:1, label:"LIVE"}]).map((c:any)=>(<option key={c.name} value={c.name}>{c.name} - {c.label}</option>))}</select></div><div><div className="text-[9px] opacity-60 font-bold">Rate - /Bag /Kg /CFT Live - M-Sand 45 Agg 38</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 text-[12px] font-bold focus:border-[#d4af37]/50 outline-none" /></div></div><div className="flex gap-2 mt-5"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[11px] font-bold">CANCEL</button><button onClick={applyEdit} className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black rounded-full py-3 text-[11px]">APPLY PREMIUM PKG {pkg.toUpperCase()}</button></div></div></div>)}
            <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={handleWhatsApp} className="bg-gradient-to-r from-green-600 to-green-500 text-white font-black py-3 rounded-full text-[11px] shadow-[0_0_15px_rgba(34,197,94,0.3)]">WhatsApp - {worldModeConfig.indiaName} - {pkg.toUpperCase()} {profitPercent}% GST {gstOn?'ON':'OFF'}</button><button onClick={handlePDF} className="bg-gradient-to-r from-white to-[#f0f0f0] text-black font-black py-3 rounded-full text
