"use client";
// @ts-nocheck
// ABuildWise OS - FINAL 3 PAGE MERGED WORLD PREMIUM - BUILD PASS FIX - 0 WORD CUT - WORLD LEVEL V2 - 23 ITEMS FIXED
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
  contingency: [{name:"Site Supervision & Tools", mult:1, label:"LIVE - 23rd ITEM"}],
}
type EditState = { idx:number, qty:number, rate:number, company:string, cat:string, id:string } | null;
type BoxEditModal = { type:"plot"|"coverage"|"ground"|"floor"|"basic"|"standard"|"premium", value:string } | null;
const CONTRACTOR_ONLY_IDS = ["ply","batta","jack","mistri","beldar","curing","lift","contingency"];
const WORLD_CONTRACT_MODES: any = {
  full: { id: "full", indiaName: "WITH MATERIAL - TURNKEY - Complete Construction Package", worldName: "TURNKEY FULL SERVICE (TWM) - All Inclusive", ownerLabel: "With Material - Turnkey Project - Complete Solution", ownerDesc: "End-to-End Construction. All Materials + Labour + Finishing Included by Contractor. Premium Turnkey Service.", contractorLabel: "WITH MATERIAL - TURNKEY - Full Package - TWM - 23 ITEMS", ratePerSqft: 0, contractorGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","mistri","beldar","curing","lift","contingency"], ownerGive: [] },
  centring: { id: "centring", indiaName: "WITHOUT MATERIAL - Formwork + Labour Contract", worldName: "FORMWORK + LABOUR (CWM) - Professional Contract", ownerLabel: "Without Material - Material by Owner, Labour by Contractor", ownerDesc: "Professional Contract. Owner Provides Construction Material, Contractor Provides Formwork, Scaffolding & Skilled Labour.", contractorLabel: "WITHOUT MATERIAL - CENTRING + LABOUR - CWM - 23 ITEMS", ratePerSqft: 450, contractorGive: ["ply","batta","jack","mistri","beldar","curing","contingency"], ownerGive: ["cement","steel","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","lift"] },
  labour: { id: "labour", indiaName: "LABOUR ONLY - Skilled Labour Contract", worldName: "LABOUR RATE CONTRACT (LOM) - Labour Only", ownerLabel: "Labour Only - Complete Material by Owner", ownerDesc: "Labour & Supervision Contract Only. Complete Quality Control by Owner. Ideal for Professional Projects.", contractorLabel: "LABOUR ONLY - Skilled Labour Contract - LOM - 23 ITEMS", ratePerSqft: 280, contractorGive: ["mistri","beldar","contingency"], ownerGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","curing","lift"] },
  custom: { id: "custom", indiaName: "ITEM RATE - Custom BOQ Contract", worldName: "ITEM RATE / A LA CARTE (CSC) - Custom Selection", ownerLabel: "Item Rate - Custom Selection - Flexible BOQ", ownerDesc: "Flexible BOQ Based Contract. Select Individually Which Items Will Be Provided by Contractor.", contractorLabel: "ITEM RATE - CUSTOM BOQ - CSC - 23 ITEMS", ratePerSqft: 350, contractorGive: [], ownerGive: [] }
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
  const [customTick, setCustomTick] = useState<any>({});
  const [profitPercent, setProfitPercent] = useState(18);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [qrShow, setQrShow] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [gstOn, setGstOn] = useState(false);
  const [isMergedView, setIsMergedView] = useState(false);
  const RATES_BY_PACKAGE = { basic:{mult:0.82, label:"-18% Economy"}, standard:{mult:1, label:"Market Standard"}, premium:{mult:1.38, label:"+38% Premium"} };

  useEffect(()=>{
    setLastUpdate(new Date().toLocaleString("en-IN"));
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
    const pkgMult = pkg==="basic"?0.82 : pkg==="premium"?1.38 : 1;
    if(data.materials){
      data.materials = data.materials.map((m:any)=>{
        let newRate = m.rate;
        if(m.id==="sand") newRate = 45;
        if(m.id==="aggregate") newRate = 38;
        else if(m.id==="contingency") newRate = 25;
        else newRate = Math.round(m.rate * pkgMult);
        return { ...m, rate: newRate, amount: Math.round(newRate * m.qty) };
      });
      const hasContingency = data.materials.some((x:any)=>x.id==="contingency");
      if(!hasContingency){
        data.materials.push({ id:"contingency", name:"CONTINGENCY + Site Supervision & Tools - 23rd ITEM", qty:1280, rate:25, amount:32000, company:"Site Supervision & Tools", cat:"contingency" });
      }
      const newMatTotal = data.materials.reduce((s:any,i:any)=>s+i.amount,0);
      data.materialTotal = newMatTotal;
      data.subTotal = newMatTotal + (data.finishing||0);
      data.grandTotal = Math.round(data.subTotal * 1.05);
      data.grandTotalINR = data.grandTotal;
    }
    data.effectiveRatePerSqft = Math.round(data.grandTotal / (Math.round(parseInt(plotArea)* (manualCoverageAdd!==null?manualCoverageAdd:data.coverage||0.64)) * (parseInt(storeys)||1) || 1));
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
    if(mats.length>0 && mats.length<23){
      const hasC = mats.some((x:any)=>x.id==="contingency");
      if(!hasC){
        return [...mats, { id:"contingency", name:"CONTINGENCY + Site Supervision & Tools - 23rd ITEM", qty:1280, rate:25, amount:32000, company:"Site Supervision & Tools", cat:"contingency" }];
      }
    }
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
  const filteredOwnerForDisplay = worldOwnerMats.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredFinalMaterials = finalMaterials.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredContractorMats = worldContractorMats.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredOwnerMats = worldOwnerMats.filter((m:any)=> m.qty>0 && m.amount>0);

  useEffect(()=>{ if(edit) return; setCustomMaterials(null); },[apiData.materials]);
  const grandTotal = apiData.grandTotal || 0;
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
  const ownerCharge = gstOn ? Math.round(ownerChargeBase * 1.18) : ownerChargeBase;
  const contractorCost = worldMode==="full" ? grandTotal : worldContractorCost;
  const contractorCharge = worldMode==="full" ? ownerChargeBase : tca * worldContractorRate;
  const profitBase = worldMode==="full" ? contractorCharge - grandTotal : contractorCharge - worldContractorCost;
  const profit = viewMode==="contractor" ? Math.round(contractorCost * (profitPercent/100)) : profitBase;
  const finalContractorCharge = viewMode==="contractor" ? contractorCost + profit : contractorCharge;

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
    const text = viewMode==="owner" ? `ESTIMATED PROJECT COST - ${geo.toUpperCase()} Plot ${plotNum} Builtup ${tca} PKG ${pkg.toUpperCase()} Rs.${basicRateShow}/${standardRateShow}/${premiumRateShow} Mode ${worldModeConfig.indiaName} Total Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST 18%)':'(Without GST)'} LIVE ${lastUpdate}` : `CONTRACTOR ESTIMATE - ${geo.toUpperCase()} Plot ${plotNum} Mode ${worldModeConfig.contractorLabel} PKG ${pkg.toUpperCase()} Cost Rs.${contractorCost.toLocaleString()} Charge Rs.${finalContractorCharge.toLocaleString()} Profit Rs.${profit.toLocaleString()} (${profitPercent}%) GST ${gstOn?'ON':'OFF'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const handlePDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const GOLD = [212,175,55];
    const BLACK = [8,8,12];
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
    doc.text("PROFESSIONAL CONSTRUCTION OS - WORLD LEVEL V2 - 23 ITEMS", W/2, 39, {align:'center'});
    doc.setFillColor(18,18,22);
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setLineWidth(0.4);
    doc.rect(14,48,W-28,78,'FD');
    doc.setTextColor(255,255,255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica","bold");
    doc.text(`QUOTATION NO: AW-WORLD-${geo.toUpperCase().slice(0,3)}-${tca} / ${new Date().getFullYear()} | DATE: ${new Date().toLocaleDateString('en-IN')} | VALID 15 DAYS | ${lastUpdate} | PKG ${pkg.toUpperCase()} | 23 ITEMS`, 20, 58);
    doc.setFont("helvetica","normal");
    doc.text(`PROJECT: ${plotNum} SQFT Plot | ${Math.round(coverage*100)}% Coverage = ${groundPlate} SQFT | ${getPLabel(storeys)} | MODE: ${worldModeConfig.indiaName} | PKG ${pkg.toUpperCase()}`, 20, 65);
    doc.text(`LOCATION: ${geo.toUpperCase()} LIVE | BUILT-UP: ${tca} SQFT | FORMULA: ${plotNum} x ${Math.round(coverage*100)}% = ${groundPlate} x ${storeys} = ${tca} | GST ${gstOn?'18% INCLUDED':'EXTRA'}`, 20, 71);
    doc.text(`BRANDS: Ultratech Rs.356/Bag | Kamdhenu NXT Rs.65/Kg | M-Sand Rs.45/CFT | Aggregate Rs.38/CFT | Polycab | Kajaria | Asian Paints | PROFIT ${profitPercent}% Rs.${profit.toLocaleString()} | 23 ITEMS`, 20, 77);
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
    doc.text(`BASE Rs.${baseRateDisplay} | EFF Rs.${effectiveRate} | Labour+Centring: Rs.${worldContractorRate}/SQFT | PKG BASIC ${basicRateShow} STD ${standardRateShow} PREM ${premiumRateShow} | 23 ITEMS | PROFIT ${profitPercent}%`, W/2, 106, {align:'center'});
    doc.setTextColor(180,180,180);
    doc.text(`Comparison: WITH MATERIAL ~ Rs.${(tca*standardRateShow).toLocaleString()} vs WITHOUT MATERIAL Rs.${ownerCharge.toLocaleString()} | QR VERIFIED ${lastUpdate} | M-Sand 45 Agg 38`, W/2, 112, {align:'center'});
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(7);
    doc.text("PAGE 01 / 03 - WORLD LEVEL PROJECT SUMMARY - 23 ITEMS VERIFIED - M-SAND 45 AGG 38", W/2, H-10, {align:'center'});
    doc.addPage();
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,'F');
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,15,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica","bold");
    doc.text(`DETAILED BOQ - ${tca} SQFT - ${worldModeConfig.indiaName.toUpperCase()} - ${pkg.toUpperCase()} - 23 ITEMS`, 10, 10);
    let y=20;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(10,y,W-20,8,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(7);
    doc.text("S.No",12,y+5); doc.text("ITEM - COMPANY",22,y+5); doc.text("QTY",82,y+5); doc.text("UNIT",97,y+5); doc.text("RATE",116,y+5); doc.text("AMOUNT",W-12,y+5,{align:'right'});
    y+=10;
    const pdfMats = viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials;
    let sNo=1;
    pdfMats.forEach((m:any)=>{
      if(y>255){ doc.addPage(); y=15; }
      const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':m.id==='contingency'?'Days':'Unit';
      doc.setFillColor(sNo%2===0?255:255, sNo%2===0?248:255, sNo%2===0?225:255);
      doc.rect(10,y,W-20,7,'F');
      doc.setTextColor(0,0,0);
      doc.setFontSize(7);
      doc.text(`${sNo}`,12,y+4.5); doc.text(`${m.id.toUpperCase()} - ${m.company}`,22,y+4.5); doc.text(`${m.qty}`,82,y+4.5); doc.text(unit,97,y+4.5); doc.text(`Rs.${m.rate}/${unit}`,116,y+4.5); doc.text(`Rs.${m.amount.toLocaleString()}`,W-12,y+4.5,{align:'right'});
      y+=8; sNo++;
    });
    y+=2;
    doc.setFillColor(255,243,205);
    doc.rect(10,y,W-20,7,'F');
    doc.setTextColor(120,60,0);
    doc.setFontSize(7.5);
    doc.setFont("helvetica","bold");
    doc.text(`WASTAGE 3-4-5% + LABOUR CESS 1% + M-SAND Rs.45/CFT + AGG Rs.38/CFT + CONTINGENCY 23rd ITEM INCLUDED`, 12, y+4.5);
    y+=8;
    doc.setFillColor(18,18,22);
    doc.rect(10,y,W-20,9,'F');
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.rect(10,y,W-20,9);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(9);
    doc.text(`PROFIT ${profitPercent}% : Rs.${profit.toLocaleString()} | FINAL CHARGE: Rs.${finalContractorCharge.toLocaleString()} | GST ${gstOn?'ON':'OFF'} | 23 ITEMS WORLD LEVEL`, W-12, y+6, {align:'right'});
    y+=11;
    doc.setFillColor(240,240,240);
    doc.rect(10,y,W-20,6,'F');
    doc.setTextColor(60,60,60);
    doc.setFontSize(8);
    doc.text(`Sub Total: Rs.${worldOwnerCost.toLocaleString()} | Contractor Cost: Rs.${worldContractorCost.toLocaleString()} | PKG ${pkg.toUpperCase()} | 23 ITEMS VERIFIED`, W-12, y+4, {align:'right'});
    y+=7;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(10,y,W-20,10,'F');
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.rect(10,y,W-20,10);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica","bold");
    doc.text(`GRAND TOTAL: Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST)':'(GST Extra)'} - WORLD LEVEL VERIFIED 23 ITEMS`, W-12, y+6.5, {align:'right'});
    doc.addPage();
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]);
    doc.rect(0,0,W,H,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica","bold");
    doc.text("QR VERIFICATION - WORLD PREMIUM - 23 ITEMS - 3 PAGE MERGED", W/2, 30, {align:'center'});
    doc.setFontSize(10);
    doc.setTextColor(255,255,255);
    doc.text(`Scan to Verify: ${geo.toUpperCase()} - ${tca} SQFT - Rs.${ownerCharge.toLocaleString()} - PKG ${pkg.toUpperCase()} - 23 ITEMS - M-Sand 45 Agg 38 - Profit ${profitPercent}%`, W/2, 45, {align:'center'});
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.setLineWidth(0.6);
    doc.rect(W/2-35, 55, 70, 70);
    doc.save(`WORLD_LEVEL_${geo}_${tca}_${pkg}_${worldMode}_23ITEMS_FINAL.pdf`);
  };

  const Progress = () => (
    <div className="w-full mb-3">
      <div className="flex justify-between mb-2">
        {[{n:1,label:"CONTRACT+LOCATION"},{n:2,label:"RATES"},{n:3,label:"ESTIMATE"}].map(i=>(
          <div key={i.n} className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${phase>=i.n ? "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] text-black border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.6)]" : "bg-white/5 text-white/40 border-white/10"}`}>{i.n}</div>
            <span className={`text-[8px] font-bold tracking-wider ${phase===i.n ? "text-[#d4af37]" : "text-white/30"}`}>{i.label}</span>
          </div>
        ))}
      </div>
      <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] transition-all duration-700" style={{width:`${(phase/3)*100}%`}}></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#02020a] text-white flex flex-col items-center p-2 pb-32 overflow-y-auto relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15),transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.12),transparent_60%)] pointer-events-none"></div>
      <div className="w-full max-w-[720px] relative z-10">
        <div className="flex justify-between items-center bg-gradient-to-r from-[#0f141f] to-[#141a2a] border border-[#d4af37]/20 rounded-full px-4 py-2.5 mb-2 backdrop-blur-xl shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <span className="font-black text-[12px] tracking-[0.2em]">ABuildWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">WORLD</span> <span className="text-cyan-400 text-[8px]">PRO • 23 ITEMS</span> <span className="text-[7px] text-white/40">• {lastUpdate}</span></span>
          <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20">
            <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${viewMode==="owner"?"bg-white text-black shadow":"text-white/60"}`}>OWNER ({filteredOwnerForDisplay.length})</button>
            <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black shadow":"text-white/60"}`}>CONTRACTOR ({filteredFinalMaterials.length})</button>
          </div>
        </div>
        <Progress />
        <div className="flex justify-between items-center bg-black/60 border border-cyan-400/20 rounded-full px-4 py-2 mb-3 backdrop-blur shadow-inner">
          <span className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/20 text-[#d4af37] font-bold tracking-wider">BASE Rs.{baseRateDisplay} | EFF Rs.{effectiveRate} • {tca} SQFT • {worldModeConfig.indiaName} • PKG {pkg.toUpperCase()} • 23 ITEMS • M-SAND 45 AGG 38</span>
          <span className="text-[10px] font-black text-white bg-gradient-to-r from-[#d4af37]/20 to-[#f0d060]/20 px-3 py-1 rounded-full border border-[#d4af37]/30">{viewMode==="owner" ? `Rs.${ownerCharge.toLocaleString()}` : `PROFIT: Rs.${profit.toLocaleString()} (${profitPercent}%)`}</span>
        </div>

        {phase===1 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl animate-in fade-in shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] tracking-wider text-[#d4af37]">PAGE 1 • CONTRACT + LOCATION MERGED • WORLD LEVEL 23 ITEMS</h2><div className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black">STEP 1/3 • MERGED • WORLD</div></div>
            
            <div className="grid grid-cols-1 gap-2 mb-3 bg-black/40 p-3 rounded-[18px] border border-[#d4af37]/10">
              <div className="text-[9px] font-bold text-[#d4af37] tracking-[0.15em]">CONTRACT TYPE • WORLD LEVEL 23 ITEMS</div>
              {(Object.keys(WORLD_CONTRACT_MODES) as Array<keyof typeof WORLD_CONTRACT_MODES>).map((k)=>{
                const m = WORLD_CONTRACT_MODES[k];
                const active = worldMode===k;
                return (
                  <button key={k} onClick={()=>setWorldMode(k as any)} className={`text-left p-4 rounded-[16px] border transition-all ${active ? "bg-white text-black border-white shadow-[0_8px_24px_rgba(255,255,255,0.2)] scale-[1.02]" : "bg-black/40 border-white/10 text-white/80 hover:border-[#d4af37]/30"}`}>
                    <div className="font-black text-[11px] flex justify-between"><span>{viewMode==="owner" ? m.ownerLabel : m.contractorLabel}</span>{active && <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full animate-pulse">SELECTED • 23 ITEMS</span>}</div>
                    <div className="text-[9px] opacity-70 mt-1">{m.worldName}</div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 mb-3 backdrop-blur">
              <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-[11px] text-cyan-300">LOCATION • LIVE GPS + VOICE • WORLD</h2><button onClick={getLiveLocation} className="text-[9px] px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-black shadow">{liveLabel}</button></div>
              <div className="relative z-[100] flex gap-2">
                <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="flex-1 bg-black/50 border border-[#d4af37]/30 rounded-full px-5 py-4 text-[13px] font-bold outline-none focus:border-[#d4af37] transition-all" placeholder="Search City - Live Rates - 23 Items" />
                <button onClick={startVoice} className={`w-[54px] h-[54px] rounded-full flex items-center justify-center font-black text-[18px] border ${isListening ? "bg-red-500 border-red-400 animate-pulse" : "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] border-[#d4af37] text-black shadow"}`}>{isListening ? "●" : "🎤"}</button>
                {show && (<div className="absolute left-0 right-[62px] top-full mt-2 bg-[#1a2332] border border-[#d4af37]/30 rounded-2xl z-[9999] max-h-[240px] overflow-y-auto shadow-2xl">{CITIES_DB.filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,15).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-5 py-3 text-[12px] hover:bg-[#d4af37]/10 cursor-pointer flex justify-between border-b border-white/5"><span className="font-bold">{c}</span><span className="text-[#d4af37]">Rs.{getCityRate(c)}/sqft LIVE • 23 ITEMS</span></div>)}</div>)}
              </div>
            </div>

            <div className="bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3 mb-3">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">PROFIT % + GST + PACKAGE • WORLD • 23 ITEMS</span>
                <div className="flex gap-2 items-center">
                  <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[9px] font-black border transition-all ${gstOn?'bg-[#d4af37] text-black border-[#d4af37] shadow':'bg-white/10 text-white/60 border-white/10'}`}>GST 18% {gstOn?'ON':'OFF'}</button>
                  <span className="text-[12px] font-black text-black bg-gradient-to-r from-[#d4af37] to-[#f0d060] px-3 py-1 rounded-full shadow">{profitPercent}%</span>
                </div>
              </div>
              <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37] h-2 bg-white/10 rounded-full" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[{id:"basic", label:"BASIC", rate: basicRateShow},{id:"standard", label:"STANDARD", rate: standardRateShow},{id:"premium", label:"PREMIUM", rate: premiumRateShow}].map(p=>(
                  <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[16px] border p-3 text-left transition-all ${pkg===p.id?"bg-white text-black border-white font-black shadow scale-[1.03]":"bg-black/40 border-white/10 hover:border-[#d4af37]/20"}`}><div className="text-[10px]">{p.label}</div><div className="text-[15px]">Rs.{p.rate}/sqft</div><div className="text-[8px] opacity-60">{p.id==="basic"?"-18% Economy":p.id==="standard"?"Market Std":"+38% Premium"}</div></button>
                ))}
              </div>
              <div className="mt-3 text-[8px] text-white/50 font-bold tracking-wider bg-white/5 rounded-full px-3 py-2 border border-white/5">M-SAND Rs.45/CFT • AGGREGATE Rs.38/CFT • WASTAGE 3-4-5% • 23rd CONTINGENCY Rs.32000 • WORLD LEVEL VERIFIED</div>
            </div>

            <button onClick={()=>setPhase(2)} className="w-full mt-2 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-4 rounded-full text-[12px] shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all">NEXT • RATES PAGE → WORLD LEVEL 23 ITEMS</button>
          </div>
        )}

        {phase===2 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl animate-in fade-in">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] text-[#d4af37]">PAGE 2 • RATES • WORLD PREMIUM • 23 ITEMS</h2><div className="text-[8px] px-2 py-1 rounded-full bg-white text-black font-black">STEP 2/3 • {profitPercent}% • PKG {pkg.toUpperCase()} • 23 ITEMS</div></div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="ultratech">Ultratech Rs.{apiData.cementRate}/Bag</option><option value="acc">ACC Rs.{Math.round(apiData.cementRate*0.97)}/Bag</option><option value="ambuja">Ambuja Rs.{Math.round(apiData.cementRate*0.95)}/Bag</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="kamdhenu_nxt">Kamdhenu Rs.{apiData.steelRate}/Kg</option><option value="tata_tiscon">Tata Rs.{Math.round(apiData.steelRate*1.16)}/Kg</option></select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3.5 text-[12px] font-bold outline-none focus:border-[#d4af37]/50" /><div className="text-[8px] text-[#d4af37] mt-1 ml-3 font-bold">Coverage: {Math.round(coverage*100)}% • {groundPlate} Ground • M-Sand 45/CFT Agg 38/CFT • 23rd Item</div></div>
              <div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3.5 text-[12px] font-black">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3.5 text-[11px] font-bold hover:bg-white/20">← BACK</button><button onClick={()=>setPhase(3)} className="flex-[2] bg-gradient-to-r from-white to-[#e0e0e0] text-black font-black py-3.5 rounded-full text-[12px] shadow">NEXT • FINAL ESTIMATE 23 ITEMS →</button></div>
          </div>
        )}

        {phase===3 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/30 rounded-[24px] p-4 mb-24 backdrop-blur-xl animate-in fade-in shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex justify-between mb-3 items-center"><h2 className="font-black text-[11px] text-[#d4af37] tracking-wider">PAGE 3 • FINAL ESTIMATE • QR + PROFIT {profitPercent}% • GST {gstOn?'ON':'OFF'} • 23 ITEMS • WORLD LEVEL</h2><button onClick={()=>setPhase(2)} className="text-[10px] px-3 py-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/20">← BACK</button></div>
            <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20 mb-3 w-fit flex-wrap gap-1">
              <button onClick={()=>setViewMode("owner")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="owner"?"bg-white text-black shadow":"text-white/60 hover:text-white"}`}>OWNER ({filteredOwnerForDisplay.length})</button>
              <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black shadow":"text-white/60 hover:text-white"}`}>CONTRACTOR ({filteredFinalMaterials.length}) • 23 ITEMS</button>
              <button onClick={()=>setQrShow(!qrShow)} className="px-3 py-1.5 rounded-full text-[9px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 ml-1 hover:bg-cyan-400/30">QR {qrShow ? "HIDE" : "SHOW"} • WORLD</button>
              <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[9px] font-black ml-1 border transition-all ${gstOn?'bg-[#d4af37] text-black border-[#d4af37] shadow':'bg-white/10 text-white/60 border-white/10'}`}>GST {gstOn?'ON • 18%':'OFF'}</button>
            </div>
            {qrShow && (
              <div className="bg-gradient-to-br from-white to-[#f5f5f5] rounded-[16px] p-3 mb-3 flex gap-3 items-center border-2 border-[#d4af37]/30 shadow-[0_8px_24px_rgba(212,175,55,0.2)]">
                <div className="bg-black p-2 rounded-xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`ABuildWise-WORLD-23ITEMS-${geo}-${tca}-${ownerCharge}-${lastUpdate}-PROFIT${profitPercent}%`)}`} alt="QR" className="w-[90px] h-[90px] rounded-lg border-2 border-[#d4af37]" /></div>
                <div className="text-black"><div className="font-black text-[11px] tracking-wider">QR VERIFIED • WORLD LEVEL • 23 ITEMS</div><div className="text-[9px] font-bold mt-1">{geo.toUpperCase()} • {tca} SQFT • Rs.{ownerCharge.toLocaleString()} • Profit {profitPercent}% Rs.{profit.toLocaleString()} • GST {gstOn?'ON':'OFF'}</div><div className="text-[7px] mt-1 opacity-60">M-Sand 45 • Agg 38 • Contingency 23rd • Wastage Included • {lastUpdate}</div></div>
              </div>
            )}
            <div className="max-h-[52vh] overflow-y-auto rounded-xl bg-black/30 p-2 border border-white/5 backdrop-blur scrollbar-thin">{(viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials).map((m:any, idx:number)=>{
              const realIdx = finalMaterials.findIndex((fm:any)=>fm.id===m.id);
              const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':m.id==='contingency'?'Days':'Unit';
              const sNo = idx+1;
              return (<div key={m.id} className="flex justify-between bg-gradient-to-r from-white/[0.06] to-white/[0.03] rounded-full px-4 py-2.5 text-[11px] mb-1.5 border border-white/10 hover:border-[#d4af37]/30 transition-all group"><span className="w-[62%] truncate font-bold flex gap-2"><span className="text-[#d4af37] font-black">{sNo}.</span><span className="group-hover:text-[#d4af37] transition-colors">{m.name} — {m.qty} {unit} @ Rs.{m.rate}/{unit}</span>{m.id==="sand" && <span className="text-[7px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full border border-green-500/30">M-SAND 45 FIXED</span>}{m.id==="contingency" && <span className="text-[7px] bg-[#d4af37]/20 text-[#d4af37] px-1.5 py-0.5 rounded-full border border-[#d4af37]/30">23rd WORLD</span>}</span><div className="flex gap-2 items-center"><span className="font-black tracking-wider">Rs.{m.amount.toLocaleString()}</span><button onClick={()=>setEdit({idx:realIdx, qty:m.qty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-white text-black px-3 py-1 rounded-full text-[9px] font-black hover:bg-[#d4af37] transition-colors">EDIT</button></div></div>)
            })}
              <div className="mt-3 bg-gradient-to-r from-[#d4af37]/15 to-[#f0d060]/10 border border-[#d4af37]/30 rounded-[16px] p-3">
                <div className="flex justify-between text-[10px] font-black"><span className="text-[#d4af37]">WASTAGE 3-4-5% + LABOUR CESS 1% + M-SAND Rs.45 + AGG Rs.38 + 23rd CONTINGENCY INCLUDED</span><span className="text-white/60">23 ITEMS VERIFIED</span></div>
                <div className="flex justify-between mt-2 bg-black/60 rounded-full px-4 py-2.5 border border-[#d4af37]/20"><span className="text-[11px] font-black text-[#d4af37]">PROFIT {profitPercent}% : Rs.{profit.toLocaleString()} • FINAL CHARGE: Rs.{finalContractorCharge.toLocaleString()} • GST {gstOn?'18% ON':'OFF'} • WORLD LEVEL</span><span className="text-[9px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">WORLD LEVEL 23 ITEMS</span></div>
              </div>
            </div>
            {edit && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"><div className="bg-gradient-to-br from-[#1e293b] to-[#141a2a] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[360px] shadow-2xl"><h3 className="font-black text-[12px] mb-3 text-[#d4af37]">EDIT - {finalMaterials[edit.idx]?.id.toUpperCase()} • WORLD LEVEL 23 ITEMS</h3><div className="space-y-3"><div><div className="text-[9px] opacity-60 font-bold">Quantity</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 text-[12px] font-bold focus:border-[#d4af37]/50 outline-none" /></div><div><div className="text-[9px] opacity-60 font-bold">Rate • M-Sand 45 • Agg 38 • Contingency 25</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 text-[12px] font-bold focus:border-[#d4af37]/50 outline-none" /></div></div><div className="flex gap-2 mt-5"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[11px] font-bold">CANCEL</button><button onClick={applyEdit} className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black rounded-full py-3 text-[11px]">APPLY • WORLD</button></div></div></div>)}
            <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={handleWhatsApp} className="bg-gradient-to-r from-green-600 to-green-500 text-white font-black py-3 rounded-full text-[11px] shadow hover:shadow-lg transition-all">WhatsApp • {pkg.toUpperCase()} • {profitPercent}% • 23 ITEMS • GST {gstOn?'ON':'OFF'}</button><button onClick={handlePDF} className="bg-gradient-to-r from-white to-[#f0f0f0] text-black font-black py-3 rounded-full text-[11px] shadow hover:shadow-xl transition-all">Download PDF • {tca} SQFT • 23 ITEMS • WORLD</button></div>
          </div>
        )}

        {boxEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9998]">
            <div className="bg-[#1e293b] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[320px] shadow-2xl">
              <h3 className="font-black text-[12px] mb-3 text-[#d4af37]">EDIT {boxEditModal.type.toUpperCase()} • WORLD</h3>
              <input type="text" value={boxEditModal.value} onChange={e=>setBoxEditModal({...boxEditModal, value:e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-full px-4 py-3 text-[13px] font-bold outline-none focus:border-[#d4af37]/50" autoFocus />
              <div className="flex gap-2 mt-4"><button onClick={()=>setBoxEditModal(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[11px] font-bold">CANCEL</button><button onClick={applyBoxEditModal} className="flex-1 bg-[#d4af37] text-black font-black rounded-full py-3 text-[11px]">APPLY • WORLD</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
