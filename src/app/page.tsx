"use client";
// @ts-nocheck
// ABuildWise OS - FINAL 516 LINE - NO WORD CUT - FIXED
// CONTRACT CODES: TWM = Turnkey With Material | CWM = Centring With Material
// LOM = Labour Only Material | CSC = Custom Split Contract
// WORLD THEKA: TWM / CWM / LOM / CSC - 150 COUNTRY - NEW: WITH MATERIAL / WITHOUT MATERIAL / LABOUR ONLY / ITEM-WISE - BIG CITY + VILLAGE BOTH UNDERSTAND
// P1 = Ground Floor Only - PRESERVED 100%
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
const CONTRACTOR_ONLY_IDS = ["ply","batta","jack","mistri","beldar","curing","lift"];
const WORLD_CONTRACT_MODES: any = {
  full: {
    id: "full",
    indiaName: "WITH MATERIAL - TWM - Full Theka - BIG CITY + VILLAGE",
    worldName: "WITH MATERIAL - TURNKEY FULL SERVICE (TWM) - BIG CITY STANDARD",
    ownerLabel: "🏠 WITH MATERIAL - Pura Kaam Thekedar Karega",
    ownerDesc: "Aap sirf paisa denge, Cement se Lift tak sab thekedar layega - Delhi Mumbai me TURNKEY bolte hain",
    contractorLabel: "WITH MATERIAL - FULL WITH MATERIAL - TWM",
    ratePerSqft: 0,
    contractorGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","mistri","beldar","curing","lift"],
    ownerGive: []
  },
  centring: {
    id: "centring",
    indiaName: "WITHOUT MATERIAL - CWM - Centring + Labour Theka",
    worldName: "WITHOUT MATERIAL - FORMWORK + LABOUR (CWM) - METRO STANDARD",
    ownerLabel: "🏗️ WITHOUT MATERIAL - Saman Mera, Kaam Thekedar Ka",
    ownerDesc: "Building ka saman aapka, Ply Batta Jack + Mistri Beldar thekedar ka - Bade sahar me WITHOUT MATERIAL bolte hain",
    contractorLabel: "WITHOUT MATERIAL - CENTRING WITH MATERIAL - CWM",
    ratePerSqft: 450,
    contractorGive: ["ply","batta","jack","mistri","beldar","curing"],
    ownerGive: ["cement","steel","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","lift"]
  },
  labour: {
    id: "labour",
    indiaName: "LABOUR ONLY - LOM - Sirf Karigar Theka",
    worldName: "LABOUR ONLY - WORLD LEVEL (LOM) - LABOUR RATE",
    ownerLabel: "👷 LABOUR ONLY - Sirf Karigar Chahiye",
    ownerDesc: "Sab saman aapka, sirf Mistri Beldar thekedar ke - USA UK Dubai me LABOUR ONLY bolte hain",
    contractorLabel: "LABOUR ONLY - LABOUR ONLY - LOM",
    ratePerSqft: 280,
    contractorGive: ["mistri","beldar"],
    ownerGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","curing","lift"]
  },
  custom: {
    id: "custom",
    indiaName: "ITEM-WISE - CSC - Custom - Tick Karo - Alag Alag",
    worldName: "ITEM-WISE - CUSTOM SPLIT (CSC) - A LA CARTE",
    ownerLabel: "⚙️ ITEM-WISE - Custom - Main Chununga Kaun Kya Dega",
    ownerDesc: "Aap tick karo kaun kya dega - Lift kaun dega - Bade sahar me ITEM-WISE / A LA CARTE bolte hain",
    contractorLabel: "ITEM-WISE - CUSTOM - CSC",
    ratePerSqft: 350,
    contractorGive: [],
    ownerGive: []
  }
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
  const worldContractorCost = worldContractorMats.reduce((s:any,m:any)=>s+m.amount,0);
  const worldOwnerCost = worldOwnerMats.reduce((s:any,m:any)=>s+m.amount,0);
  const ownerCharge = worldMode==="full" ? tca * standardRateShow : worldMode==="centring" ? worldOwnerCost + (tca*worldContractorRate) : worldMode==="labour" ? worldOwnerCost + (tca*worldContractorRate) : worldOwnerCost + worldContractorCost + (tca*100);
  const contractorCost = worldMode==="full" ? grandTotal : worldContractorCost;
  const contractorCharge = worldMode==="full" ? ownerCharge : tca * worldContractorRate;
  const profit = worldMode==="full" ? contractorCharge - grandTotal : contractorCharge - worldContractorCost;
  const profitPer = contractorCharge>0? Math.round((profit/contractorCharge)*100):0;

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
    const text = viewMode==="owner" ? `MAKAN MALIK - ${geo.toUpperCase()} Plot ${plotNum} Builtup ${tca} Mode ${worldModeConfig.indiaName} Total Rs.${ownerCharge.toLocaleString()}` : `CONTRACTOR - ${geo.toUpperCase()} Plot ${plotNum} Mode ${worldModeConfig.contractorLabel} Kharcha Rs.${contractorCost.toLocaleString()} Charge Rs.${contractorCharge.toLocaleString()} Profit Rs.${profit.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const handlePDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 0;
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,'F');
    y=0;
    doc.setFillColor(10,15,30);
    doc.rect(0,0,W,20,'F');
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold");
    doc.setFontSize(13);
    doc.text(viewMode==="owner" ? `MAKAN MALIK - ${worldModeConfig.indiaName}` : `CONTRACTOR - ${worldModeConfig.contractorLabel}`, 10, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica","normal");
    doc.setTextColor(0,229,255);
    doc.text(`${geo.toUpperCase()} | ${tca} SQFT | ${viewMode.toUpperCase()} | MODE ${worldMode.toUpperCase()} | Cement Rs.${apiData.cementRate} Steel Rs.${apiData.steelRate}`, 10, 17);
    y=24;
    doc.setFillColor(240,245,255);
    doc.setDrawColor(0,0,0);
    doc.rect(10,y,W-20,32,'FD');
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica","bold");
    doc.setFontSize(9);
    doc.text(`PLOT: ${plotNum} SQFT | COVERAGE: ${Math.round(coverage*100)}% = ${groundPlate} SQFT | TOTAL: ${tca} SQFT - ${getPLabel(storeys)}`, 12, y+6);
    doc.setFontSize(7);
    doc.setFont("helvetica","normal");
    doc.text(`FORMULA: ${plotNum} x ${Math.round(coverage*100)}% = ${groundPlate} x ${storeys} = ${tca} SQFT | MODE: ${worldModeConfig.indiaName}`, 12, y+12);
    doc.setFillColor(viewMode==="owner"?0:255, viewMode==="owner"?229:200, 0);
    doc.rect(10,y+16,W-20,10,'F');
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.text(viewMode==="owner" ? `CUSTOMER TOTAL: Rs.${ownerCharge.toLocaleString('en-IN')} | MODE: ${worldModeConfig.indiaName}` : `CHARGE: Rs.${contractorCharge.toLocaleString('en-IN')} | KHARCHA: Rs.${contractorCost.toLocaleString('en-IN')} | PROFIT: Rs.${profit.toLocaleString('en-IN')} (${profitPer}%)`, 12, y+22.5);
    y+=40;
    doc.setTextColor(0,0,0);
    doc.setFontSize(11);
    doc.text(viewMode==="owner" ? `OWNER MATERIALS - ${worldModeConfig.indiaName}` : `CONTRACTOR - ${worldModeConfig.contractorLabel} + AGREEMENT`,10,y);
    y+=6;
    doc.setFillColor(245,245,255);
    doc.setDrawColor(100,100,100);
    doc.rect(10,y,W-20,18,'FD');
    doc.setFontSize(7.5);
    doc.setFont("helvetica","bold");
    doc.text(`MALIK SCOPE: ${worldModeConfig.ownerGive.join(", ") || (worldMode==="full" ? "KUCH NAHI - SIRF PAISA" : "CUSTOM")} `,12,y+5);
    doc.text(`THEKEDAR SCOPE: ${worldModeConfig.contractorGive.join(", ") || Object.keys(customTick).filter(k=>customTick[k]==="contractor").join(", ")}`,12,y+10);
    doc.setFont("helvetica","normal");
    doc.text(`AGREEMENT: Payment Rs.${worldContractorRate}/SQFT | TCA ${tca} | Lift Owner? ${worldModeConfig.ownerGive.includes("lift") ? "YES" : "CONTRACTOR"}`,12,y+15);
    y+=22;
    doc.setFillColor(0,0,0);
    doc.rect(10,y,W-20,7,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(8);
    doc.text("ITEM - COMPANY - QTY @ RATE",12,y+4.8);
    doc.text("AMOUNT",W-12,y+4.8,{align:'right'});
    y+=9;
    const pdfMats = viewMode==="owner" ? ownerMaterialsForDisplay : finalMaterials;
    pdfMats.forEach((m:any, idx:number)=>{
      const leftFull = `${m.id.toUpperCase()} - ${m.company} - ${m.qty} @ Rs.${m.rate}`;
      doc.setFont("helvetica","bold");
      doc.setFontSize(8.5);
      const leftLines = doc.splitTextToSize(leftFull, 125);
      const lineHeight = 4.5;
      const blockH = Math.max(leftLines.length * lineHeight + 4, 9);
      if(y + blockH > 280){ doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F'); y=10; }
      if(idx % 2 === 0) doc.setFillColor(255,255,255); else doc.setFillColor(235,240,250);
      doc.setDrawColor(150,150,150);
      doc.rect(10,y,W-20,blockH,'FD');
      doc.setTextColor(0,0,0);
      doc.text(leftLines, 12, y+5);
      doc.setFont("helvetica","bold");
      doc.text(`Rs.${m.amount.toLocaleString('en-IN')}`,W-12,y+5,{align:'right'});
      y+=blockH+1;
    });
    y+=4;
    if(y>270){ doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F'); y=15; }
    doc.setFillColor(viewMode==="owner"? 34:255, viewMode==="owner"?211:193, viewMode==="owner"?238:7);
    doc.setDrawColor(0,0,0);
    doc.rect(10,y,W-20,14,'FD');
    doc.setTextColor(0,0,0);
    doc.setFontSize(12);
    doc.setFont("helvetica","bold");
    if(viewMode==="owner"){
      doc.text(`MALIK FINAL: Rs.${ownerCharge.toLocaleString('en-IN')} | ${tca} SQFT x Mode ${worldModeConfig.indiaName}`,12,y+8.5);
    } else {
      doc.text(`PROFIT: Rs.${profit.toLocaleString('en-IN')} | CHARGE Rs.${contractorCharge.toLocaleString('en-IN')} - KHARCHA Rs.${contractorCost.toLocaleString('en-IN')} | ${worldModeConfig.contractorLabel}`,12,y+8.5);
    }
    doc.save(`${geo}_${tca}_${viewMode}_${worldMode}_ABuildWise.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-white flex flex-col items-center p-2 pb-32 overflow-y-auto">
      <div className="w-full max-w-[720px]">
        <div className="flex justify-between items-center bg-[#0f141f] border border-cyan-400/20 rounded-full px-4 py-2.5 mb-2">
          <span className="font-bold text-[13px]">ABuildWise OS - WORLD 4 MODE - BIG CITY READY</span>
          <div className="flex bg-black/60 rounded-full p-1 border border-white/10">
            <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="owner"?"bg-white text-black":"text-white/60"}`}>MAKAN MALIK</button>
            <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="contractor"?"bg-cyan-400 text-black":"text-white/60"}`}>CONTRACTOR</button>
          </div>
        </div>
        <div className="flex justify-between items-center bg-[#0f141f] border border-cyan-400/30 rounded-full px-2 py-1.5 mb-2 overflow-x-auto gap-1">
          <span className="text-[8px] font-bold text-cyan-300 whitespace-nowrap ml-2">CONTRACT TYPE:</span>
          <div className="flex bg-black/60 rounded-full p-1 border border-white/10 gap-1">
            <button onClick={()=>setWorldMode("full")} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap ${worldMode==="full"?"bg-cyan-400 text-black":"text-white/60"}`}>WITH MATERIAL</button>
            <button onClick={()=>setWorldMode("centring")} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap ${worldMode==="centring"?"bg-cyan-400 text-black":"text-white/60"}`}>WITHOUT MATERIAL</button>
            <button onClick={()=>setWorldMode("labour")} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap ${worldMode==="labour"?"bg-cyan-400 text-black":"text-white/60"}`}>LABOUR ONLY</button>
            <button onClick={()=>setWorldMode("custom")} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap ${worldMode==="custom"?"bg-cyan-400 text-black":"text-white/60"}`}>ITEM-WISE</button>
          </div>
        </div>
        <div className="flex justify-between items-center bg-black/40 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-3">
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">BASE Rs.{baseRateDisplay} | EFF Rs.{effectiveRate} • {tca} SQFT • {worldModeConfig.indiaName}</span>
          <span className="text-[9px] font-bold text-white">{viewMode==="owner" ? `MALIK TOTAL: Rs.${ownerCharge.toLocaleString()}` : `PROFIT: Rs.${profit.toLocaleString()} (${profitPer}%)`}</span>
        </div>
        {phase===1 && (
          <div className="bg-[#0f141f]/80 border border-white/10 rounded-[18px] p-4">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-[12px]">{viewMode==="owner" ? "Makan Malik - Turant Lagat" : "Contractor - Kitna Lagega"} • {worldModeConfig.indiaName}</h2><button onClick={getLiveLocation} className="text-[9px] px-3 py-1 rounded-full bg-cyan-400 text-black font-bold">{liveLabel}</button></div>
            <div className="grid grid-cols-1 gap-2 mb-3 bg-black/30 p-2 rounded-[14px] border border-cyan-400/20">
              <div className="text-[9px] font-bold text-cyan-300 tracking-wider">🌍 WORLD LEVEL THEKA - WITH MATERIAL / WITHOUT MATERIAL / LABOUR ONLY / ITEM-WISE - 150 COUNTRY - BADE SAHAR + GAON DONO SAMJHE</div>
              {(Object.keys(WORLD_CONTRACT_MODES) as Array<keyof typeof WORLD_CONTRACT_MODES>).map((k)=>{
                const m = WORLD_CONTRACT_MODES[k];
                const active = worldMode===k;
                return (
                  <button key={k} onClick={()=>setWorldMode(k as any)} className={`text-left p-3 rounded-[12px] border ${active ? "bg-cyan-400 text-black border-cyan-400" : "bg-black/40 border-white/10 text-white/80"}`}>
                    <div className="font-bold text-[11px]">{viewMode==="owner" ? m.ownerLabel : m.contractorLabel} - {m.indiaName}</div>
                    <div className="text-[9px] opacity-70 mt-0.5">{viewMode==="owner" ? m.ownerDesc : `Rate Rs.${m.ratePerSqft || standardRateShow}/sqft • ${m.contractorGive.length} items`} • {m.worldName}</div>
                  </button>
                );
              })}
            </div>
            {worldMode==="custom" && (
              <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-[12px] p-3 max-h-[200px] overflow-y-auto">
                <div className="text-[10px] font-bold text-yellow-300 mb-2">CUSTOM TICK - Kaun Kya Dega - Lift kaun dega? - ITEM-WISE</div>
                {finalMaterials.map((mat:any)=>(
                  <div key={mat.id} className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-[10px]">{mat.id.toUpperCase()}</span>
                    <select value={customTick[mat.id]||"owner"} onChange={e=>setCustomTick({...customTick, [mat.id]: e.target.value as any})} className="bg-black/60 border border-white/10 rounded-full px-2 py-1 text-[9px]">
                      <option value="owner">Malik Dega</option>
                      <option value="contractor">Thekedar Dega</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="relative z-[100]">
              <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-4 py-3 text-[12px] outline-none" placeholder="City search" />
              {show && (<div className="absolute left-0 right-0 top-full mt-2 bg-[#1e293b] border border-cyan-400/40 rounded-xl z-[9999] max-h-[200px] overflow-y-auto">{CITIES_DB.filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,15).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-4 py-2 text-[12px] hover:bg-cyan-500/20 cursor-pointer flex justify-between"><span>{c}</span><span className="text-cyan-300">Rs.{getCityRate(c)}/sqft LIVE</span></div>)}</div>)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px]"><option value="ultratech">Ultratech Rs.{apiData.cementRate} LIVE</option><option value="acc">ACC Rs.{Math.round(apiData.cementRate*0.97)} LIVE</option><option value="ambuja">Ambuja Rs.{Math.round(apiData.cementRate*0.95)} LIVE</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px]"><option value="kamdhenu_nxt">Kamdhenu Rs.{apiData.steelRate} LIVE</option><option value="tata_tiscon">Tata Rs.{Math.round(apiData.steelRate*1.16)} LIVE</option></select>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[{id:"basic", label:"BASIC", rate: basicRateShow, desc:"-18% • Low"}, {id:"standard", label:"STANDARD LIVE", rate: standardRateShow, desc:"MARKET"}, {id:"premium", label:"PREMIUM", rate: premiumRateShow, desc:"+38% • High"}].map(p=>(
                <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[12px] border p-2 text-left ${pkg===p.id?"bg-cyan-400 text-black border-cyan-400 font-bold":"bg-black/40 border-white/10"}`}><div className="text-[10px]">{p.label}</div><div className="text-[13px]">Rs.{p.rate}</div><div className="text-[8px] opacity-60">{p.desc}</div></button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"basic", value:String(basicRateShow)})} className="bg-white/10 border border-cyan-400/30 rounded-full py-1.5 text-[9px] font-bold">BASIC EDIT Rs.{basicRateShow}</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"standard", value:String(standardRateShow)})} className="bg-cyan-400/20 border border-cyan-400/50 rounded-full py-1.5 text-[9px] font-bold text-cyan-300">STANDARD EDIT Rs.{standardRateShow}</button>
              <button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"premium", value:String(premiumRateShow)})} className="bg-white/10 border border-cyan-400/30 rounded-full py-1.5 text-[9px] font-bold">PREMIUM EDIT Rs.{premiumRateShow}</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3 text-[12px]" /><div className="text-[8px] text-cyan-300 mt-1 ml-3">Coverage LIVE: {Math.round(coverage*100)}% • {groundPlate} Ground</div></div>
              <div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3 text-[12px] font-bold">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="mt-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/50 rounded-[16px] p-3">
              <div className="flex justify-between items-center mb-2"><h3 className="font-black text-[11px] tracking-wider text-cyan-300">{viewMode==="owner" ? "🏠 MALIK - TURANT LAGAT" : "🏗️ CONTRACTOR - PURA KHARCHA"} • {worldModeConfig.indiaName}</h3><span className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold">LIVE AUTO {worldMode.toUpperCase()} - BIG CITY READY</span></div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>PLOT AREA</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"plot", value:plotArea})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[13px]">{plotNum} SQFT</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-cyan-400/30"><div className="text-[8px] opacity-60 flex justify-between"><span>COVERAGE LIVE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"coverage", value:String(Math.round(coverage*100))})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[13px] text-cyan-300">{Math.round(coverage*100)}% • {groundPlate} SQFT</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>GROUND PLATE</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"ground", value:String(groundPlate)})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[12px]">{groundPlate} SQFT</div><div className="text-[7px] opacity-50">{plotNum} x {Math.round(coverage*100)}% = {groundPlate}</div></div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/10"><div className="text-[8px] opacity-60 flex justify-between"><span>{getPLabel(storeys)}</span><button type="button" data-new-edit2="1" onClick={()=>setBoxEditModal({type:"floor", value:storeys})} className="text-cyan-400 font-bold ml-1">EDIT2</button></div><div className="font-bold text-[12px]">{storeys==="1" ? "Ground Floor Only" : `P${storeys} = ${parseInt(storeys)-1} Floor Up`}</div><div className="text-[7px] opacity-50">{storeys==="1" ? `${groundPlate} SQFT Total` : `${groundPlate} x ${storeys} = ${tca}`}</div></div>
              </div>
              <div className="mt-2 bg-black/60 rounded-full px-3 py-2 border border-cyan-400/20 flex justify-between items-center"><span className="text-[9px] opacity-70">BUILT-UP FORMULA</span><span className="text-[10px] font-bold text-cyan-300">{plotNum} x {Math.round(coverage*100)}% = {groundPlate} x {storeys} = {tca} SQFT</span></div>
              <div className="mt-2 flex gap-2"><div className="flex-1 bg-cyan-400 text-black rounded-full py-1.5 text-center font-black text-[11px]">{viewMode==="owner" ? `MALIK TOTAL: Rs.${ownerCharge.toLocaleString()} (${worldModeConfig.indiaName})` : `TOTAL BUILT-UP: ${tca} SQFT - PROFIT Rs.${profit.toLocaleString()} - ${worldModeConfig.contractorLabel}`}</div><div className="bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-[9px]">📍 {geo.toUpperCase()} LIVE</div></div>
            </div>
            <button onClick={()=>setPhase(2)} className="w-full mt-4 mb-6 bg-white text-black font-bold py-3.5 rounded-full text-[12px] shadow-[0_0_20px_rgba(34,211,238,0.5)]">{viewMode==="owner" ? `DEKHE LAGAT — Rs.${ownerCharge.toLocaleString()} • ${tca} SQFT • ${worldModeConfig.indiaName}` : `DEKHE KHARCHA — Kharcha Rs.${contractorCost.toLocaleString()} Profit Rs.${profit.toLocaleString()} • ${displayMaterials.length} ITEMS • ${worldModeConfig.contractorLabel}`}</button>
            <div className="h-24 w-full"></div>
            {boxEditModal && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]"><div className="bg-[#1e293b] border border-cyan-400/50 rounded-[16px] p-4 w-full max-w-[340px]"><h3 className="font-bold text-[12px] mb-1">EDIT {boxEditModal.type.toUpperCase()} - UNLOCKED</h3><input autoFocus type="number" value={boxEditModal.value} onChange={e=>setBoxEditModal({...boxEditModal, value:e.target.value})} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-4 py-3 text-[14px] font-bold outline-none" /><div className="flex gap-2 mt-4"><button onClick={()=>setBoxEditModal(null)} className="flex-1 bg-white/10 rounded-full py-2.5 text-[11px]">CANCEL</button><button onClick={applyBoxEditModal} className="flex-1 bg-cyan-400 text-black font-bold rounded-full py-2.5 text-[11px]">APPLY UNLOCK</button></div></div></div>)}
          </div>
        )}
        {phase===2 && (
          <div className="bg-[#0f141f]/90 border border-cyan-400/30 rounded-[18px] p-4 mb-24">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-[12px]">{geo} • {viewMode==="owner" ? `MALIK Rs.${ownerCharge.toLocaleString()}` : `CONTRACTOR Profit Rs.${profit.toLocaleString()}`} • {tca} SQFT • {worldModeConfig.indiaName}</h2><button onClick={()=>setPhase(1)} className="text-[10px] px-3 py-1 rounded-full bg-white/10">← BACK</button></div>
            <div className="flex bg-black/60 rounded-full p-1 border border-white/10 mb-3 w-fit">
              <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="owner"?"bg-white text-black":"text-white/60"}`}>MALIK ({ownerMaterialsForDisplay.length})</button>
              <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="contractor"?"bg-cyan-400 text-black":"text-white/60"}`}>CONTRACTOR ({finalMaterials.length})</button>
            </div>
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {(Object.keys(WORLD_CONTRACT_MODES) as any[]).map((k:any)=>(
                <button key={k} onClick={()=>setWorldMode(k)} className={`px-2 py-1 rounded-full text-[8px] font-bold whitespace-nowrap ${worldMode===k ? "bg-cyan-400 text-black" : "bg-white/10"}`}>{WORLD_CONTRACT_MODES[k].indiaName}</button>
              ))}
            </div>
            <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl p-2 mb-2 text-[9px]">
              <div className="font-bold text-cyan-300">AGREEMENT - {worldModeConfig.indiaName} / {worldModeConfig.worldName}</div>
              <div className="text-[8px] opacity-70 mt-1">MALIK DEGA: {worldModeConfig.ownerGive.join(", ") || "SIRF PAISA (Full me)"} </div>
              <div className="text-[8px] opacity-70">THEKEDAR DEGA: {worldModeConfig.contractorGive.join(", ") || Object.keys(customTick).filter(k=>customTick[k]==="contractor").join(", ")}</div>
            </div>
            <div className="max-h-[45vh] overflow-y-auto">{(viewMode==="owner" ? ownerMaterialsForDisplay : finalMaterials).map((m:any)=>{
              const realIdx = finalMaterials.findIndex((fm:any)=>fm.id===m.id);
              return (<div key={m.id} className="flex justify-between bg-white/5 rounded-full px-3 py-2 text-[11px] mb-1"><span className="w-[60%] truncate">{m.name} — {m.qty} @ Rs.{m.rate} {CONTRACTOR_ONLY_IDS.includes(m.id) ? "(Cont. Side)" : ""}</span><div className="flex gap-2 items-center"><span className="font-bold">Rs.{m.amount.toLocaleString()}</span><button onClick={()=>setEdit({idx:realIdx, qty:m.qty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-cyan-400 text-black px-3 py-1 rounded-full text-[9px] font-bold">EDIT</button></div></div>)
            })}
            {viewMode==="owner" && worldMode==="full" && (<div className="text-center py-10 text-cyan-300 text-[12px] font-bold">FULL WITH MATERIAL me sab thekedar layega - Malik ko saman list nahi dikhegi - Sirf Final Total Rs.{ownerCharge.toLocaleString()}</div>)}
            </div>
            {edit && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]"><div className="bg-[#1e293b] border border-cyan-400/40 rounded-[16px] p-4 w-full max-w-[360px]"><h3 className="font-bold text-[12px] mb-3">EDIT LIVE - {finalMaterials[edit.idx]?.id.toUpperCase()}</h3><div className="space-y-3"><div><div className="text-[9px] opacity-60">Quantity</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-white/10 rounded-full px-3 py-2 text-[12px]" /></div><div><div className="text-[9px] opacity-60">Company</div><select value={edit.company} onChange={e=>setEdit({...edit, company: e.target.value})} className="w-full bg-black/60 border border-cyan-400/30 rounded-full px-3 py-3 text-[11px] font-bold">{(COMPANY_MASTER[edit.id] || [{name:edit.company, mult:1, label:"LIVE"}]).map((c:any)=>(<option key={c.name} value={c.name}>{c.name} - {c.label}</option>))}</select></div><div><div className="text-[9px] opacity-60">Rate Rs. LIVE</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-3 py-2 text-[12px] font-bold" /></div></div><div className="flex gap-2 mt-4"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 rounded-full py-2.5 text-[11px]">CANCEL</button><button onClick={applyEdit} className="flex-1 bg-cyan-400 text-black font-bold rounded-full py-2.5 text-[11px]">APPLY LOCK</button></div></div></div>)}
            <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={handleWhatsApp} className="bg-green-600 text-white font-bold py-2.5 rounded-full text-[11px]">WhatsApp - {worldModeConfig.indiaName}</button><button onClick={handlePDF} className="bg-white text-black font-bold py-2.5 rounded-full text-[11px]">PDF - {viewMode==="owner"?"MALIK":"CONTRACTOR"} - {worldMode.toUpperCase()}</button></div>
            <div className="mt-2 text-[11px] bg-black/30 p-3 rounded-xl">
              {viewMode==="owner" ? (
                <div className="flex justify-between font-bold text-cyan-300"><span>Makan Malik Final - {worldModeConfig.indiaName}</span><span>Rs.{ownerCharge.toLocaleString()}</span></div>
              ) : (
                <>
                  <div className="flex justify-between font-bold text-white"><span>Tum Charge Karoge ({worldModeConfig.contractorLabel})</span><span>Rs.{contractorCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-yellow-300"><span>Tumhara Kharcha</span><span>Rs.{contractorCost.toLocaleString()}</span></div>
                  <div className="flex justify-between font-black text-cyan-300 text-[13px] mt-1 border-t border-white/10 pt-1"><span>PROFIT {worldMode.toUpperCase()}</span><span>Rs.{profit.toLocaleString()} ({profitPer}%)</span></div>
                </>
              )}
              <div className="text-[8px] opacity-50 mt-1">BASE Rs.{baseRateDisplay} | EFF Rs.{effectiveRate} | Cement Rs.{apiData.cementRate} LIVE | Steel Rs.{apiData.steelRate} LIVE | MODE {worldMode.toUpperCase()} | {worldModeConfig.worldName}</div>
            </div>
            <div className="h-20"></div>
          </div>
        )}
      </div>
    </div>
  );
}
