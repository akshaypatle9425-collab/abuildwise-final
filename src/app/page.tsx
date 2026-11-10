"use client";
// @ts-nocheck
// V29 FINAL - V28 + 4 BAKI WALI FIX - 21/21 PURA - 1 word cut nahi kiya
import { useState, useEffect, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";

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
function getPLabel(storeys: string){ const s = parseInt(storeys); if(s===1) return "G+0 = Ground Floor Only"; if(s===2) return "G+1 = Ground + 1 Floor"; return `G+${s-1} = Ground + ${s-1} Floors`; }
function inr(n:number){ return n.toLocaleString("en-IN"); }
function getUnitForId(id: string){
  if(id==='cement') return 'Bags';
  if(id==='steel') return 'Kg';
  if(id==='bricks') return 'Nos';
  if(id==='sand') return 'CFT';
  if(id==='aggregate') return 'CFT';
  if(id==='tiles') return 'Sqft';
  if(id==='paint') return 'Ltr';
  if(id==='mistri') return 'Days';
  if(id==='beldar') return 'Days';
  if(id==='curing') return 'Days';
  if(id==='contingency') return 'Sqft';
  return 'Unit';
}
const COMPANY_MASTER: Record<string, {name:string, mult:number, label:string}[]> = {
  cement: [{name:"ULTRATECH", mult:1, label:"Rs.359"}, {name:"ACC", mult:0.97, label:"Rs.348 -3%"}, {name:"AMBUJA", mult:0.95, label:"Rs.341 -5%"}, {name:"BIRLA", mult:0.96, label:"Rs.345 -4%"}, {name:"DALMIA", mult:0.94, label:"Rs.337 -6%"}],
  steel: [{name:"KAMDHENU_NXT", mult:1, label:"Rs.68"}, {name:"TATA_TISCON", mult:1.16, label:"Rs.79 +16%"}, {name:"JINDAL", mult:1.09, label:"Rs.74 +9%"}, {name:"JSW", mult:1.12, label:"Rs.76 +12%"}, {name:"SAIL", mult:1.05, label:"Rs.71 +5%"}],
  ply: [{name:"Kitply", mult:1, label:"12mm"}, {name:"Greenply", mult:1.05, label:"+5% Premium"}, {name:"Century", mult:1.1, label:"Premium +10%"}, {name:"Local Ply", mult:0.9, label:"Budget -10%"}, {name:"Archid Ply", mult:1.08, label:"+8%"}],
  batta: [{name:"Sagwan Batta", mult:1, label:"Standard"}, {name:"Neem Batta", mult:0.92, label:"-8% Eco"}, {name:"Pine Batta", mult:0.95, label:"-5%"}, {name:"Teak Batta", mult:1.1, label:"Premium +10%"}, {name:"Local Batta", mult:0.85, label:"Budget -15%"}],
  jack: [{name:"MS Jack Prop", mult:1, label:"Standard"}, {name:"Heavy Duty Jack", mult:1.12, label:"+12% Heavy"}, {name:"Adjustable Jack", mult:1.08, label:"+8% Adjust"}, {name:"Rental Jack", mult:0.8, label:"Rent -20%"}, {name:"Scaffolding Jack", mult:1.05, label:"Std +5%"}],
  bricks: [{name:"Biltech AAC", mult:1, label:"Rs.71"}, {name:"Jindal AAC", mult:1.08, label:"+8% Premium"}, {name:"Ultratech AAC", mult:1.05, label:"+5%"}, {name:"Red Brick Local", mult:0.9, label:"Budget -10%"}, {name:"Flyash Brick", mult:0.85, label:"Eco -15%"}],
  sand: [{name:"M-Sand Local 45", mult:1, label:"Rs.45"}, {name:"Double Wash M-Sand", mult:1.1, label:"Rs.50 Premium"}, {name:"River Sand", mult:1.15, label:"Rs.52 +15%"}, {name:"Crusher Sand", mult:0.95, label:"Rs.43 -5%"}, {name:"VSI M-Sand", mult:1.05, label:"Rs.47 +5%"}],
  aggregate: [{name:"20mm Local 38", mult:1, label:"Rs.38"}, {name:"10mm Aggregate", mult:0.95, label:"Rs.36 -5%"}, {name:"40mm Aggregate", mult:1.08, label:"Rs.41 +8%"}, {name:"Crushed Stone", mult:1, label:"Rs.38 Std"}, {name:"VSI Aggregate", mult:1.05, label:"Rs.40 +5%"}],
  electrical: [{name:"Polycab", mult:1, label:"Standard"}, {name:"Havells", mult:1.08, label:"+8% Premium"}, {name:"Finolex", mult:1.05, label:"+5%"}, {name:"RR Kabel", mult:1.03, label:"+3%"}, {name:"KEI", mult:0.98, label:"-2% Budget"}],
  plumbing: [{name:"Ashirvad", mult:1, label:"Standard"}, {name:"Astral", mult:1.07, label:"+7% CPVC"}, {name:"Supreme", mult:0.97, label:"-3%"}, {name:"Finolex", mult:1.02, label:"+2%"}, {name:"Prince", mult:0.95, label:"Budget -5%"}],
  tiles: [{name:"Kajaria", mult:1, label:"Rs.110"}, {name:"Somany", mult:0.97, label:"Rs.107 -3%"}, {name:"Johnson", mult:1.05, label:"Rs.115 Premium"}, {name:"RAK Ceramics", mult:1.08, label:"Rs.119 +8%"}, {name:"Nitco", mult:0.95, label:"Rs.105 -5%"}],
  paint: [{name:"Asian Paints", mult:1, label:"Standard"}, {name:"Berger", mult:0.95, label:"-5%"}, {name:"Dulux", mult:1.08, label:"Premium +8%"}, {name:"Nerolac", mult:0.98, label:"-2%"}, {name:"Indigo", mult:0.92, label:"Budget -8%"}],
  waterproofing: [{name:"Dr Fixit", mult:1, label:"Standard"}, {name:"Fosroc", mult:1.1, label:"+10%"}, {name:"Sika", mult:1.12, label:"Premium +12%"}, {name:"Choksey", mult:0.95, label:"-5%"}, {name:"MYK", mult:1.05, label:"+5% Std"}],
  doors: [{name:"Teak Wood", mult:1, label:"Standard"}, {name:"WPC Door", mult:0.85, label:"Waterproof -15%"}, {name:"Flush Door Green", mult:0.75, label:"Budget -25%"}, {name:"Mica Door", mult:0.9, label:"-10%"}, {name:"Sagwan Premium", mult:1.2, label:"Premium +20%"}],
  windows: [{name:"Jindal Aluminium", mult:1, label:"Standard"}, {name:"Fenesta UPVC", mult:1.18, label:"Premium +18%"}, {name:"Aluplast", mult:1.12, label:"+12%"}, {name:"Local Aluminium", mult:0.9, label:"Budget -10%"}, {name:"Rehau UPVC", mult:1.15, label:"Premium +15%"}],
  glass: [{name:"Saint-Gobain", mult:1, label:"12mm"}, {name:"Asahi", mult:1.05, label:"+5%"}, {name:"Modiguard", mult:0.97, label:"-3%"}, {name:"Toughened Glass", mult:1.15, label:"Strong +15%"}, {name:"AIS Glass", mult:1.02, label:"Std +2%"}],
  railing: [{name:"Jindal SS304", mult:1, label:"Standard"}, {name:"Jindal SS202", mult:0.88, label:"Budget -12%"}, {name:"MS Railing", mult:0.75, label:"MS -25%"}, {name:"Glass Railing", mult:1.2, label:"Premium +20%"}, {name:"Aluminium Railing", mult:0.95, label:"Std -5%"}],
  pop: [{name:"Gyproc POP", mult:1, label:"Standard"}, {name:"Armstrong Ceiling", mult:1.15, label:"Premium +15%"}, {name:"Anutone", mult:1.08, label:"+8%"}, {name:"Local POP", mult:0.88, label:"Budget -12%"}, {name:"Sakarni POP", mult:0.95, label:"Std -5%"}],
  sanitary: [{name:"Cera", mult:1, label:"Rs.8500"}, {name:"Hindware", mult:1.05, label:"Rs.8925 +5%"}, {name:"Jaquar", mult:1.18, label:"Rs.10030 +18%"}, {name:"Kohler", mult:1.25, label:"Rs.10625 +25%"}, {name:"Parryware", mult:0.95, label:"Rs.8075 -5%"}],
  mistri: [{name:"Mistri Standard", mult:1, label:"Rs.750"}, {name:"Premium Mistri", mult:1.15, label:"Expert +15%"}, {name:"Thekedar Team", mult:1.1, label:"Contract +10%"}, {name:"Local Mistri", mult:0.9, label:"Budget -10%"}, {name:"Skilled Mistri", mult:1.05, label:"+5%"}],
  beldar: [{name:"Beldar Standard", mult:1, label:"Rs.500"}, {name:"Skilled Beldar", mult:1.1, label:"+10% Skilled"}, {name:"Local Beldar", mult:0.92, label:"Budget -8%"}, {name:"Helper Beldar", mult:0.85, label:"-15% Helper"}, {name:"Senior Beldar", mult:1.05, label:"+5% Senior"}],
  curing: [{name:"Local Curing", mult:1, label:"Standard"}, {name:"Chemical Curing", mult:1.25, label:"Fast +25%"}, {name:"Pond Curing", mult:0.95, label:"Std -5%"}, {name:"Spray Curing", mult:1.1, label:"+10% Spray"}, {name:"Membrane Curing", mult:1.15, label:"Premium +15%"}],
  lift: [{name:"OTIS", mult:1, label:"Standard"}, {name:"KONE", mult:1.1, label:"Premium +10%"}, {name:"SCHINDLER", mult:1.15, label:"Luxury +15%"}, {name:"JOHNSON", mult:1.05, label:"+5%"}, {name:"Budget Lift", mult:0.92, label:"Budget -8%"}],
  contingency: [{name:"Site Supervision", mult:1, label:"Standard"}, {name:"Tools + Supervision", mult:1, label:"With Tools"}, {name:"Supervision Premium", mult:1.2, label:"Premium +20%"}, {name:"Site Management", mult:1.1, label:"Management +10%"}, {name:"Basic Supervision", mult:0.9, label:"Budget -10%"}],
}
type EditState = { idx:number, qty:number, rate:number, company:string, cat:string, id:string } | null;
type BoxEditModal = { type:"plot"|"coverage"|"ground"|"floor"|"basic"|"standard"|"premium"|"construction"|"contraction"|"material", value:string } | null;
const CONTRACTOR_ONLY_IDS = ["ply","batta","jack","mistri","beldar","curing","lift","contingency"];
const WORLD_CONTRACT_MODES: any = {
  full: { id: "full", indiaName: "With Material - Turnkey", worldName: "Turnkey Full Service", ownerLabel: "With Material - Turnkey", ownerDesc: "All Materials + Labour Included", contractorLabel: "With Material - Turnkey - 24 Items", contractorDesc: "All Materials + Labour Included - Contractor Provides All", ratePerSqft: 0, contractorGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","mistri","beldar","curing","lift","contingency"], ownerGive: [] },
  centring: { id: "centring", indiaName: "Without Material - Centering + Labour", worldName: "Formwork + Labour", ownerLabel: "Without Material - Material by Owner", ownerDesc: "Owner Provides Material", contractorLabel: "Without Material - Centering + Labour", contractorDesc: "Contractor Provides Formwork + Labour - Owner Provides Material", ratePerSqft: 450, contractorGive: ["ply","batta","jack","mistri","beldar","curing","contingency","lift"], ownerGive: ["cement","steel","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary"] },
  labour: { id: "labour", indiaName: "Labour Only", worldName: "Labour Rate Contract", ownerLabel: "Labour Only", ownerDesc: "Labour & Supervision Only", contractorLabel: "Labour Only", contractorDesc: "Contractor Provides Labour Only - Owner Provides All Material", ratePerSqft: 280, contractorGive: ["mistri","beldar","contingency"], ownerGive: ["cement","steel","ply","batta","jack","bricks","sand","aggregate","electrical","plumbing","tiles","paint","waterproofing","doors","windows","glass","railing","pop","sanitary","curing","lift"] },
  custom: { id: "custom", indiaName: "Item Rate - Custom BOQ", worldName: "Item Rate / Custom BOQ", ownerLabel: "Item Rate - Custom Selection", ownerDesc: "Flexible BOQ", contractorLabel: "Item Rate - Custom BOQ", contractorDesc: "Flexible BOQ - Select Items Below", ratePerSqft: 350, contractorGive: [], ownerGive: [] }
};
const getContractorLabelFixed = (mode:any) => mode.id==="full" ? "With Material - Turnkey - 24 Items" : mode.contractorLabel;
// V29-14 FIX: Hardcode hataya - ab plotNum x coverage% dynamic hai
const getV26BuiltUpBreakup = (ground:number, total:number, plot:number=2000, cov:number=64) => { const extra = Math.max(0, total-ground); return `${plot} x ${cov}% = ${ground} Ground + ${extra} = Built-up ${total}`; };
const getV26GstText = (gstOn:boolean, base:number) => gstOn ? `GST ON - Rs.${inr(Math.round(base*0.18))} GST juda hua` : `GST OFF - GST Extra`;
export default function Page(){
  const [geo,setGeo]=useState("Nagpur");
  const [liveLabel,setLiveLabel]=useState("Use GPS Location");
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
  const [clientName,setClientName]=useState("");
  const [clientPhone,setClientPhone]=useState("");
  const [lang,setLang]=useState<"en"|"hi"|"mr">("en");
  const [showUSD,setShowUSD]=useState(false);
  const [bigText,setBigText]=useState(false);
  const [gpsVerified,setGpsVerified]=useState(false);
  // V29-17 FIX: Language pura - ab main headings bhi Hindi/Marathi me badlenge
  const T:any = {
    en: { contract:"Contract Type", plot:"Plot Area", coverage:"Coverage", floors:"Floors", clientName:"Client Name * Required", clientPhone:"Client Phone * Required", location:"Location - Cities + GPS + Voice", next:"Next - Step 2: Rates & Brands", profit:"Contractor Profit", gstOn:"GST ON - 18% Added", gstOff:"GST OFF - GST Extra", live:"Live Market", disclaimer:"This is an approximate estimate. Final cost may vary by 10-15% as per site conditions. Valid for 15 days. This is not a final quotation.", page1Title:"Page 1 - Contract + Location", constructionRate:"Construction Rate", labourRate:"Labour Rate - Per Sqft", materialRate:"Material Rate - Qty ke saath", profitSection:"Profit % + GST + Package", cityChange:"City badalne pe Rate auto-change hoga - Jaise Nagpur 2000, Mumbai 3300", micHint:"Mic dabake bolo - Jaise \"Nagpur\" - City auto-fill ho jayegi", standardNote:"Standard Package se Total bana hai - Package badalne pe Total auto-change hoga" },
    hi: { contract:"Contract Type - ठेका प्रकार", plot:"Plot Area - प्लॉट एरिया", coverage:"Coverage - कवरेज", floors:"Floors - मंजिल", clientName:"Client Name * ज़रूरी है", clientPhone:"Client Phone * ज़रूरी है", location:"Location - शहर + GPS + Voice", next:"Next - Step 2: Rates & Brands", profit:"Contractor Profit - ठेकेदार लाभ", gstOn:"GST ON - 18% जुड़ा", gstOff:"GST OFF - GST Extra", live:"Live Market - लाइव रेट", disclaimer:"यह एक अनुमानित एस्टीमेट है। फाइनल कीमत साइट के हिसाब से 10-15% बदल सकती है। 15 दिन तक मान्य है। यह फाइनल कोटेशन नहीं है।", page1Title:"Page 1 - ठेका + लोकेशन", constructionRate:"Construction Rate - निर्माण दर", labourRate:"Labour Rate - मजदूरी दर", materialRate:"Material Rate - मात्रा के साथ", profitSection:"Profit % + GST + Package - लाभ % + GST + पैकेज", cityChange:"शहर बदलने पर रेट अपने आप बदलेगा - जैसे नागपुर 2000, मुंबई 3300", micHint:"माइक दबाकर बोलो - जैसे \"नागपुर\" - शहर अपने आप भर जाएगा", standardNote:"Standard Package से Total बना है - Package बदलने पर Total अपने आप बदलेगा" },
    mr: { contract:"Contract Type - कंत्राट प्रकार", plot:"Plot Area - प्लॉट क्षेत्र", coverage:"Coverage - कव्हरेज", floors:"Floors - मजले", clientName:"Client Name * आवश्यक आहे", clientPhone:"Client Phone * आवश्यक आहे", location:"Location - शहर + GPS + Voice", next:"Next - Step 2: Rates & Brands", profit:"Contractor Profit - कंत्राटदार नफा", gstOn:"GST ON - 18% जोडले", gstOff:"GST OFF - GST Extra", live:"Live Market - लाईव्ह दर", disclaimer:"हा अंदाजे एस्टीमेट आहे. अंतिम किंमत साइटनुसार 10-15% बदलू शकते. 15 दिवस वैध. हे अंतिम कोटेशन नाही.", page1Title:"Page 1 - कंत्राट + लोकेशन", constructionRate:"Construction Rate - बांधकाम दर", labourRate:"Labour Rate - मजुरी दर", materialRate:"Material Rate - प्रमाणासह", profitSection:"Profit % + GST + Package - नफा % + GST + पॅकेज", cityChange:"शहर बदलल्यावर दर आपोआप बदलेल - जसे नागपूर 2000, मुंबई 3300", micHint:"माईक दाबून बोला - जसे \"नागपूर\" - शहर आपोआप भरेल", standardNote:"Standard Package ने Total बनला आहे - Package बदलल्यावर Total आपोआप बदलेल" }
  }[lang];
  useEffect(()=>{ setLastUpdate(new Date().toLocaleDateString("en-IN")); const day = new Date().getDate(); const fluc = 1 + ((day % 7) - 3) * 0.006; setDailyFluc(fluc); },[]);
  useEffect(()=>{ try{ const s = localStorage.getItem("abuildwise_draft_v28"); if(s){ const d = JSON.parse(s); if(d.clientName) setClientName(d.clientName); if(d.clientPhone) setClientPhone(d.clientPhone); if(d.geo) setGeo(d.geo); if(d.plotArea) setPlotArea(d.plotArea); if(d.storeys) setStoreys(d.storeys); if(d.pkg) setPkg(d.pkg); } }catch{} },[]);
  useEffect(()=>{ try{ localStorage.setItem("abuildwise_draft_v28", JSON.stringify({clientName, clientPhone, geo, plotArea, storeys, pkg, profitPercent, worldMode})); }catch{} },[clientName, clientPhone, geo, plotArea, storeys, pkg, profitPercent, worldMode]);
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if(!SR){ alert("Voice not supported"); return; }
    const rec = new SR(); rec.lang = lang==="hi" ? "hi-IN" : lang==="mr" ? "mr-IN" : "en-IN"; rec.onstart = ()=> setIsListening(true); rec.onend = ()=> setIsListening(false);
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
      if(!hasContingency){ data.materials.push({ id:"contingency", name:"Contingency + Site Supervision & Tools", qty:1280, rate:getAnyMaterialLive(localRate, 25, 1), amount:32000, company:"Site Supervision & Tools", cat:"contingency" }); }
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
      const {latitude, longitude} = pos.coords; setCurrentLatLng({lat:latitude, lng:longitude}); setGpsVerified(true);
      try{
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const d = await rev.json(); const city = d.address?.city || d.address?.town || d.address?.village || d.address?.suburb || d.address?.state_district || geo;
        setGeo(city); setLiveLabel(`${city} - GPS Verified`); fetchData(city, latitude, longitude);
      }catch{ setLiveLabel(`${geo} - GPS Verified`); fetchData(geo, latitude, longitude); }
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
  const covPct = Math.round(coverage*100);
  const baseMaterials = useMemo(()=>{
    const mats = apiData.materials || [];
    if(mats.length>0 && mats.length<23){
      const hasC = mats.some((x:any)=>x.id==="contingency");
      if(!hasC){ return [...mats, { id:"contingency", name:"Contingency + Site Supervision & Tools", qty:1280, rate:getAnyMaterialLive(ratePerSqft, 25, 1), amount:32000, company:"Site Supervision & Tools", cat:"contingency" }]; }
    }
    return mats;
  },[apiData, storeys]);
  const finalMaterials = customMaterials || baseMaterials;
  const worldModeConfig = WORLD_CONTRACT_MODES[worldMode];
  const getFilteredByWorldMode = (mats:any[])=>{
    if(worldMode==="custom"){
      const cIds = Object.keys(customTick).filter(k=>customTick[k]==="contractor");
      const oIds = Object.keys(customTick).filter(k=>customTick[k]==="owner");
      if(cIds.length===0 && oIds.length===0) return { contractorMats: [], ownerMats: [] };
      return { contractorMats: mats.filter((m:any)=>cIds.includes(m.id)), ownerMats: mats.filter((m:any)=>oIds.includes(m.id)) };
    }
    return { contractorMats: mats.filter((m:any)=>worldModeConfig.contractorGive.includes(m.id)), ownerMats: mats.filter((m:any)=>worldModeConfig.ownerGive.includes(m.id)) };
  };
  const { contractorMats: worldContractorMats, ownerMats: worldOwnerMats } = getFilteredByWorldMode(finalMaterials);
  const filteredFinalMaterials = finalMaterials.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredContractorMats = worldContractorMats.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredOwnerMats = worldOwnerMats.filter((m:any)=> m.qty>0 && m.amount>0);
  const filteredOwnerForDisplay = worldMode==="full" ? filteredFinalMaterials : filteredOwnerMats;
  const filteredOwnerForDisplayFixed = worldMode==="custom" ? filteredOwnerMats : filteredOwnerForDisplay;
  const filteredOwnerForDisplayFinal = worldMode==="custom" ? filteredOwnerForDisplayFixed : filteredOwnerForDisplay;
  useEffect(()=>{ if(edit) return; setCustomMaterials(null); },[apiData.materials]);
  const grandTotal = apiData.grandTotal || 0;
  const baseRateDisplay = apiData.baseRatePerSqft || getCityRate(geo);
  const cityBaseRate = getCityRate(geo);
  const basicRateShow = Math.round(cityBaseRate*0.82);
  const standardRateShow = cityBaseRate;
  const premiumRateShow = Math.round(cityBaseRate*1.38);
  const worldContractorRate = worldMode==="full" ? standardRateShow : worldMode==="centring" ? getAnyMaterialLive(cityBaseRate, 450, 1) : worldMode==="labour" ? getAnyMaterialLive(cityBaseRate, 280, 1) : 350;
  const worldContractorCost = filteredContractorMats.reduce((s:any,m:any)=>s+m.amount,0);
  const worldOwnerCost = filteredOwnerMats.reduce((s:any,m:any)=>s+m.amount,0);
  const ownerChargeBaseOriginal = worldMode==="full" ? tca * standardRateShow : worldMode==="centring" ? worldOwnerCost + (tca*worldContractorRate) : worldMode==="labour" ? worldOwnerCost + (tca*worldContractorRate) : worldOwnerCost + worldContractorCost + (tca*100);
  const ownerChargeBase = (worldMode==="centring" || worldMode==="labour") ? (tca * standardRateShow + Math.max(0, (tca*worldContractorRate) - worldContractorCost)) : ownerChargeBaseOriginal;
  const ownerChargeBaseFinal = worldMode==="full" ? (tcaV20 * standardRateShow) : worldMode==="centring" ? (worldOwnerCost + (tcaV20*worldContractorRate)) : worldMode==="labour" ? (worldOwnerCost + (tcaV20*worldContractorRate)) : worldMode==="custom" ? (Object.keys(customTick).length===0 ? 0 : (worldOwnerCost + worldContractorCost)) : ownerChargeBase;
  const ownerCharge = gstOn ? Math.round(ownerChargeBaseFinal * 1.18) : ownerChargeBaseFinal;
  const contractorCost = worldMode==="full" ? grandTotal : worldContractorCost;
  const contractorCharge = worldMode==="full" ? ownerChargeBaseFinal : tcaV20 * worldContractorRate;
  const contractorChargeFinal = worldMode==="custom" ? (Object.keys(customTick).length===0 ? 0 : (worldContractorCost + Math.round(worldContractorCost * (profitPercent/100)))) : contractorCharge;
  const profit = Math.round(contractorCost * (profitPercent/100));
  const profitFinal = worldMode==="custom" && Object.keys(customTick).length===0 ? 0 : profit;
  const finalContractorCharge = viewMode==="contractor" ? contractorCost + profitFinal : contractorChargeFinal;
  const finalTotal = viewMode==="owner" ? ownerCharge : finalContractorCharge;
  const effectiveRate = Math.round(finalTotal / (tcaV20 || 1));
  const ownerBreakup = filteredOwnerMats.slice(0,3).map((m:any)=>`${m.id.toUpperCase()} Rs.${inr(m.amount)}`).join(" + ");
  const v26BaseTotal = tcaV20 * standardRateShow;
  const v26BreakupText = worldMode==="full" ? `${tcaV20} Sqft x Rs.${standardRateShow} = Rs.${inr(v26BaseTotal)} (With Material - Full)` : worldMode==="centring" ? `Owner Material Rs.${inr(worldOwnerCost)} (${ownerBreakup} + ...) + Labour ${tcaV20} x Rs.${worldContractorRate} = Rs.${inr(ownerChargeBaseFinal)}` : worldMode==="labour" ? `Owner Material Rs.${inr(worldOwnerCost)} + Labour ${tcaV20} x Rs.${worldContractorRate} = Rs.${inr(ownerChargeBaseFinal)}` : `Custom Tick Total = Rs.${inr(ownerChargeBaseFinal)}`;
  const sqmt = (tcaV20*0.092903).toFixed(1);
  const usd = Math.round(finalTotal/83).toLocaleString("en-US");
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
    else if(boxEditModal.type==="construction"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, standard:n})); }
    else if(boxEditModal.type==="contraction"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, basic:n})); }
    else if(boxEditModal.type==="material"){ const n = parseInt(val); if(n>0) setCustomPkgRatesAdd(prev=>({...prev, premium:n})); }
    setBoxEditModal(null);
  }
  const goNextWithValidation = () => { if(!clientName.trim()){ alert("Pehle Client Name bhare"); return; } if(!clientPhone.trim()){ alert("Pehle Client Phone bhare"); return; } setPhase(2); };
  const handleWhatsApp = () => {
    const text = viewMode==="owner" ? `Construction Estimate - ${clientName || geo} - ${geo} - Plot ${plotNum} Sqft - Built-up ${tcaV20} Sqft (${sqmt} Sqmt) - Package ${pkg} - Total Rs.${inr(finalTotal)} ($${usd}) ${gstOn?'(With GST 18%)':'(GST Extra)'} - Date ${lastUpdate} - Breakup: ${v26BreakupText}` : `Contractor Estimate - ${geo} - Plot ${plotNum} - Cost Rs.${inr(contractorCost)} - Charge Rs.${inr(finalContractorCharge)} - Profit Rs.${inr(profitFinal)} (${profitPercent}%) - GST ${gstOn?'ON':'OFF'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const wrapPdf = (doc:any, text:string, x:number, y:number, maxW:number, lineH:number) => {
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
    return y + lines.length * lineH;
  };
  const handlePDF = async () => {
    const doc = new jsPDF(); const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
    const GOLD = [180,140,30]; const DARK = [20,20,20]; const GREY = [100,100,100];
    doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');
    doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.setFont("helvetica","bold"); doc.setFontSize(26); doc.text("ABuildWise", 14, 20);
    doc.setFontSize(9); doc.setTextColor(GREY[0],GREY[1],GREY[2]); doc.setFont("helvetica","normal"); doc.text("Professional Construction Estimate", 14, 27);
    doc.setFontSize(9); doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.setFont("helvetica","bold"); doc.text("QUOTATION", W-14, 20, {align:'right'});
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.text(`No: AW-${geo.toUpperCase().slice(0,3)}-${tcaV20}-${new Date().getFullYear()}`, W-14, 27, {align:'right'});
    doc.setDrawColor(230,230,230); doc.line(14,32,W-14,32);
    let y = 42;
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("Client Details", 14, y); y+=6;
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
    y = wrapPdf(doc, `Name: ${clientName || "Not Provided"}`, 14, y, W-28, 5);
    y = wrapPdf(doc, `Phone: ${clientPhone || "Not Provided"}`, 14, y, W-28, 5);
    y = wrapPdf(doc, `Location: ${geo} | Date: ${lastUpdate} | Valid for 15 Days`, 14, y, W-28, 5);
    y+=2; doc.setFont("helvetica","bold"); doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.text("Project Summary", 14, y); y+=6;
    doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60); doc.setFontSize(9);
    y = wrapPdf(doc, `Plot: ${plotNum} Sqft | Coverage: ${Math.round(coverage*100)}% | Ground: ${groundPlate} Sqft | ${getPLabel(storeys)} | Built-up: ${tcaV20} Sqft (${sqmt} Sqmt)`, 14, y, W-28, 5);
    y = wrapPdf(doc, `Package: ${pkg} | Mode: ${worldModeConfig.indiaName}`, 14, y, W-28, 5);
    y = wrapPdf(doc, `Breakup: ${v26BreakupText} | ${getV26BuiltUpBreakup(groundPlate, tcaV20, plotNum, covPct)} | ${getV26GstText(gstOn, ownerChargeBaseFinal)}`, 14, y, W-28, 5);
    y+=2; doc.setFillColor(250,248,240); doc.rect(14,y,W-28,26,'F'); doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text("Estimated Cost", 20, y+9);
    doc.setFontSize(18); doc.text(`Rs. ${inr(finalTotal)}`, 20, y+20);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(GREY[0],GREY[1],GREY[2]); doc.text(gstOn ? "With GST 18% Included" : "GST Extra", W-20, y+20, {align:'right'});
    y+=30; doc.setFontSize(8); doc.setTextColor(GREY[0],GREY[1],GREY[2]); y = wrapPdf(doc, `Base Rate Rs.${baseRateDisplay} / Sqft | Effective Rate Rs.${effectiveRate} / Sqft | Profit ${profitPercent}%`, 14, y, W-28, 4);
    doc.setFontSize(7); doc.text("Page 1 / 3", W/2, H-10, {align:'center'});
    doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');
    doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(`Detailed BOQ - ${tcaV20} Sqft`, 14, 16);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(GREY[0],GREY[1],GREY[2]); doc.text(`${geo} | ${pkg} Package`, 14, 22);
    let by = 30; doc.setFillColor(20,20,20); doc.rect(14,by,W-28,8,'F'); doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
    doc.text("No.", 16, by+5.5); doc.text("Item", 24, by+5.5); doc.text("Qty", 108, by+5.5); doc.text("Rate", 132, by+5.5); doc.text("Amount", W-16, by+5.5, {align:'right'}); by+=11;
    const pdfMats = viewMode==="owner" ? filteredOwnerForDisplayFinal : filteredFinalMaterials; let sNo=1;
    for(const m of pdfMats){
      if(by>260){ doc.addPage(); by=16; }
      let fixedQty = m.qty; if(m.id==="pop") fixedQty = Math.round(tcaV20*0.75); if(m.id==="sanitary") fixedQty = (parseInt(storeys)||1)*2; if(m.id==="tiles") fixedQty = Math.round(tcaV20*0.85);
      const itemName = `${m.id.toUpperCase()} - ${m.company}`;
      const unit = getUnitForId(m.id);
      if(sNo%2===0){ doc.setFillColor(248,248,248); doc.rect(14,by-4,W-28,8,'F'); }
      doc.setTextColor(30,30,30); doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.text(`${sNo}`, 16, by+2);
      const itemLines = doc.splitTextToSize(itemName, 78);
      doc.text(itemLines, 24, by+2);
      doc.text(`${fixedQty} ${unit}`, 108, by+2);
      doc.text(`Rs.${m.rate}`, 132, by+2);
      doc.text(`Rs.${inr(fixedQty*m.rate)}`, W-16, by+2, {align:'right'});
      by += Math.max(8, itemLines.length*5+3); sNo++;
    }
    by+=4; doc.setFillColor(250,248,240); doc.rect(14,by,W-28,10,'F'); doc.setTextColor(80,60,0); doc.setFontSize(8); doc.text(`Wastage, Labour Cess and Contingency included in above items`, 16, by+6); by+=14;
    doc.setFillColor(20,20,20); doc.rect(14,by,W-28,11,'F'); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text(`Grand Total: Rs. ${inr(finalTotal)} ${gstOn?'(With GST)':'(GST Extra)'}`, W-16, by+7, {align:'right'});
    doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');
    doc.setTextColor(DARK[0],DARK[1],DARK[2]); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text("QR Verification", W/2, 30, {align:'center'});
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
    const verifyLine = `Scan to Verify: ${geo} - ${tcaV20} Sqft - Rs. ${inr(finalTotal)}`;
    const vLines = doc.splitTextToSize(verifyLine, W-28); doc.text(vLines, W/2, 42, {align:'center'});
    doc.setDrawColor(200,200,200); doc.rect(W/2-35, 56, 70, 70);
    try { const qrData = `ABuildWise-${geo}-${tcaV20}-${finalTotal}-${lastUpdate}`; const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`; const res = await fetch(qrUrl); const blob = await res.blob(); const base64 = await new Promise<string>((resolve)=>{ const reader = new FileReader(); reader.onloadend = ()=> resolve(reader.result as string); reader.readAsDataURL(blob); }); doc.addImage(base64, 'PNG', W/2-33, 58, 66, 66); } catch(e) { doc.setFontSize(8); doc.text("QR Load Failed", W/2, 90, {align:'center'}); }
    doc.setFontSize(8); doc.setTextColor(GREY[0],GREY[1],GREY[2]); doc.text(`Verified: ${lastUpdate}`, W/2, 138, {align:'center'});
    doc.save(`ABuildWise_${geo}_${tcaV20}_${pkg}_${worldMode}.pdf`);
  };
  const Progress = () => (
    <div className="w-full mb-3">
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[{n:1,label:"Contract + Location"},{n:2,label:"Rates"},{n:3,label:"Estimate"}].map(i=>(
          <div key={i.n} className="flex items-center gap-1 min-w-0">
            <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[12px] font-black border ${phase>=i.n ? "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] text-black border-[#d4af37]" : "bg-white/5 text-white/40 border-white/10"}`}>{i.n}</div>
            <span className={`text-[12px] font-bold leading-tight break-words whitespace-normal min-w-0 ${phase===i.n ? "text-[#d4af37]" : "text-white/50"}`}>{i.label}</span>
          </div>
        ))}
      </div>
      <div className="w-full h-[3px] bg-white/10 rounded-full"><div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] transition-all duration-700" style={{width:`${(phase/3)*100}%`}}></div></div>
    </div>
  );
  return (
    <div className={`min-h-screen ${bigText ? "big-text-mode bg-black text-white" : "bg-[#02020a] text-white"} flex flex-col items-center p-2 pb-32 relative`}>
      {/* V29-20 FIX: Big Text ab sach me bada hoga - CSS se sab text 15px+ */}
      {bigText && (<style>{`.big-text-mode *{font-size:15px !important; line-height:1.55 !important;} .big-text-mode input, .big-text-mode select{font-size:16px !important;} .big-text-mode h2{font-size:18px !important;}`}</style>)}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15),transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.12),transparent_60%)] pointer-events-none"></div>
      <div className="w-full max-w-[720px] relative z-10">
        <div className="relative flex flex-wrap justify-between items-center gap-2 bg-gradient-to-r from-[#0f141f] to-[#141a2a] border border-[#d4af37]/20 rounded-2xl px-4 py-2.5 mb-2">
          <span className="font-black text-[14px] break-words whitespace-normal min-w-0">ABuildWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f0d060]">Estimate</span></span>
          <div className="flex flex-wrap bg-black/60 rounded-full p-1 border border-[#d4af37]/20 gap-1">
            <button onClick={()=>setViewMode("owner")} className={`px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${viewMode==="owner"?"bg-white text-black":"text-white/70"}`}>Owner: {worldMode==="custom" ? filteredOwnerMats.length : filteredOwnerForDisplay.length} Items</button>
            <button onClick={()=>setViewMode("contractor")} className={`px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black":"text-white/70"}`}>Contractor: {filteredContractorMats.length} Items</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="flex bg-black/60 border border-white/20 rounded-full p-1 gap-1"><button onClick={()=>setLang("en")} className={`px-3 py-1 rounded-full text-[12px] font-bold ${lang==="en"?"bg-white text-black":"text-white/70"}`}>English</button><button onClick={()=>setLang("hi")} className={`px-3 py-1 rounded-full text-[12px] font-bold ${lang==="hi"?"bg-white text-black":"text-white/70"}`}>हिन्दी</button><button onClick={()=>setLang("mr")} className={`px-3 py-1 rounded-full text-[12px] font-bold ${lang==="mr"?"bg-white text-black":"text-white/70"}`}>मराठी</button></div>
          <button onClick={()=>setShowUSD(!showUSD)} className="px-3 py-1 rounded-full text-[12px] font-bold bg-black/60 border border-white/20">{showUSD ? "Show in Rs." : "Show in $ + Sqmt"}</button>
          <button onClick={()=>setBigText(!bigText)} className="px-3 py-1 rounded-full text-[12px] font-bold bg-black/60 border border-white/20">{bigText ? "Normal Text" : "Big Text - A+"}</button>
          <span className="text-[12px] py-1 text-green-400 font-bold">✓ Draft Auto-Saved</span>
        </div>
        <Progress />
        <div className="grid grid-cols-1 gap-2 bg-black/60 border border-cyan-400/20 rounded-2xl px-3 py-2 mb-3">
          <span className="text-[12px] px-2 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/20 text-[#d4af37] font-bold break-words whitespace-normal min-w-0 text-center">Base Rs.{baseRateDisplay} / sqft | Built-up {tcaV20} Sqft ({sqmt} Sqmt) | Live = Aaj ka Market Rate Rs.{getCityRate(geo)} - Updated: {lastUpdate}</span>
          <span className="text-[12px] font-black bg-gradient-to-r from-[#d4af37]/20 to-[#f0d060]/20 px-2 py-1.5 rounded-full border border-[#d4af37]/30 break-words whitespace-normal min-w-0 text-center">{viewMode==="owner" ? `Total Rs.${inr(finalTotal)}${showUSD ? ` = $${usd}` : ""}` : `Profit: Rs.${inr(profitFinal)}`}</span>
          <span className="text-[12px] text-white/80 break-words whitespace-normal text-center">{v26BreakupText}</span>
          <span className="text-[12px] text-cyan-300 break-words whitespace-normal text-center">{getV26BuiltUpBreakup(groundPlate, tcaV20, plotNum, covPct)} | {getV26GstText(gstOn, ownerChargeBaseFinal)}</span>
          <span className="text-[12px] text-white/70 break-words whitespace-normal text-center">{T.standardNote}</span>
        </div>
        {phase===1 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3"><h2 className="font-black text-[15px] text-[#d4af37] break-words whitespace-normal">{T.page1Title}</h2><div className="text-[12px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black whitespace-nowrap">Step 1 / 3</div></div>
            <div className="grid grid-cols-1 gap-2 mb-3 bg-black/40 p-3 rounded-[18px] border border-[#d4af37]/10">
              <div className="text-[12px] font-bold text-[#d4af37] break-words whitespace-normal">{T.contract}</div>
              {(Object.keys(WORLD_CONTRACT_MODES) as Array<keyof typeof WORLD_CONTRACT_MODES>).map((k)=>{
                const m = WORLD_CONTRACT_MODES[k]; const active = worldMode===k;
                const fixedLabel = m.indiaName;
                const fixedDesc = viewMode==="owner" ? m.ownerDesc : (m.contractorDesc || m.ownerDesc);
                // V29-3 FIX: Active = Black text on White, Inactive = White text on Dark - White on White khatam
                return (<button key={k} onClick={()=>setWorldMode(k as any)} className={`text-left p-4 rounded-[16px] border break-words whitespace-normal ${active ? "bg-white text-black border-white" : "bg-[#1a2332] border-white/30 text-white"}`}><div className={`font-black text-[13px] flex flex-wrap justify-between gap-2 ${active ? "text-black" : "text-white"}`}><span className="break-words whitespace-normal">{fixedLabel}</span>{active && <span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full whitespace-nowrap">Selected</span>}</div><div className={`text-[12px] font-bold mt-1 break-words whitespace-normal ${active ? "text-black/80" : "text-white/90"}`}>{m.worldName}</div><div className={`text-[12px] break-words whitespace-normal ${active ? "text-black/70" : "text-white/80"}`}>{fixedDesc}</div></button>);
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-black/60 border border-[#d4af37]/50 rounded-[18px] p-3 relative">
                <button onClick={()=>setBoxEditModal({type:"plot", value:plotArea})} className="absolute top-2 right-2 text-[11px] bg-[#d4af37] text-black px-2 py-1 rounded-full font-black">Edit</button>
                <div className="text-[12px] font-black text-[#d4af37] break-words whitespace-normal pr-12">{T.plot}</div>
                <input value={plotArea} onChange={e=>setPlotArea(e.target.value)} className="w-full bg-black border border-[#d4af37]/40 rounded-full px-3 py-2.5 text-[18px] font-black text-white mt-1 text-center" />
                <div className="text-[12px] text-white/70 mt-1 break-words whitespace-normal">{plotNum} Sqft - Editable</div>
              </div>
              <div className="bg-black/60 border border-cyan-400/50 rounded-[18px] p-3 relative">
                <button onClick={()=>setManualCoverageAdd(null)} className="absolute top-2 right-2 text-[11px] bg-cyan-400 text-black px-2 py-1 rounded-full font-black">Auto {Math.round(liveCoverage*100)}%</button>
                <div className="text-[12px] font-black text-cyan-300 break-words whitespace-normal pr-16">{T.coverage}</div>
                <div className="flex items-center gap-1 mt-1"><input type="number" value={String(Math.round(coverage*100))} onChange={e=>setManualCoverageAdd(parseInt(e.target.value)/100)} className="flex-1 min-w-0 bg-black border border-cyan-400/40 rounded-full px-3 py-2.5 text-[18px] font-black text-cyan-300 text-center" /><span>%</span></div>
                <div className="text-[12px] text-cyan-300 mt-1 break-words whitespace-normal">{getV26BuiltUpBreakup(groundPlate, tcaV20, plotNum, covPct)}</div>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-[16px] p-3 mb-3">
              <div className="text-[12px] font-black text-[#d4af37] mb-2">{T.floors}</div>
              <select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3.5 text-[13px] font-black">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select>
              <div className="text-[12px] text-white/70 mt-1">Selected: {getPLabel(storeys)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder={T.clientName} className="w-full bg-black/50 border border-white/15 rounded-full px-4 py-3 text-[13px] font-bold outline-none" />
              <input value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder={T.clientPhone} className="w-full bg-black/50 border border-white/15 rounded-full px-4 py-3 text-[13px] font-bold outline-none" />
            </div>
            <div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 mb-3">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2"><h2 className="font-bold text-[13px] text-cyan-300 break-words whitespace-normal">{T.location}</h2><button onClick={getLiveLocation} className="text-[12px] px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 text-black font-black break-words whitespace-normal">{gpsVerified ? `${geo} - GPS Verified` : liveLabel}</button></div>
              <div className="text-[12px] text-white/70 mb-2">{T.cityChange}</div>
              <div className="relative flex gap-2">
                <input value={geo} onChange={e=>{setGeo(e.target.value); setShow(true);}} onFocus={()=>setShow(true)} onBlur={()=>setTimeout(()=>setShow(false),200)} className="flex-1 min-w-0 bg-black/50 border border-[#d4af37]/30 rounded-full px-5 py-4 text-[13px] font-bold outline-none" placeholder="Search City" />
                <button onClick={startVoice} className={`w-[54px] h-[54px] shrink-0 rounded-full flex items-center justify-center font-black text-[18px] border ${isListening ? "bg-red-500" : "bg-gradient-to-br from-[#d4af37] to-[#a07a1a] border-[#d4af37] text-black"}`}>{isListening ? "●" : "🎤"}</button>
                {show && (<div className="absolute left-0 right-[62px] top-full mt-2 bg-[#1a2332] border border-[#d4af37]/30 rounded-2xl z-[9999] max-h-[240px] overflow-y-auto">{[...new Set([...CITIES_DB, geo])].filter(c=>c.toLowerCase().includes(geo.toLowerCase())).slice(0,20).map(c=><div key={c} onMouseDown={()=>{setGeo(c); setShow(false); fetchData(c);}} className="px-5 py-3 text-[12px] hover:bg-[#d4af37]/10 cursor-pointer flex flex-wrap justify-between gap-2 border-b border-white/5"><span className="font-bold break-words whitespace-normal">{c}</span><span className="text-[#d4af37] break-words whitespace-nowrap">Rs.{getCityRate(c)} / sqft</span></div>)}</div>)}
              </div>
              <div className="text-[12px] text-white/70 mt-2">{T.micHint}</div>
            </div>
            <div className="bg-gradient-to-br from-[#d4af37]/20 to-[#f0d060]/10 border border-[#d4af37]/40 rounded-[18px] p-3 mb-3">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2"><span className="text-[12px] font-black text-[#d4af37] break-words whitespace-normal">{T.live} - {geo} - Updated: {lastUpdate}</span><span className="text-[11px] px-2 py-1 rounded-full bg-[#d4af37] text-black font-black whitespace-nowrap">Live</span></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-[#d4af37]/30 relative"><button onClick={()=>setBoxEditModal({type:"construction", value:String(getCityRate(geo))})} className="absolute top-2 right-2 text-[11px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">Edit</button><div className="text-[12px] text-[#d4af37] font-bold break-words whitespace-normal pr-10">{T.constructionRate} - {geo}</div><div className="text-[22px] font-black text-white mt-1 break-words whitespace-normal">Rs.{getCityRate(geo)} / sqft</div><div className="text-[12px] text-white/70 mt-1 break-words whitespace-normal">Mumbai 3300 | Bhopal 2100 | Nagpur 2000</div><div className="mt-2 grid grid-cols-2 gap-1 text-[12px]"><div className="bg-white/5 rounded-full px-2 py-1 break-words whitespace-normal">Basic: Rs.{Math.round(getCityRate(geo)*0.82)}</div><div className="bg-white/5 rounded-full px-2 py-1 break-words whitespace-normal">Premium: Rs.{Math.round(getCityRate(geo)*1.38)}</div></div></div>
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-cyan-400/30 relative"><button onClick={()=>setBoxEditModal({type:"contraction", value:String(getLiveTripleRates(geo).contractionRate.centering)})} className="absolute top-2 right-2 text-[11px] bg-cyan-400 text-black px-2 py-0.5 rounded-full font-black">Edit</button><div className="text-[12px] text-cyan-300 font-bold break-words whitespace-normal pr-10">{T.labourRate}</div><div className="mt-1 space-y-1"><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Centering Material:</span><span className="text-cyan-300 break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).contractionRate.centering} / sqft</span></div><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Steel Binding:</span><span className="text-cyan-300 break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).contractionRate.steelBinding} / sqft</span></div><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Labour Charge (Total me yahi):</span><span className="text-cyan-300 break-words whitespace-nowrap">Rs.450 / sqft</span></div></div><div className="text-[12px] text-white/70 mt-2">450 ka matlab: Centering Labour ka rate hai. 480 (Material) + 120 (Binding) alag hai, 450 se jodna nahi hai. Mistri Rs.{getLiveTripleRates(geo).contractionRate.mistri} / day | Beldar Rs.{getLiveTripleRates(geo).contractionRate.beldar} / day - Sirf jankari ke liye hai, Total me nahi juda, 450 me hi INCLUDED hai.</div></div>
                <div className="bg-black/60 rounded-[14px] p-2.5 border border-green-400/30 relative"><button onClick={()=>setBoxEditModal({type:"material", value:String(getLiveTripleRates(geo).materialRate.cement)})} className="absolute top-2 right-2 text-[11px] bg-green-400 text-black px-2 py-0.5 rounded-full font-black">Edit</button><div className="text-[12px] text-green-300 font-bold break-words whitespace-normal pr-10">{T.materialRate}</div><div className="mt-1 space-y-1"><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Cement:</span><span className="text-green-300 break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).materialRate.cement} / Bag x 300 Bags</span></div><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Steel:</span><span className="text-green-300 break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).materialRate.steel} / Kg x 4000 Kg</span></div><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">M-Sand:</span><span className="break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).materialRate.sand} / CFT x 800 CFT</span></div><div className="flex justify-between gap-2 text-[12px] font-black"><span className="break-words whitespace-normal">Aggregate:</span><span className="break-words whitespace-nowrap">Rs.{getLiveTripleRates(geo).materialRate.aggregate} / CFT x 700 CFT</span></div></div><div className="text-[12px] text-white/70 mt-2">Qty Page 3 me detail me dikhegi</div></div>
              </div>
            </div>
            <div className="bg-black/40 border border-[#d4af37]/20 rounded-[16px] p-3 mb-3">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2 min-w-0"><span className="text-[12px] font-black text-[#d4af37] break-words whitespace-normal min-w-0">{T.profitSection}</span><div className="flex flex-wrap gap-2 items-center"><button onClick={()=>setGstOn(!gstOn)} className={`px-3 py-1.5 rounded-full text-[12px] font-black border whitespace-nowrap ${gstOn?'bg-[#d4af37] text-black':'bg-white/10 text-white/70'}`}>{gstOn?T.gstOn:T.gstOff}</button></div></div>
              <div className="text-[12px] font-black text-white mb-1">{T.profit}: {profitPercent}% = Rs.{inr(profitFinal)} - Slider hilane se Profit + Total badlega</div>
              <input type="range" min="5" max="50" value={profitPercent} onChange={e=>setProfitPercent(parseInt(e.target.value))} className="w-full accent-[#d4af37] h-2 bg-white/10 rounded-full" />
              <div className="flex justify-between text-[12px] text-white/70"><span>5% - Kam Profit</span><span>18% - Standard</span><span>50% - Zyada Profit</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                {[{id:"basic", label:"Basic", rate: basicRateShow},{id:"standard", label:"Standard", rate: standardRateShow},{id:"premium", label:"Premium", rate: premiumRateShow}].map(p=>(
                  <div key={p.id} className={`rounded-[16px] border p-3 text-left relative break-words whitespace-normal min-w-0 w-full ${pkg===p.id?"bg-white text-black border-white font-black":"bg-black/40 border-white/10"}`}>
                    <button onClick={(e)=>{e.stopPropagation(); setBoxEditModal({type:p.id as any, value:String(p.rate)})}} className="absolute top-1 right-1 text-[11px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black z-10 whitespace-nowrap">Edit</button>
                    <button onClick={()=>setPkg(p.id)} className="w-full text-left mt-2 min-w-0"><div className="text-[12px] break-words whitespace-normal">{p.label}</div><div className="text-[15px] break-words whitespace-normal w-full">Rs.{p.rate} / sqft</div><div className="text-[12px] opacity-60 mt-1 break-words whitespace-normal">Editable - Click karte hi Total badlega</div></button>
                  </div>
                ))}
              </div>
              <div className="text-[12px] text-[#d4af37] mt-2">{T.standardNote}</div>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-[16px] p-3 mb-3"><div className="text-[12px] text-yellow-200 font-bold break-words whitespace-normal">⚠️ {T.disclaimer}</div></div>
            <button onClick={goNextWithValidation} className="w-full mt-2 bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-4 rounded-full text-[13px] break-words whitespace-normal">{T.next}</button>
          </div>
        )}
        {phase===2 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/20 rounded-[24px] p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3"><h2 className="font-black text-[15px] text-[#d4af37] break-words whitespace-normal">Page 2 - Rates</h2><div className="text-[12px] px-2 py-1 rounded-full bg-white text-black font-black whitespace-nowrap">Step 2 / 3 - Profit {profitPercent}% = Rs.{inr(profitFinal)}</div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <select value={cementCompany} onChange={e=>setCementCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[12px] font-bold break-words whitespace-normal"><option value="ultratech">Ultratech Rs.{apiData.cementRate} / Bag</option><option value="acc">ACC Rs.{Math.round(apiData.cementRate*0.97)} / Bag</option></select>
              <select value={steelCompany} onChange={e=>setSteelCompany(e.target.value)} className="bg-black/60 border border-[#d4af37]/30 rounded-full px-3 py-3.5 text-[12px] font-bold break-words whitespace-normal"><option value="kamdhenu_nxt">Kamdhenu Rs.{apiData.steelRate} / Kg</option><option value="tata_tiscon">Tata Rs.{Math.round(apiData.steelRate*1.16)} / Kg</option></select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div><div className="text-[12px] font-black text-[#d4af37] break-words whitespace-normal mb-1 ml-1">Plot Area</div><input value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="Plot Area" className="w-full bg-black/60 border border-white/10 rounded-full px-4 py-3.5 text-[13px] font-bold" /><div className="text-[12px] text-[#d4af37] mt-1 ml-3 font-bold break-words whitespace-normal">Coverage: {Math.round(coverage*100)}% - {getV26BuiltUpBreakup(groundPlate, tcaV20, plotNum, covPct)}</div></div>
              <div><div className="text-[12px] font-black text-cyan-300 break-words whitespace-normal mb-1 ml-1">Floors</div><select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black/60 border border-cyan-400/40 rounded-full px-3 py-3.5 text-[13px] font-black">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getPLabel(String(n))}</option>)}</select></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3.5 text-[12px] font-bold">Back</button><button onClick={()=>setPhase(3)} className="flex-[2] bg-gradient-to-r from-white to-[#e0e0e0] text-black font-black py-3.5 rounded-full text-[13px] break-words whitespace-normal">Next - Final Estimate</button></div>
          </div>
        )}
        {phase===3 && (
          <div className="bg-gradient-to-br from-[#0f141f]/90 to-[#0a0f1e]/90 border border-[#d4af37]/30 rounded-[24px] p-4 mb-24">
            <div className="flex flex-wrap justify-between mb-3 items-center gap-2"><h2 className="font-black text-[14px] text-[#d4af37] break-words whitespace-normal">Page 3 - Final Estimate</h2><button onClick={()=>setPhase(2)} className="text-[12px] px-3 py-1 rounded-full bg-white/10 border border-white/10 whitespace-nowrap">Back</button></div>
            <div className="bg-black/60 border border-[#d4af37]/20 rounded-[16px] p-3 mb-3"><div className="text-[12px] font-black text-[#d4af37]">Total Breakup</div><div className="text-[12px] text-white/80 mt-1">{v26BreakupText}</div><div className="text-[12px] text-cyan-300 mt-1">{getV26BuiltUpBreakup(groundPlate, tcaV20, plotNum, covPct)} | {getV26GstText(gstOn, ownerChargeBaseFinal)}</div></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-black/60 rounded-2xl p-1 border border-[#d4af37]/20 mb-3">
              <button onClick={()=>setViewMode("owner")} className={`px-2 py-1.5 rounded-full text-[12px] font-black whitespace-nowrap min-w-0 ${viewMode==="owner"?"bg-white text-black":"text-white/70"}`}>Owner: {worldMode==="custom" ? filteredOwnerMats.length : filteredOwnerForDisplay.length} Items</button>
              <button onClick={()=>setViewMode("contractor")} className={`px-2 py-1.5 rounded-full text-[12px] font-black whitespace-nowrap min-w-0 ${viewMode==="contractor"?"bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black":"text-white/70"}`}>Contractor: {filteredContractorMats.length} Items</button>
              <button onClick={()=>setQrShow(!qrShow)} className="px-2 py-1.5 rounded-full text-[12px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 whitespace-nowrap min-w-0">QR {qrShow ? "Hide" : "Show"}</button>
              <button onClick={()=>setGstOn(!gstOn)} className={`px-2 py-1.5 rounded-full text-[12px] font-black border whitespace-nowrap min-w-0 ${gstOn?'bg-[#d4af37] text-black':'bg-white/10 text-white/70'}`}>{gstOn?'GST ON':'GST OFF'}</button>
            </div>
            {worldMode==="custom" && (
              <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-[16px] p-3 mb-3">
                <div className="text-[12px] font-black text-[#d4af37] mb-2">Item Rate - Tick karo: Owner dega ya Contractor dega?</div>
                <div className="text-[12px] text-white/70 mb-2">Tick khali hai to Total Rs.0 hoga. Jitna Tick karoge utna hi Total banega.</div>
                <div className="flex gap-2"><button onClick={()=>setCustomTick({})} className="px-3 py-1.5 rounded-full text-[12px] font-black bg-white/10 border border-white/20">Clear All - 0 / 0</button><span className="text-[12px] py-1.5">Owner: {filteredOwnerMats.length} Items | Contractor: {filteredContractorMats.length} Items | Total: Rs.{inr(finalTotal)}</span></div>
              </div>
            )}
            <div className="max-h-[58vh] overflow-y-auto rounded-xl bg-black/30 p-2 border border-white/5">{(viewMode==="owner" ? filteredOwnerForDisplayFinal : filteredFinalMaterials).map((m:any, idx:number)=>{
              const realIdx = finalMaterials.findIndex((fm:any)=>fm.id===m.id); const unit = getUnitForId(m.id); const sNo = idx+1; const cleanName = (m.name || "").replace(/^\d+\.?\s*/,'').replace(/^\d+\.\s*\d+\.\s*/,''); let displayQty = m.qty; if(m.id==="pop") displayQty = Math.round(tcaV20*0.75); if(m.id==="sanitary") displayQty = (parseInt(storeys)||1)*2;
              return (<div key={m.id} className="flex flex-col gap-2 bg-gradient-to-r from-white/[0.06] to-white/[0.03] rounded-[14px] px-3 py-3 text-[12px] mb-2 border border-white/10"><div className="flex justify-between items-start gap-2"><span className="flex-1 min-w-0 flex gap-2 items-start"><span className="text-[#d4af37] font-black shrink-0 mt-0.5">{sNo}.</span><span className="flex-1 min-w-0 break-words whitespace-normal leading-[1.4]">{cleanName} - Qty: {displayQty} {unit} x Rate: Rs.{m.rate} / {unit}</span></span><div className="flex flex-wrap gap-2 items-center shrink-0"><span className="font-black break-words whitespace-nowrap">Rs.{inr(displayQty*m.rate)}</span><button onClick={()=>setEdit({idx:realIdx, qty:displayQty, rate:m.rate, company:m.company||"", cat:m.cat, id:m.id})} className="bg-white text-black px-3 py-1 rounded-full text-[12px] font-black whitespace-nowrap">Edit</button></div></div>
              {worldMode==="custom" && (
                <div className="flex gap-2 pl-5">
                  <button onClick={()=>setCustomTick((prev:any)=>({...prev, [m.id]:"owner"}))} className={`px-3 py-1 rounded-full text-[12px] font-black border ${customTick[m.id]==="owner" ? "bg-white text-black" : "bg-black/40 text-white/70"}`}>Owner Degega {customTick[m.id]==="owner" ? "✓" : ""}</button>
                  <button onClick={()=>setCustomTick((prev:any)=>({...prev, [m.id]:"contractor"}))} className={`px-3 py-1 rounded-full text-[12px] font-black border ${customTick[m.id]==="contractor" ? "bg-[#d4af37] text-black" : "bg-black/40 text-white/70"}`}>Contractor Degega {customTick[m.id]==="contractor" ? "✓" : ""}</button>
                  {customTick[m.id] && (<button onClick={()=>setCustomTick((prev:any)=>{ const n={...prev}; delete n[m.id]; return n; })} className="px-2 py-1 rounded-full text-[12px] bg-red-500/20 text-red-300">✕ Hataye</button>)}
                </div>
              )}
              </div>)
            })}
            </div>
            <div className="mt-3 bg-gradient-to-r from-[#d4af37]/15 to-[#f0d060]/10 border border-[#d4af37]/30 rounded-[16px] p-3"><div className="flex flex-wrap justify-between gap-2 text-[12px] font-black"><span className="text-[#d4af37] break-words whitespace-normal">Built-up {tcaV20} Sqft ({sqmt} Sqmt) - POP {Math.round(tcaV20*0.75)} - Sanitary {(parseInt(storeys)||1)*2}</span></div><div className="flex flex-wrap justify-between gap-2 mt-2 bg-black/60 rounded-2xl px-4 py-2.5 border border-[#d4af37]/20"><span className="text-[12px] font-black text-[#d4af37] break-words whitespace-normal">Profit {profitPercent}% : Rs.{inr(profitFinal)} - Final: Rs.{inr(finalTotal)} - {getV26GstText(gstOn, ownerChargeBaseFinal)}</span></div></div>
            {edit && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"><div className="bg-gradient-to-br from-[#1e293b] to-[#141a2a] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[360px]"><h3 className="font-black text-[13px] mb-3 text-[#d4af37] break-words whitespace-normal">Edit - {finalMaterials[edit.idx]?.id.toUpperCase()}</h3><div className="space-y-3"><div><div className="text-[12px] opacity-70 font-bold break-words whitespace-normal">Company / Brand - 5 Options - {geo}</div><select value={edit.company} onChange={e=>{ const newCompany = e.target.value; const k1 = (edit.id || "").toLowerCase().trim(); const k2 = (edit.cat || "").toLowerCase().trim(); const list = (COMPANY_MASTER[k1] || COMPANY_MASTER[k2] || []).slice(0,5); if(list.length===0) { setEdit({...edit, company:newCompany}); return; } const oldBrand = list.find((c:any)=>c.name===edit.company) || list[0]; const newBrand = list.find((c:any)=>c.name===newCompany) || list[0]; const cityRateForEdit = getCityRate(geo); const currentBaseMarketRate = oldBrand.mult ? (edit.rate / oldBrand.mult) : edit.rate; const cityBase = currentBaseMarketRate / getPureLiveFactor(cityRateForEdit); const newLiveMarketRate = getAnyMaterialLive(cityRateForEdit, cityBase, newBrand.mult); setEdit({...edit, company:newCompany, rate:newLiveMarketRate}); }} className="w-full bg-black/50 border border-[#d4af37]/40 rounded-full px-4 py-3 text-[13px] font-bold break-words whitespace-normal"><option value={edit.company}>{edit.company} - Rs.{edit.rate}</option>{(COMPANY_MASTER[edit.id]||COMPANY_MASTER[edit.cat]||COMPANY_MASTER["cement"]).slice(0,5).map((c:any)=><option key={c.name} value={c.name}>{c.name} - {c.label}</option>)}</select></div><div><div className="text-[12px] opacity-70 font-bold break-words whitespace-normal">Quantity</div><input type="number" value={edit.qty} onChange={e=>setEdit({...edit, qty: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-cyan-400/30 rounded-full px-4 py-3 text-[13px] font-bold" /><div className="text-[12px] text-cyan-300 mt-1 break-words whitespace-normal">{edit.id==="pop"?`Built-up ${tcaV20} x 75% = ${Math.round(tcaV20*0.75)}`:`Floors ${storeys} x 2 = ${edit.qty}`}</div></div><div><div className="text-[12px] opacity-70 font-bold break-words whitespace-normal">Rate</div><input type="number" value={edit.rate} onChange={e=>setEdit({...edit, rate: parseInt(e.target.value)||0})} className="w-full bg-[#d4af37]/15 border border-[#d4af37]/50 rounded-full px-4 py-3 text-[15px] font-black text-[#f0d060]" /><div className="text-[12px] text-white/70 mt-1">Total: Rs.{inr(edit.qty*edit.rate)} - {edit.id} - {getUnitForId(edit.id)}</div></div></div><div className="flex gap-2 mt-4"><button onClick={()=>setEdit(null)} className="flex-1 bg-white/10 border border-white/10 rounded-full py-3 text-[12px] font-bold">Cancel</button><button onClick={applyEdit} className="flex-[2] bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-black font-black py-3 rounded-full text-[12px]">Save Edit</button></div></div></div>)}
            {boxEditModal && (<div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"><div className="bg-[#1e293b] border border-[#d4af37]/30 rounded-[20px] p-5 w-full max-w-[360px]"><h3 className="font-black text-[13px] mb-3 text-[#d4af37]">Edit - {boxEditModal.type}</h3><input value={boxEditModal.value} onChange={e=>setBoxEditModal({...boxEditModal, value:e.target.value})} type="number" className="w-full bg-black/50 border border-[#d4af37]/40 rounded-full px-4 py-3 text-[15px] font-black" /><div className="flex gap-2 mt-4"><button onClick={()=>setBoxEditModal(null)} className="flex-1 bg-white/10 rounded-full py-3 text-[12px] font-bold">Cancel</button><button onClick={applyBoxEditModal} className="flex-[2] bg-[#d4af37] text-black font-black py-3 rounded-full text-[12px]">Save</button></div></div></div>)}
            {qrShow && (<div className="mt-3 bg-black/60 border border-cyan-400/30 rounded-[16px] p-3 text-center"><div className="text-[12px] font-black text-cyan-300">QR Verification - {geo} - {tcaV20} Sqft - Rs.{inr(finalTotal)}</div><div className="text-[12px] text-white/70 mt-1">PDF me QR verify hoga. Date: {lastUpdate}</div></div>)}
            <div className="flex gap-2 mt-4"><button onClick={handleWhatsApp} className="flex-1 bg-[#25D366] text-black font-black py-3.5 rounded-full text-[12px]">WhatsApp Share</button><button onClick={handlePDF} className="flex-1 bg-white text-black font-black py-3.5 rounded-full text-[12px]">Download PDF</button></div>
            <div className="text-center text-[12px] text-white/50 mt-3">ABuildWise - {getContractorLabelFixed(worldModeConfig)} - {geo} - {lastUpdate} - Valid 15 Days</div>
            <div className="text-center text-[12px] text-yellow-200/80 mt-2">{T.disclaimer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
