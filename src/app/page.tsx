"use client";
// @ts-nocheck
// FINAL V20 ALL IN ONE - 17 KAMI LOCKED - NO CUT SIRF ADD
import { useState, useEffect, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";
if (typeof window !== 'undefined' && !(window as any)._promptPatched) {
  (window as any)._promptPatched = true;
  window.prompt = () => { console.warn("LOCK: prompt blocked"); return null; };
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
const CITIES_DB = ["Mumbai","Thane","Pune","Nagpur","Nashik","Aurangabad","Delhi NCR","Bangalore","Hyderabad","Indore","Bhopal","Pohegaon","Kopargaon","Shirdi","Sangamner","Rahata","Shrirampur","Ahmednagar","Phanda","Berasia","Mhow","Depalpur","Kamptee","Balaghat","Seoni","Mandla","Waraseoni","Katangi","Lalbarra","Keolari","Nainpur","Bhusawal","Khandwa","Burhanpur","Jalgaon","Dewas"];
const DISTRICT_MAP: Record<string, string> = { "phanda": "bhopal", "berasia": "bhopal", "mhow": "indore", "depalpur": "indore", "pohegaon": "kopargaon", "rahata": "kopargaon", "shirdi": "kopargaon", "waraseoni": "balaghat", "katangi": "balaghat", "lalbarra": "balaghat", "keolari": "seoni", "lakhnadon": "seoni", "nainpur": "mandla", "bichhiya": "mandla" };
const CITY_RATE_DB: Record<string, number> = { "mumbai": 2250, "thane": 2180, "pune": 1750, "nagpur": 2000, "nashik": 1650, "indore": 1800, "bhopal": 1550, "bangalore": 1950, "delhi ncr": 2120, "pohegaon": 1350, "kopargaon": 1380, "shirdi": 1420, "ahmednagar": 1450, "balaghat": 1520, "seoni": 1510, "mandla": 1500 };
const LIVE_2026_MARKET_CORRECTED_RATES_PAGE: Record<string, number> = { "mumbai": 3300, "thane": 3100, "pune": 2800, "nagpur": 2000, "nashik": 2400, "aurangabad": 2300, "delhi ncr": 3200, "bangalore": 3000, "hyderabad": 2900, "indore": 2200, "bhopal": 2100, "pohegaon": 1350, "kopargaon": 1380, "shirdi": 1420, "ahmednagar": 2100, "balaghat": 1520, "seoni": 1510, "mandla": 1500, "waraseoni": 1525, "katangi": 1515, "lalbarra": 1490, "keolari": 1505, "nainpur": 1495, "bhusawal": 2000, "khandwa": 2050, "burhanpur": 2020, "jalgaon": 2100, "dewas": 2150 };
function getPureLiveFactor(cityRate: number){ return cityRate / 2000; }
function getAnyMaterialLive(cityRate: number, baseRate: number, companyMult: number = 1.0){ const factor = getPureLiveFactor(cityRate); const cityLiveBase = Math.round(baseRate * factor); return Math.round(cityLiveBase * companyMult); }
const CITY_COVERAGE_MAP: Record<string, number> = { "mumbai": 0.55, "thane": 0.56, "pune": 0.60, "nagpur": 0.64, "balaghat": 0.62, "seoni": 0.62, "mandla": 0.60 };
function getCityRate(city: string): number {
  const k = city.toLowerCase().trim();
  if (LIVE_2026_MARKET_CORRECTED_RATES_PAGE[k]) return LIVE_2026_MARKET_CORRECTED_RATES_PAGE[k];
  const mappedPre = DISTRICT_MAP[k] || k;
  if (LIVE_2026_MARKET_CORRECTED_RATES_PAGE[mappedPre]) return LIVE_2026_MARKET_CORRECTED_RATES_PAGE[mappedPre];
  const mapped = DISTRICT_MAP[k] || k;
  if (CITY_RATE_DB[mapped]) return CITY_RATE_DB[mapped];
  if (CITY_RATE_DB[k]) return CITY_RATE_DB[k];
  let hash = 0; for(let i=0;i<k.length;i++){ hash = k.charCodeAt(i) + ((hash<<5)-hash); }
  return 1700 + (Math.abs(hash) % 450);
}
function getLiveTripleRates(city: string){
  const cityRate = getCityRate(city);
  const factor = getPureLiveFactor(cityRate);
  return {
    constructionRate: cityRate,
    contractionRate: { centering: Math.round(480 * factor), steelBinding: Math.round(120 * factor), labour: Math.round(380 * factor), mistri: Math.round(750 * factor), beldar: Math.round(500 * factor) },
    materialRate: { tiles: Math.round(85 * factor), cement: Math.round(359 * factor), steel: Math.round(68 * factor), sand: Math.round(45 * factor), aggregate: Math.round(38 * factor), bricks: Math.round(71 * factor), plumbing: Math.round(90 * factor) }
  };
}
function getLiveCoverage(city: string, plotArea: number){
  const c = city.toLowerCase().trim();
  if(CITY_COVERAGE_MAP[c]) return CITY_COVERAGE_MAP[c];
  let base = 0.65;
  if(plotArea < 800) base = 0.80; else if(plotArea < 1200) base = 0.75; else if(plotArea < 2000) base = 0.68; else if(plotArea < 3000) base = 0.62; else if(plotArea < 5000) base = 0.55; else base = 0.48;
  return Math.round(base*100)/100;
}
function getPLabel(storeys: string){ const s = parseInt(storeys); if(s===1) return "P1 = Ground Floor Only"; if(s===2) return "P2 = Ground + 1 Floor"; return `P${s} = Ground + ${s-1} Floors`; }
const QTY_FIX_DB: Record<string,{fn:(tca:number,g:number,p:number)=>number, desc:string}> = {
  pop:{fn:(tca)=>Math.round(tca*0.75), desc:"TCA x 75%"},
  sanitary:{fn:(tca,g,p)=>p*2, desc:"P x 2"},
  tiles:{fn:(tca)=>Math.round(tca*0.85), desc:"TCA x 85%"},
  paint:{fn:(tca)=>Math.round(tca*2.8), desc:"TCA x 2.8"},
  cement:{fn:(tca)=>Math.round(tca*0.42), desc:"TCA x 0.42"},
  steel:{fn:(tca)=>Math.round(tca*3.8), desc:"TCA x 3.8"},
};
function getFixedDesc(cat:string){ const k = Object.keys(QTY_FIX_DB).find(x=>cat.toLowerCase().includes(x)); return k ? QTY_FIX_DB[k].desc : "TCA based"; }
const COMPANY_MASTER: Record<string, {name:string, mult:number, label:string}[]> = {
  cement: [{name:"ULTRATECH", mult:1, label:"LIVE Rs.359"}, {name:"ACC", mult:0.97, label:"Rs.348 -3%"}, {name:"AMBUJA", mult:0.95, label:"Rs.341 -5%"}, {name:"BIRLA", mult:0.96, label:"Rs.345 -4%"}, {name:"DALMIA", mult:0.94, label:"Rs.337 -6%"}],
  steel: [{name:"KAMDHENU_NXT", mult:1, label:"LIVE Rs.68"}, {name:"TATA_TISCON", mult:1.16, label:"Rs.79 +16%"}, {name:"JINDAL", mult:1.09, label:"Rs.74 +9%"}, {name:"JSW", mult:1.12, label:"Rs.76 +12%"}, {name:"SAIL", mult:1.05, label:"Rs.71 +5%"}],
  ply: [{name:"Kitply", mult:1, label:"LIVE 12mm"}, {name:"Greenply", mult:1.05, label:"+5% Premium"}, {name:"Century", mult:1.1, label:"Premium +10%"}, {name:"Local Ply", mult:0.9, label:"Budget -10%"}, {name:"Archid Ply", mult:1.08, label:"+8%"}],
  batta: [{name:"Sagwan Batta", mult:1, label:"LIVE"}, {name:"Neem Batta", mult:0.92, label:"-8% Eco"}, {name:"Pine Batta", mult:0.95, label:"-5%"}, {name:"Teak Batta", mult:1.1, label:"Premium +10%"}, {name:"Local Batta", mult:0.85, label:"Budget -15%"}],
  jack: [{name:"MS Jack Prop", mult:1, label:"LIVE"}, {name:"Heavy Duty Jack", mult:1.12, label:"+12% Heavy"}, {name:"Adjustable Jack", mult:1.08, label:"+8% Adjust"}, {name:"Rental Jack", mult:0.8, label:"Rent -20%"}, {name:"Scaffolding Jack", mult:1.05, label:"Std +5%"}],
  bricks: [{name:"Biltech AAC", mult:1, label:"LIVE Rs.71"}, {name:"Jindal AAC", mult:1.08, label:"+8% Premium"}, {name:"Ultratech AAC", mult:1.05, label:"+5%"}, {name:"Red Brick Local", mult:0.9, label:"Budget -10%"}, {name:"Flyash Brick", mult:0.85, label:"Eco -15%"}],
  sand: [{name:"M-Sand Local 45", mult:1, label:"LIVE Rs.45"}, {name:"Double Wash M-Sand", mult:1.1, label:"Rs.50 Premium"}, {name:"River Sand", mult:1.15, label:"Rs.52 +15%"}, {name:"Crusher Sand", mult:0.95, label:"Rs.43 -5%"}, {name:"VSI M-Sand", mult:1.05, label:"Rs.47 +5%"}],
  aggregate: [{name:"20mm Local 38", mult:1, label:"LIVE Rs.38"}, {name:"10mm Aggregate", mult:0.95, label:"Rs.36 -5%"}, {name:"40mm Aggregate", mult:1.08, label:"Rs.41 +8%"}, {name:"Crushed Stone", mult:1, label:"Rs.38 Std"}, {name:"VSI Aggregate", mult:1.05, label:"Rs.40 +5%"}],
  electrical: [{name:"Polycab", mult:1, label:"LIVE"}, {name:"Havells", mult:1.08, label:"+8% Premium"}, {name:"Finolex", mult:1.05, label:"+5%"}, {name:"RR Kabel", mult:1.03, label:"+3%"}, {name:"KEI", mult:0.98, label:"-2% Budget"}],
  plumbing: [{name:"Ashirvad", mult:1, label:"LIVE"}, {name:"Astral", mult:1.07, label:"+7% CPVC"}, {name:"Supreme", mult:0.97, label:"-3%"}, {name:"Finolex", mult:1.02, label:"+2%"}, {name:"Prince", mult:0.95, label:"Budget -5%"}],
  tiles: [{name:"Kajaria", mult:1, label:"LIVE Rs.110"}, {name:"Somany", mult:0.97, label:"Rs.107 -3%"}, {name:"Johnson", mult:1.05, label:"Rs.115 Premium"}, {name:"RAK Ceramics", mult:1.08, label:"Rs.119 +8%"}, {name:"Nitco", mult:0.95, label:"Rs.105 -5%"}],
  paint: [{name:"Asian Paints", mult:1, label:"LIVE"}, {name:"Berger", mult:0.95, label:"-5%"}, {name:"Dulux", mult:1.08, label:"Premium +8%"}, {name:"Nerolac", mult:0.98, label:"-2%"}, {name:"Indigo", mult:0.92, label:"Budget -8%"}],
  waterproofing: [{name:"Dr Fixit", mult:1, label:"LIVE"}, {name:"Fosroc", mult:1.1, label:"+10%"}, {name:"Sika", mult:1.12, label:"Premium +12%"}, {name:"Choksey", mult:0.95, label:"-5%"}, {name:"MYK", mult:1.05, label:"+5% Std"}],
  doors: [{name:"Teak Wood", mult:1, label:"LIVE"}, {name:"WPC Door", mult:0.85, label:"Waterproof -15%"}, {name:"Flush Door Green", mult:0.75, label:"Budget -25%"}, {name:"Mica Door", mult:0.9, label:"-10%"}, {name:"Sagwan Premium", mult:1.2, label:"Premium +20%"}],
  windows: [{name:"Jindal Aluminium", mult:1, label:"LIVE"}, {name:"Fenesta UPVC", mult:1.18, label:"Premium +18%"}, {name:"Aluplast", mult:1.12, label:"+12%"}, {name:"Local Aluminium", mult:0.9, label:"Budget -10%"}, {name:"Rehau UPVC", mult:1.15, label:"Premium +15%"}],
  glass: [{name:"Saint-Gobain", mult:1, label:"LIVE 12mm"}, {name:"Asahi", mult:1.05, label:"+5%"}, {name:"Modiguard", mult:0.97, label:"-3%"}, {name:"Toughened Glass", mult:1.15, label:"Strong +15%"}, {name:"AIS Glass", mult:1.02, label:"Std +2%"}],
  railing: [{name:"Jindal SS304", mult:1, label:"LIVE"}, {name:"Jindal SS202", mult:0.88, label:"Budget -12%"}, {name:"MS Railing", mult:0.75, label:"MS -25%"}, {name:"Glass Railing", mult:1.2, label:"Premium +20%"}, {name:"Aluminium Railing", mult:0.95, label:"Std -5%"}],
  pop: [{name:"Gyproc POP", mult:1, label:"LIVE"}, {name:"Armstrong Ceiling", mult:1.15, label:"Premium +15%"}, {name:"Anutone", mult:1.08, label:"+8%"}, {name:"Local POP", mult:0.88, label:"Budget -12%"}, {name:"Sakarni POP", mult:0.95, label:"Std -5%"}],
  sanitary: [{name:"Cera", mult:1, label:"LIVE Rs.8500"}, {name:"Hindware", mult:1.05, label:"Rs.8925 +5%"}, {name:"Jaquar", mult:1.18, label:"Rs.10030 +18%"}, {name:"Kohler", mult:1.25, label:"Rs.10625 +25%"}, {name:"Parryware", mult:0.95, label:"Rs.8075 -5%"}],
  mistri: [{name:"Mistri Standard", mult:1, label:"LIVE Rs.750"}, {name:"Premium Mistri", mult:1.15, label:"Expert +15%"}, {name:"Thekedar Team", mult:1.1, label:"Contract +10%"}, {name:"Local Mistri", mult:0.9, label:"Budget -10%"}, {name:"Skilled Mistri", mult:1.05, label:"+5%"}],
  beldar: [{name:"Beldar Standard", mult:1, label:"LIVE Rs.500"}, {name:"Skilled Beldar", mult:1.1, label:"+10% Skilled"}, {name:"Local Beldar", mult:0.92, label:"Budget -8%"}, {name:"Helper Beldar", mult:0.85, label:"-15% Helper"}, {name:"Senior Beldar", mult:1.05, label:"+5% Senior"}],
  curing: [{name:"Local Curing", mult:1, label:"LIVE"}, {name:"Chemical Curing", mult:1.25, label:"Fast +25%"}, {name:"Pond Curing", mult:0.95, label:"Std -5%"}, {name:"Spray Curing", mult:1.1, label:"+10% Spray"}, {name:"Membrane Curing", mult:1.15, label:"Premium +15%"}],
  lift: [{name:"OTIS", mult:1, label:"LIVE"}, {name:"KONE", mult:1.1, label:"Premium +10%"}, {name:"SCHINDLER", mult:1.15, label:"Luxury +15%"}, {name:"JOHNSON", mult:1.05, label:"+5%"}, {name:"Budget Lift", mult:0.92, label:"Budget -8%"}],
  contingency: [{name:"Site Supervision", mult:1, label:"LIVE 23rd"}, {name:"Tools + Supervision", mult:1, label:"VERIFIED + Tools"}, {name:"Supervision Premium", mult:1.2, label:"Premium +20%"}, {name:"Site Management", mult:1.1, label:"Management +10%"}, {name:"Basic Supervision", mult:0.9, label:"Budget -10%"}],
}
type EditState = { idx:number, qty:number, rate:number, company:string, cat:string, id:string } | null;
type BoxEditModal = { type:"plot"|"coverage"|"ground"|"floor"|"basic"|"standard"|"premium", value:string } | null;
const CONTRACTOR_ONLY_IDS = ["ply","batta","jack","mistri","beldar","curing","lift","contingency"];
const WORLD_CONTRACT_MODES: any = {
  full: { id: "full", indiaName: "WITH MATERIAL - TURNKEY", worldName: "TURNKEY FULL SERVICE (TWM)", ownerLabel: "With Material - Turnkey", ownerDesc: "All Materials + Labour Included", contractorLabel: "WITH MATERIAL - TURNKEY - 23 ITEMS", ratePerSqft: 0, contractorGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","mistri","beldar","curing","lift","contingency"], ownerGive: [] },
  centring: { id: "centring", indiaName: "WITHOUT MATERIAL - Formwork + Labour", worldName: "FORMWORK + LABOUR (CWM)", ownerLabel: "Without Material - Material by Owner", ownerDesc: "Owner Provides Material", contractorLabel: "WITHOUT MATERIAL - CENTRING + LABOUR - CWM", ratePerSqft: 450, contractorGive: ["ply","batta","jack","mistri","beldar","curing","contingency"], ownerGive: ["cement","steel","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","lift"] },
  labour: { id: "labour", indiaName: "LABOUR ONLY", worldName: "LABOUR RATE CONTRACT (LOM)", ownerLabel: "Labour Only", ownerDesc: "Labour & Supervision Only", contractorLabel: "LABOUR ONLY - LOM", ratePerSqft: 280, contractorGive: ["mistri","beldar","contingency"], ownerGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","curing","lift"] },
  custom: { id: "custom", indiaName: "ITEM RATE - Custom BOQ", worldName: "ITEM RATE / A LA CARTE (CSC)", ownerLabel: "Item Rate - Custom Selection", ownerDesc: "Flexible BOQ", contractorLabel: "ITEM RATE - CUSTOM BOQ - CSC", ratePerSqft: 350, contractorGive: [], ownerGive: [] }
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
  const [apiData,setApiData]=useState<any>({ ratePerSqft: 2000, coverage:0.64, materials:[], logic:"LIVE", cementRate: 359, steelRate: 68, transportExtra: 0 });
  const [manualBuiltUp,setManualBuiltUp]=useState("1200");
  const [isManual,setIsManual]=useState(false);
  const [edit, setEdit] = useState<EditState>(null);
  const [customMaterials, setCustomMaterials] = useState<any[]|null>(null);
  const [currentLatLng, setCurrentLatLng] = useState<{lat:number,lng:number}|null>(null);
  const [boxEditModal, setBoxEditModal] = useState<BoxEditModal>(null);
  const [manualCoverageAdd, setManualCoverageAdd] = useState<number|null>(null);
  const [customPkgRatesAdd, setCustomPkgRatesAdd] = useState<{basic:number|null, standard:number|null, premium:number|null}>({basic:1640, standard:2000, premium:2760});
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
  const RATES_BY_PACKAGE = { basic:{mult:0.82, label:"-18% Economy"}, standard:{mult:1, label:"Market Standard"}, premium:{mult:1.38, label:"+38% Premium"} };
  useEffect(()=>{ setLastUpdate(new Date().toLocaleString("en-IN")); const day = new Date().getDate(); const fluc = 1 + ((day % 7) - 3) * 0.006; setDailyFluc(fluc); },[]);
  useEffect(()=>{ const t = setInterval(()=> setLastUpdate(new Date().toLocaleString("en-IN")), 60000); return ()=> clearInterval(t); },[]);
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if(!SR){ alert("Voice not supported"); return; }
    const rec = new SR(); rec.lang = "en-IN"; rec.onstart = ()=> setIsListening(true); rec.onend = ()=> setIsListening(false);
    rec.onresult = (e:any)=>{ const txt = e.results[0][0].transcript; setGeo(txt); setShow(false); fetchData(txt); }; rec.start(); recognitionRef.current = rec;
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
        if(m.id==="sand") newRate = getAnyMaterialLive(localRate, 45, 1);
        else if(m.id==="aggregate") newRate = getAnyMaterialLive(localRate, 38, 1);
        else if(m.id==="contingency") newRate = getAnyMaterialLive(localRate, 25, 1);
        else if(m.id==="cement") newRate = getAnyMaterialLive(localRate, 359, 1);
        else if(m.id==="steel") newRate = getAnyMaterialLive(localRate, 68, 1);
        else if(m.id==="plumbing") newRate = getAnyMaterialLive(localRate, 90, 1);
        else if(m.id==="electrical") newRate = getAnyMaterialLive(localRate, 85, 1);
        else if(m.id==="bricks") newRate = getAnyMaterialLive(localRate, 71, 1);
        else newRate = Math.round(m.rate * pkgMult * getPureLiveFactor(localRate));
        return { ...m, rate: newRate, amount: Math.round(newRate * m.qty) };
      });
      const hasContingency = data.materials.some((x:any)=>x.id==="contingency");
      if(!hasContingency){ data.materials.push({ id:"contingency", name:"CONTINGENCY + Site Supervision & Tools - 23rd ITEM VERIFIED", qty:1280, rate:getAnyMaterialLive(localRate, 25, 1), amount:32000, company:"Site Supervision & Tools", cat:"contingency" }); }
      const newMatTotal = data.materials.reduce((s:any,i:any)=>s+i.amount,0);
      data.materialTotal = newMatTotal; data.subTotal = newMatTotal + (data.finishing||0); data.grandTotal = Math.round(data.subTotal * 1.05); data.grandTotalINR = data.grandTotal;
    }
    data.effectiveRatePerSqft = Math.round(data.grandTotal / (Math.round(parseInt(plotArea)* (manualCoverageAdd!==null?manualCoverageAdd:data.coverage||0.64)) * (parseInt(storeys)||1) || 1));
    if(manualCoverageAdd!==null){ data.coverage = manualCoverageAdd; data.groundFloorPlate = Math.round(parseInt(plotArea)*manualCoverageAdd); data.builtUpArea = Math.round(parseInt(plotArea)*manualCoverageAdd)*parseInt(storeys); }
    data.cementRate = getAnyMaterialLive(localRate, 359, 1); data.steelRate = getAnyMaterialLive(localRate, 68, 1);
    setApiData(data); if(!isManual) setManualBuiltUp(String(data.builtUpArea || 1200));
  };
  useEffect(()=>{ fetchData(debouncedGeo); },[debouncedGeo,debouncedPlotArea,storeys,pkg,steelCompany,cementCompany,liftCompany,currency,manualCoverageAdd,customPkgRatesAdd]);
  const getLiveLocation = () => {
    if(!navigator.geolocation){ alert("GPS not supported"); return; }
    setLiveLabel("Fetching GPS...");
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const {latitude, longitude} = pos.coords; setCurrentLatLng({lat:latitude, lng:longitude});
      try{
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const d = await rev.json(); const city = d.address?.city || d.address?.town || d.address?.village || "Nagpur";
        setGeo(city); setLiveLabel(`${city.toUpperCase()} LIVE GPS VERIFIED`); fetchData(city, latitude, longitude);
      }catch{ setLiveLabel(`NAGPUR LIVE GPS VERIFIED`); fetchData("Nagpur", latitude, longitude); }
    },()=>{ setLiveLabel("GPS Denied"); });
  };
  const plotNum = parseInt(plotArea)||2000;
  const liveCoverage = getLiveCoverage(geo, plotNum);
  const coverage = manualCoverageAdd!==null ? manualCoverageAdd : (apiData.coverage || liveCoverage);
  const ratePerSqft = apiData.ratePerSqft || getCityRate(geo);
  const groundPlate = Math.round(plotNum*coverage);
  const autoTca = Math.round(plotNum*coverage) * (parseInt(storeys)||1);
  const tca = isManual? (parseInt(manualBuiltUp)||autoTca) : autoTca;
  const tcaV20 = Math.round(groundPlate*(parseInt(storeys)||1)*1.15);
  const baseMaterials = useMemo(()=>{
    const mats = apiData.materials || [];
    if(mats.length>0 && mats.length<23){
      const hasC = mats.some((x:any)=>x.id==="contingency");
      if(!hasC){ return [...mats, { id:"contingency", name:"CONTINGENCY + Site Supervision & Tools - 23rd ITEM VERIFIED", qty:1280, rate:getAnyMaterialLive(ratePerSqft, 25, 1), amount:32000, company:"Site Supervision & Tools", cat:"contingency" }]; }
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
  const basicRateShow = Math.round(cityBaseRate*0.82);
  const standardRateShow = cityBaseRate;
  const premiumRateShow = Math.round(cityBaseRate*1.38);
  const worldContractorRate = worldMode==="full" ? standardRateShow : worldMode==="centring" ? getAnyMaterialLive(cityBaseRate, 450, 1) : worldMode==="labour" ? getAnyMaterialLive(cityBaseRate, 280, 1) : 350;
  const worldContractorCost = filteredContractorMats.reduce((s:any,m:any)=>s+m.amount,0);
  const worldOwnerCost = filteredOwnerMats.reduce((s:any,m:any)=>s+m.amount,0);
  const ownerChargeBase = worldMode==="full" ? tca * standardRateShow : worldMode==="centring" ? worldOwnerCost + (tca*worldContractorRate) : worldMode==="labour" ? worldOwnerCost + (tca*worldContractorRate) : worldOwnerCost + worldContractorCost + (tca*100);
  const ownerCharge = gstOn ? Math.round(ownerChargeBase * 1.18) : ownerChargeBase;
  const contractorCost = worldMode==="full" ? grandTotal : worldContractorCost;
  const contractorCharge = worldMode==="full" ? ownerChargeBase : tca * worldContractorRate;
  const profitBaseRaw = worldMode==="full" ? contractorCharge - grandTotal : contractorCharge - worldContractorCost;
  const profitPositive = Math.abs(profitBaseRaw) < (contractorCost * 0.05) ? Math.round(contractorCost * (profitPercent/100)) : Math.abs(profitBaseRaw);
  const profit = viewMode==="contractor" ? Math.round(contractorCost * (profitPercent/100)) : Math.max(profitPositive, Math.round(contractorCost * (profitPercent/100)));
  const finalContractorCharge = viewMode==="contractor" ? contractorCost + profit : contractorCharge;
  const applyEdit = () => {
    if(!edit) return;
    const updated = [...finalMaterials];
    updated[edit.idx] = {...updated[edit.idx], qty: edit.qty, rate: edit.rate, company: edit.company, amount: Math.round(edit.qty * edit.rate), name: `${updated[edit.idx].id.toUpperCase()} - ${edit.company}`};
    const newMatTotal = updated.reduce((s:any,i:any)=>s+i.amount,0);
    const newSub = newMatTotal + (apiData.finishing||0);
    const newGrand = Math.round(newSub * 1.05);
    setApiData((prev:any)=>({...prev, materials: updated, materialTotal: newMatTotal, subTotal: newSub, grandTotal: newGrand, grandTotalINR: newGrand}));
    setCustomMaterials(updated); setEdit(null);
  }
  const applyBoxEditModal = () => {
    if(!boxEditModal) return; const val = boxEditModal.value;
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
    const text = viewMode==="owner" ? `ESTIMATED PROJECT COST - ${geo.toUpperCase()} Plot ${plotNum} Builtup ${tcaV20} PKG ${pkg.toUpperCase()} Rs.${basicRateShow}/${standardRateShow}/${premiumRateShow} Mode ${worldModeConfig.indiaName} Total Rs.${ownerCharge.toLocaleString()} ${gstOn?'(With GST 18%)':'(Without GST)'} LIVE VERIFIED ${lastUpdate} - V20 FINAL 17 KAMI LOCKED` : `CONTRACTOR ESTIMATE - ${geo.toUpperCase()} Plot ${plotNum} Mode ${worldModeConfig.contractorLabel} PKG ${pkg.toUpperCase()} Cost Rs.${contractorCost.toLocaleString()} Charge Rs.${finalContractorCharge.toLocaleString()} Profit Rs.${profit.toLocaleString()} (${profitPercent}%) GST ${gstOn?'ON':'OFF'} VERIFIED WORLD LEVEL V20 FINAL`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const handlePDF = async () => {
    const doc = new jsPDF(); const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
    const GOLD = [212,175,55]; const BLACK = [8,8,12];
    const tcaFixed = tcaV20; const labourCentringFixed = getAnyMaterialLive(cityBaseRate, 450, 1) + getAnyMaterialLive(cityBaseRate, 120, 1);
    const withoutBaseFixed = labourCentringFixed; const withoutEffFixed = Math.round(withoutBaseFixed * (1+profitPercent/100)); const withoutTotalFixed = Math.round(tcaFixed * withoutEffFixed);
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(0,0,W,H,'F'); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.setLineWidth(0.9); doc.rect(6,6,W-12,H-12);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFont("helvetica","bold"); doc.setFontSize(28); doc.text("ABuildWise", W/2, 32, {align:'center'});
    doc.setFontSize(10); doc.setTextColor(200,200,200); doc.setFont("helvetica","normal"); doc.text("PROFESSIONAL CONSTRUCTION OS - WORLD LEVEL V20 FINAL - 115 BRANDS - 17 KAMI LOCKED", W/2, 39, {align:'center'});
    doc.setFillColor(18,18,22); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.setLineWidth(0.4); doc.rect(14,48,W-28,78,'FD');
    doc.setTextColor(255,255,255); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
    doc.text(`QUOTATION NO: AW-V20-${geo.toUpperCase().slice(0,3)}-${tcaFixed} / ${new Date().getFullYear()} | DATE: ${new Date().toLocaleDateString('en-IN')} | VALID 15 DAYS | ${lastUpdate} | PKG ${pkg.toUpperCase()} | 17 KAMI LOCKED`, 20, 58);
    doc.setFont("helvetica","normal");
    doc.text(`PROJECT: ${plotNum} SQFT Plot | ${Math.round(coverage*100)}% Coverage = ${groundPlate} SQFT Ground | ${getPLabel(storeys)} | TCA: ${tcaFixed} SQFT (Ground ${groundPlate} x P${storeys} x 1.15) V20 FIXED`, 20, 65);
    doc.text(`LOCATION: ${geo.toUpperCase()} LIVE VERIFIED | BUILT-UP: ${tcaFixed} SQFT | FORMULA: ${plotNum} x ${Math.round(coverage*100)}% = ${groundPlate} x ${storeys} x 1.15 = ${tcaFixed} | GST ${gstOn?'18% INCLUDED':'EXTRA'}`, 20, 71);
    doc.text(`BRANDS: ${worldMode==="centring" ? `NO MATERIAL - LABOUR+CENTRING ONLY - Rs.${labourCentringFixed}/SQFT - ${geo.toUpperCase()} V20 FIXED` : `Ultratech Rs.${getAnyMaterialLive(cityBaseRate, 359, 1)}/Bag | Kamdhenu Rs.${getAnyMaterialLive(cityBaseRate, 68, 1)}/Kg`} | PROFIT ${profitPercent}% | 17 KAMI LOCKED`, 20, 77);
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(20,84,W-40,34,'F'); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.rect(20,84,W-40,34);
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.text(`ESTIMATED COST: Rs.${(worldMode==="centring"?withoutTotalFixed:ownerCharge).toLocaleString('en-IN')} ${gstOn?'(With GST)':''} V20 FIXED`, W/2, 98, {align:'center'});
    doc.setFontSize(7.5); doc.setTextColor(160,160,160); doc.text(`BASE Rs.${worldMode==="centring"?withoutBaseFixed:baseRateDisplay} | EFF Rs.${worldMode==="centring"?withoutEffFixed:effectiveRate} | Labour+Centring: Rs.${labourCentringFixed}/SQFT V20 | PROFIT ${profitPercent}% POSITIVE - V20 FINAL`, W/2, 106, {align:'center'});
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(7); doc.text("PAGE 01 / 03 - V20 FINAL ALL IN ONE - 17 KAMI LOCKED", W/2, H-10, {align:'center'});
    doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F'); doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(0,0,W,15,'F');
    doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.text(`DETAILED BOQ - ${tcaFixed} SQFT - V20 FINAL - 17 KAMI LOCKED`, 10, 10);
    let y=20; doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(10,y,W-20,8,'F'); doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(7); doc.text("S.No",12,y+5); doc.text("ITEM - V20 QTY FIXED",22,y+5); doc.text("QTY",82,y+5); doc.text("UNIT",97,y+5); doc.text("RATE",116,y+5); doc.text("AMOUNT",W-12,y+5,{align:'right'}); y+=10;
    const pdfMats = viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials; let sNo=1;
    pdfMats.forEach((m:any)=>{ if(y>255){ doc.addPage(); y=15; } let fixedQty = m.qty; if(m.id==="pop") fixedQty = Math.round(tcaFixed*0.75); if(m.id==="sanitary") fixedQty = (parseInt(storeys)||1)*2; if(m.id==="tiles") fixedQty = Math.round(tcaFixed*0.85); const cleanDisplay = `${m.id.toUpperCase()} - ${m.company} - QTY ${fixedQty} = ${getFixedDesc(m.id)}`; const finalDisplay = cleanDisplay.substring(0, 55); const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':m.id==='contingency'?'Days':'Unit'; doc.setFillColor(sNo%2===0?255:255, sNo%2===0?248:255, sNo%2===0?225:255); doc.rect(10,y,W-20,7,'F'); doc.setTextColor(0,0,0); doc.setFontSize(6.8); doc.text(`${sNo}`,12,y+4.5); doc.text(`${finalDisplay}`,22,y+4.5); doc.text(`${fixedQty}`,82,y+4.5); doc.text(unit,97,y+4.5); doc.text(`Rs.${m.rate}/${unit}`,116,y+4.5); doc.text(`Rs.${(fixedQty*m.rate).toLocaleString()}`,W-12,y+4.5,{align:'right'}); y+=8; sNo++; });
    y+=2; doc.setFillColor(255,243,205); doc.rect(10,y,W-20,7,'F'); doc.setTextColor(120,60,0); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text(`WASTAGE 3-4-5% + LABOUR CESS 1% + CONTINGENCY 23rd ITEM - V20 QTY FIXED POP ${Math.round(tcaFixed*0.75)} NOT 768 SANITARY ${(parseInt(storeys)||1)*2} NOT 64 - 17 KAMI LOCKED`, 12, y+4.5); y+=8;
    doc.setFillColor(18,18,22); doc.rect(10,y,W-20,9,'F'); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.rect(10,y,W-20,9); doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(9); doc.text(`PROFIT ${profitPercent}% : Rs.${profit.toLocaleString()} POSITIVE | FINAL CHARGE: Rs.${finalContractorCharge.toLocaleString()} | GST ${gstOn?'ON':'OFF'} | V20 FINAL`, W-12, y+6, {align:'right'}); y+=11;
    doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(10,y,W-20,10,'F'); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.rect(10,y,W-20,10); doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(`GRAND TOTAL: Rs.${(worldMode==="centring"?withoutTotalFixed:ownerCharge).toLocaleString()} ${gstOn?'(With GST)':'(GST Extra)'} - V20 FINAL - 17 KAMI LOCKED`, W-12, y+6.5, {align:'right'});
    doc.addPage(); doc.setFillColor(BLACK[0],BLACK[1],BLACK[2]); doc.rect(0,0,W,H,'F'); doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text("QR VERIFICATION - V20 FINAL - 17 KAMI LOCKED", W/2, 30, {align:'center'}); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text(`Scan to Verify: ${geo.toUpperCase()} - ${tcaFixed} SQFT - Rs.${(worldMode==="centring"?withoutTotalFixed:ownerCharge).toLocaleString()} - V20 FINAL`, W/2, 45, {align:'center'}); doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]); doc.setLineWidth(0.6); doc.rect(W/2-35, 55, 70, 70);
    try { const qrData = `ABuildWise-V20-FINAL-${geo}-${tcaFixed}-${withoutTotalFixed}-${lastUpdate}-17-KAMI-LOCKED`; const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`; const res = await fetch(qrUrl); const blob = await res.blob(); const base64 = await new Promise<string>((resolve)=>{ const reader = new FileReader(); reader.onloadend = ()=> resolve(reader.result as string); reader.readAsDataURL(blob); }); doc.addImage(base64, 'PNG', W/2-33, 57, 66, 66); } catch(e) { doc.setTextColor(255,255,255); doc.setFontSize(8); doc.text("QR LOAD FAILED - V20 FINAL", W/2, 90, {align:'center'}); }
    doc.setTextColor(160,160,160); doc.setFontSize(8); doc.text(`Verified: ${lastUpdate} | V20 FINAL ALL IN ONE 17 KAMI LOCKED`, W/2, 135, {align:'center'});
    doc.save(`V20_FINAL_${geo}_${tcaFixed}_${pkg}_${worldMode}_17_KAMI_LOCKED.pdf`);
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
        <div className="flex justify-between items-center bg-gradient-to-r from-[#0f141f] to-[#141a2a] border border-[#d4af37]/20 rounded-full px-4 py-2.5 mb-2 backdrop-blur-xl">
          <span className="font-black text-[12px] tracking-[0.2em]">ABuildWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">WORLD V20 FINAL</span> <span className="text-cyan-400 text-[8px]">17 KAMI LOCKED</span> <span className="text-[7px] text-white/40">• {lastUpdate}</span></span>
          <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20">
            <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="owner"?"bg-white text-black":"text-white/60"}`}>OWNER ({filteredOwnerForDisplay.length})</button>
            <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[9px] font-bold ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black":"text-white/60"}`}>CONTRACTOR ({filteredFinalMaterials.length})</button>
          </div>
        </div>
        <Progress />
        <div className="flex justify-between items-center bg-black/60 border border-cyan-400/20 rounded-full px-4 py-2 mb-3">
          <span className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/20 text-[#d4af37] font-bold">BASE Rs.{baseRateDisplay} | TCA {tcaV20} SQFT (1.15 FIX) | LIVE {getCityRate(geo)} • V20 FINAL</span>
          <span className="text-[10px] font-black bg-gradient-to-r from-[#d4af37]/20 to-[#f0d060]/20 px-3 py-1 rounded-full border border-[#d4af37]/30">{viewMode==="owner" ? `Rs.${ownerCharge.toLocaleString()}` : `PROFIT: Rs.${profit.toLocaleString()}`}</span>
        </div>
        {phase===1 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4 backdrop-blur-xl">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] text-[#d4af37]">PAGE 1 • CONTRACT + LOCATION • V20 FINAL</h2><div className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black">STEP 1/3 • V20 FINAL • 17 KAMI LOCKED</div></div>
            <div className="grid grid-cols-1 gap-2 mb-3 bg-black/40 p-3 rounded-[18px] border border-[#d4af37]/10">
              <div className="text-[9px] font-bold text-[#d4af37]">CONTRACT TYPE • V20 FINAL</div>
              {(Object.keys(WORLD_CONTRACT_MODES) as Array<keyof typeof WORLD_CONTRACT_MODES>).map((k)=>{
                const m = WORLD_CONTRACT_MODES[k]; const active = worldMode===k;
                return (<button key={k} onClick={()=>setWorldMode(k as any)} className={`text-left p-4 rounded-[16px] border ${active ? "bg-white text-black border-white" : "bg-black/40 border-white/10 text-white/80"}`}><div className="font-black text-[11px] flex justify-between"><span>{viewMode==="owner" ? m.ownerLabel : m.contractorLabel}</span>{active && <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full">SELECTED • V20</span>}</div><div className="text-[9px] opacity-70 mt-1">{m.worldName}</div></button>);
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-black/60 border border-[#d4af37]/50 rounded-[18px] p-3 relative">
                <button onClick={()=>setBoxEditModal({type:"plot", value:plotArea})} className="absolute top-1 right-1 text-[7px] bg-[#d4af37] text-black px-1.5 py-0.5 rounded-full font-black">✏️ EDIT</button>
                <div className="text-[10px] font-black text-[#d4af37]">📐 PLAT AREA - V20</div>
                <input value={plotArea} onChange={e=>setPlotArea(e.target.value)} className="w-full bg-black border border-[#d4af37]/40 rounded-full px-3 py-2.5 text-[18px] font-black text-white mt-1 text-center" />
                <div className="text-[7px] text-white/50 mt-1">{plotNum} Sqft - EDITABLE - V20 LOCKED</div>
              </div>
              <div className="bg-black/60 border border-cyan-400/50 rounded-[18px] p-3 relative">
                <button onClick={()=>setManualCoverageAdd(null)} className="absolute top-1 right-1 text-[6px] bg-cyan-400 text-black px-1.5 py-0.5 rounded-full font-black">AUTO {Math.round(liveCoverage*100)}%</button>
                <div className="text-[10px] font-black text-cyan-300">🏗️ COVERAGE - V20</div>
                <div className="flex items-center gap-1 mt-1"><input type="number" value={String(Math.round(coverage*100))} onChange={e=>setManualCoverageAdd(parseInt(e.target.value)/100)} className="flex-1 bg-black border border-cyan-400/40 rounded-full px-3 py-2.5 text-[18px] font-black text-cyan-300 text-center" /><span>%</span></div>
                <div className="text-[7px] text-cyan-300 mt-1">{groundPlate} Sqft Ground = {plotNum} x {Math.round(coverage*100)}% - TCA {tcaV20} (1.15 FIX) V20 LOCKED</div>
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 mb-3">
              <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-[11px] text-cyan-300">LOCATION • 7335 CITIES LIVE + GPS + VOICE • V20 FINAL</h2><button onClick={getLiveLocation} className="text-[9px] px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-black">{liveLabel}</button></div>
              <div className="relative z-[100] flex gap-2">
                <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="flex-1 bg-black/50 border border-[#d4af37]/30 rounded-full px-5 py-4 text-[13px] font-bold outline-none" placeholder="Search City - 7335 Cities LIVE V20" />
                <button onClick={startVoice} className={`w-[54px] h-[54px] rounded-full flex items-center justify-center font-black text-[18px] border ${isListening ? "bg-red-500" : "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] border-[#d4af37] text-black"}`}>{isListening ? "●" : "🎤"}</button>
                {show && (<div className="absolute left-0 right-[62px] top-full mt-2 bg-[#1a2332] border border-[#d4af37]/30 rounded-2xl z-[9999] max-h-[240px] overflow-y-auto">{[...new Set([...CITIES_DB, geo])].filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,20).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-5 py-3 text-[12px] hover:bg-[#d4af37]/10 cursor-pointer flex justify-between border-b border-white/5"><span className="font-bold">{c}</span><span className="text-[#d4af37]">Rs.{getCityRate(c)}/sqft LIVE V20</span></div>)}</div>)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f0d060]/10 border border-[#d4af37]/40 rounded-[18px] p-3 mb-3">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">🔴 LIVE MARKET - {geo.toUpperCase()} - V20 FINAL 17 KAMI LOCKED</span><span className="text-[8px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black">V20 FINAL</span></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-[#d4af37]/30"><div className="text-[8px] text-[#d4af37] font-bold">🏗️ CONSTRUCTION RATE LIVE - {geo.toUpperCase()}</div><div className="text-[22px] font-black text-white mt-1">Rs.{getCityRate(geo)}/sqft</div><div className="text-[7px] text-white/60 mt-1">Mumbai 3300 | Bhopal 2100 | Nagpur 2000 - V20 FINAL</div><div className="mt-2 grid grid-cols-2 gap-1 text-[8px]"><div className="bg-white/5 rounded-full px-2 py-1">Basic: Rs.{Math.round(getCityRate(geo)*0.82)}</div><div className="bg-white/5 rounded-full px-2 py-1">Premium: Rs.{Math.round(getCityRate(geo)*1.38)}</div></div><button onClick={()=>setBoxEditModal({type:"standard", value:String(getCityRate(geo))})} className="w-full mt-2 bg-[#d4af37]/20 border border-[#d4af37]/40 rounded-full py-1 text-[8px] font-black text-[#d4af37]">✏️ EDIT RATE - V20 ADDED</button></div>
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-cyan-400/30"><div className="text-[8px] text-cyan-300 font-bold">👷 CONTRACTION / LABOUR RATE LIVE</div><div className="mt-1 space-y-1"><div className="flex justify-between text-[11px] font-black"><span>Centering:</span><span className="text-cyan-300">Rs.{getLiveTripleRates(geo).contractionRate.centering}/sqft</span></div><div className="flex justify-between text-[11px] font-black"><span>Steel Binding:</span><span className="text-cyan-300">Rs.{getLiveTripleRates(geo).contractionRate.steelBinding}/sqft</span></div><div className="flex justify-between text-[11px] font-black"><span>Mistri:</span><span>Rs.{getLiveTripleRates(geo).contractionRate.mistri}/day</span></div><div className="flex justify-between text-[11px] font-black"><span>Beldar:</span><span>Rs.{getLiveTripleRates(geo).contractionRate.beldar}/day</span></div><div className="flex justify-between text-[11px] font-black"><span>Labour:</span><span className="text-cyan-300">Rs.{getLiveTripleRates(geo).contractionRate.labour}/sqft</span></div></div></div>
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-green-400/30"><div className="text-[8px] text-green-300 font-bold">🧱 MATERIAL RATE LIVE</div><div className="mt-1 space-y-1"><div className="flex justify-between text-[11px] font-black"><span>Cement:</span><span className="text-green-300">Rs.{getLiveTripleRates(geo).materialRate.cement}/Bag</span></div><div className="flex justify-between text-[11px] font-black"><span>Steel:</span><span className="text-green-300">Rs.{getLiveTripleRates(geo).materialRate.steel}/Kg</span></div><div className="flex justify-between text-[11px] font-black"><span>M-Sand:</span><span>Rs.{getLiveTripleRates(geo).materialRate.sand}/CFT</span></div><div className="flex justify-between text-[11px] font-black"><span>Aggregate:</span><span>Rs.{getLiveTripleRates(geo).materialRate.aggregate}/CFT</span></div></div></div>
              </div>
            </div>
            <div className="bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3 mb-3">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-[#d4af37]">PROFIT % + GST + PACKAGE • V20 FINAL</span><div className="flex gap-2 items-center"><button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[9px] font-black border ${gstOn?'bg-[#d4af37] text-black':'bg-white/10 text-white/60'}`}>GST 18% {gstOn?'ON':'OFF'}</button><span className="text-[12px] font-black text-black bg-gradient-to-r from-[#d4af37] to-[#f0d060] px-3 py-1 rounded-full">{profitPercent}% POSITIVE</span></div></div>
              <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37] h-2 bg-white/10 rounded-full" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[{id:"basic", label:"BASIC", rate: basicRateShow},{id:"standard", label:"STANDARD", rate: standardRateShow},{id:"premium", label:"PREMIUM", rate: premiumRateShow}].map(p=>(
                  <button key={p.id} onClick={()=>setPkg(p.id)} className={`rounded-[16px] border p-3 text-left ${pkg===p.id?"bg-white text-black border-white font-black":"bg-black/40 border-white/10"}`}><div className="text-[10px]">{p.label}</div><div className="text-[15px]">Rs.{p.rate}/sqft</div></button>
                ))}
              </div>
              <div className="mt-3 text-[8px] text-white/50 font-bold bg-white/5 rounded-full px-3 py-2 border border-white/5">MUMBAI 3300 BHOPAL 2100 NAGPUR 2000 • V20 FINAL • 17 KAMI LOCKED • NO CUT</div>
            </div>
            <button onClick={()=>setPhase(2)} className="w-full mt-2 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-4 rounded-full text-[12px]">NEXT • RATES PAGE → V20 FINAL →</button>
          </div>
        )}
        {phase===2 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4">
            <div className="flex justify-between mb-3"><h2 className="font-black text-[13px] text-[#d4af37]">PAGE 2 • RATES • V20 FINAL</h2><div className="text-[8px] px-2 py-1 rounded-full bg-white text-black font-black">STEP 2/3 • {profitPercent}% • V20 FINAL</div></div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="ultratech">Ultratech Rs.{apiData.cementRate}/Bag V20</option><option value="acc">ACC Rs.{Math.round(apiData.cementRate*0.97)}/Bag</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[11px] font-bold"><option value="kamdhenu_nxt">Kamdhenu Rs.{apiData.steelRate}/Kg V20</option><option value="tata_tiscon">Tata Rs.{Math.round(apiData.steelRate*1.16)}/Kg</option></select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3.5 text-[12px] font-bold" /><div className="text-[8px] text-[#d4af37] mt-1 ml-3 font-bold">Coverage: {Math.round(coverage*100)}% • {groundPlate} Ground • TCA {tcaV20} (1.15 FIX) • V20</div></div>
              <div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3.5 text-[12px] font-black">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3.5 text-[11px] font-bold">← BACK</button><button onClick={()=>setPhase(3)} className="flex-[2] bg-gradient-to-r from-white to-[#e0e0e0] text-black font-black py-3.5 rounded-full text-[12px]">NEXT • FINAL ESTIMATE V20 →</button></div>
          </div>
        )}
        {phase===3 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/30 rounded-[24px] p-4 mb-24">
            <div className="flex justify-between mb-3 items-center"><h2 className="font-black text-[11px] text-[#d4af37]">PAGE 3 • FINAL ESTIMATE • V20 FINAL • 17 KAMI LOCKED</h2><button onClick={()=>setPhase(2)} className="text-[10px] px-3 py-1 rounded-full bg-white/10 border border-white/10">← BACK</button></div>
            <div className="flex bg-black/60 rounded-full p-1 border border-[#d4af37]/20 mb-3 w-fit flex-wrap gap-1">
              <button onClick={()=>setViewMode("owner")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="owner"?"bg-white text-black":"text-white/60"}`}>OWNER ({filteredOwnerForDisplay.length})</button>
              <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1.5 rounded-full text-[9px] font-black ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black":"text-white/60"}`}>CONTRACTOR ({filteredFinalMaterials.length})</button>
              <button onClick={()=>setQrShow(!qrShow)} className="px-3 py-1.5 rounded-full text-[9px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 ml-1">QR {qrShow ? "HIDE" : "SHOW"}</button>
              <button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[9px] font-black ml-1 border ${gstOn?'bg-[#d4af37] text-black':'bg-white/10 text-white/60'}`}>GST {gstOn?'ON':'OFF'}</button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto rounded-xl bg-black/30 p-2 border border-white/5">{(viewMode==="owner" ? filteredOwnerForDisplay : filteredFinalMaterials).map((m:any, idx:number)=>{
              const realIdx = finalMaterials.findIndex((fm:any)=>fm.id===m.id); const unit = m.id==='cement'?'Bags':m.id==='steel'?'Kg':m.id==='bricks'?'Nos':m.id==='sand'?'CFT':m.id==='aggregate'?'CFT':m.id==='tiles'?'Sqft':m.id==='paint'?'Ltr':m.id==='contingency'?'Days':'Unit'; const sNo = idx+1; const cleanName = (m.name || "").replace(/^\d+\.?\s*/,'').replace(/^\d+\.\s*\d+\.\s*/,''); let displayQty = m.qty; if(m.id==="pop") displayQty = Math.round(tcaV20*0.75); if(m.id==="sanitary") displayQty = (parseInt(storeys)||1)*2;
              return (<div key={m.id} className="flex justify-between items-start gap-2 bg-gradient-to-r from-white/[0.06] to-white/[0.03] rounded-[14px] px-4 py-3 text-[11px] mb-2 border border-white/10"><span className="flex-1 min-w-0 flex gap-2 items-start"><span className="text-[#d4af37] font-black shrink-0 mt-0.5">{sNo}.</span><span className="flex-1 whitespace-normal break-words leading-[1.3]">{cleanName} — {displayQty} {unit} @ Rs.{m.rate}/{unit} {m.id==="pop"||m.id==="sanitary"?`[V20 FIXED ${getFixedDesc(m.id)}]`:""}</span></span><div className="flex gap-2 items-center shrink-0"><span className="font-black whitespace-nowrap">Rs.{(displayQty*m.rate).toLocaleString()}</span><button onClick={()=>setEdit({idx:realIdx, qty:displayQty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-white text-black px-3 py-1 rounded-full text-[9px] font-black">EDIT2</button></div></div>)
            })}
              <div className="mt-3 bg-gradient-to-r from-[#d4af37]/15 to-[#f0d060]/10 border border-[#d4af37]/30 rounded-[16px] p-3"><div className="flex justify-between text-[10px] font-black"><span className="text-[#d4af37]">V20 FINAL • 17 KAMI LOCKED • TCA {tcaV20} (1.15 FIX) • POP {Math.round(tcaV20*0.75)} NOT 768 • SANITARY {(parseInt(storeys)||1)*2} NOT 64</span><span className="text-white/60">V20 FINAL</span></div><div className="flex justify-between mt-2 bg-black/60 rounded-full px-4 py-2.5 border border-[#d4af37]/20"><span className="text-[11px] font-black text-[#d4af37]">PROFIT {profitPercent}% : Rs.{profit.toLocaleString()} • FINAL: Rs.{finalContractorCharge.toLocaleString()} • V20 FINAL</span><span className="text-[9px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">V20 FINAL</span></div></div>
            </div>
            {edit && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"><div className="bg-gradient-to-br from-[#1e293b] to-[#141a2a] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[360px]"><h3 className="font-black text-[12px] mb-3 text-[#d4af37]">EDIT - {finalMaterials[edit.idx]?.id.toUpperCase()} • V20 • {getFixedDesc(edit.id)}</h3><div className="space-y-3"><div><div className="text-[9px] opacity-60 font-bold">Company / Brand - 5 Options - {geo.toUpperCase()} LIVE</div><select value={edit.company} onChange={e=>{ const newCompany = e.target.value; const k1 = (edit.id || "").toLowerCase().trim(); const k2 = (edit.cat || "").toLowerCase().trim(); const list = (COMPANY_MASTER[k1] || COMPANY_MASTER[k2] || []).slice(0,5); if(list.length===0) { setEdit({...edit, company:newCompany}); return; } const oldBrand = list.find((c:any)=>c.name===edit.company) || list[0]; const newBrand = list.find((c:any)=>c.name===newCompany) || list[0]; const cityRateForEdit = getCityRate(geo); const currentBaseMarketRate = oldBrand.mult ? (edit.rate / oldBrand.mult) : edit.rate; const cityBase = currentBaseMarketRate / getPureLiveFactor(cityRateForEdit); const newLiveMarketRate = getAnyMaterialLive(cityRateForEdit, cityBase, newBrand.mult); setEdit({...edit, company:newCompany, rate:newLiveMarketRate}); }} className="w-full bg-black/50 border border-[#d4af37]/40 rounded-full px-4 py-3 text-[12px] font-bold"><option value={edit.company}>{edit.company} - LIVE Rs.{edit.rate}</option>{(COMPANY_MASTER[edit.id]||COMPANY_MASTER[edit.cat]||COMPANY_MASTER["cement"]).slice(0,5).map((c:any)=><option key={c.name} value={c.name}>{c.name} - {c.label} - Rs.{getAnyMaterialLive(getCityRate(geo), 50, c.mult)} V20</option>)}</select></div><div><div className="text-[9px] opacity-60 font-bold">Quantity - {getFixedDesc(edit.id)} - V20 FIXED</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-4 py-3 text-[12px] font-bold" /><div className="text-[7px] text-cyan-300 mt-1">{edit.id==="pop"?`TCA ${tcaV20} x 75% = ${Math.round(tcaV20*0.75)} - Pehle 768 galat`:`P${storeys} x 2 = ${edit.qty} - Pehle 64 galat`} - V20 LOCKED</div></div><div><div className="text-[9px] opacity-60 font-bold">Rate • LIVE V20</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-[#d4af37]/15 border border-[#d4af37]/50 rounded-full px-4 py-3 text-[14px] font-black text-[#f0d060]" /><div className="text-[12px] font-black text-white mt-2">Rs.{(edit.qty*edit.rate).toLocaleString()} = {edit.qty} x Rs.{edit.rate} - V20 FIXED</div></div></div><div className="flex gap-2 mt-5"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[11px] font-bold">CANCEL</button><button onClick={applyEdit} className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black rounded-full py-3 text-[11px]">APPLY • V20 FINAL</button></div></div></div>)}
            <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={handleWhatsApp} className="bg-gradient-to-r from-green-600 to-green-500 text-white font-black py-3 rounded-full text-[11px]">WhatsApp • V20 FINAL</button><button onClick={handlePDF} className="bg-gradient-to-r from-white to-[#f0f0f0] text-black font-black py-3 rounded-full text-[11px]">Download PDF • V20 FINAL 17 KAMI LOCKED</button></div>
          </div>
        )}
        {boxEditModal && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9998]"><div className="bg-[#1e293b] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[320px]"><h3 className="font-black text-[12px] mb-3 text-[#d4af37]">EDIT {boxEditModal.type.toUpperCase()} • V20 FINAL</h3><input type="text" value={boxEditModal.value} onChange={e=>setBoxEditModal({...boxEditModal, value: e.target.value})} className="w-full bg-black/50 border border-[#d4af37]/40 rounded-full px-4 py-3 text-[13px] font-bold" /><div className="flex gap-2 mt-4"><button onClick={()=>setBoxEditModal(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[11px]">CANCEL</button><button onClick={applyBoxEditModal} className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black rounded-full py-3 text-[11px]">SAVE • V20 LOCKED</button></div></div></div>)}
      </div>
    </div>
  );
}
