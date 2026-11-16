"use client";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";

const COMPANY = { name:"ABuildWise Construction" };
type Lang = "en" | "hi";
const T = {
  en: {
    appTitle: "Estimate", final: "Final", download: "Download PDF", whatsapp: "WhatsApp", save: "Save Quote", newQuote: "New Quote",
    clientName: "Client Name * Required", clientPhone: "Client Phone * 10 Digit",
    page1: "Page 1 - Contract + Plot + BHK", page2: "Page 2 - Location + Package", page3: "Page 3 - Final",
    nextLoc: "Next - Location →", nextFinal: "Next - Final →", back: "Back",
    paymentTitle: "Payment", timeline: "Timeline", valid: "Valid",
    notInc: "NOT Included: Govt Approval, Borewell, Compound Wall, Furniture, Interior",
    termsTitle: "TERMS & CONDITIONS:",
    pay1: "30% On Plinth Completion", pay2: "30% On Slab Completion", pay3: "30% On Plaster Completion", pay4: "10% On Handover",
    terms: [
      "Validity: This estimate is valid for 30 days from date of issue.",
      "Scope: Only BOQ items included. Extra work charged separately.",
      "Approvals: Govt approvals, map passing, NOC are client's responsibility.",
      "Site Facilities: Client to provide site access, water, electricity & storage.",
      "Price Variation: If material prices rise above 5%, difference adjusted.",
      "Payment: 30% On Plinth, 30% On Slab, 30% On Plaster, 10% On Handover. Delay beyond 7 days may pause work.",
      "Timeline: Approximate, subject to weather & timely payments.",
      "Warranty: 1 Year Structural Warranty from handover.",
      "Exclusions: Borewell, Compound Wall, Furniture, Interior, Govt Fees not included.",
      "Dispute Resolution: Jurisdiction - Nagpur, Maharashtra, India."
    ],
    scan: "Scan to Chat on WhatsApp", history: "History", noHistory: "No history yet",
    withMat: "With Material - Turnkey", withoutMat: "Without Material - Centering + Labour",
    labourOnly: "Labour Only", itemRate: "Item - Item Rate", gstExtra: "GST Extra",
    boqOk: "BOQ Sum = Grand Total - No Difference",
    onlyLabourDesc: "Only Mistri/Beldar - No Ply/Batta - No Extra Labour",
    itemDesc: "Separate Rate For Each Work - Brickwork / Plaster / Flooring Separate - No Extra Labour",
    bhkSelect: "BHK - Select Only One",
    onlyNumber: "Only Number", selected: "Selected",
    searchCity: "Search City - Type any letter to find city",
    stateLabel: "State - Auto From GPS | Any village name will make rate from State",
    sitePhotoLabel: "Site Photo Upload - Will also go in PDF",
    photoSelected: "Photo Selected", profitLabel: "Profit", gstOnLabel: "GST ON - CGST 9% + SGST 9%", gstOffLabel: "GST OFF - GST Extra",
    approx: "Approximate. Final may vary 10-15%. Valid till",
    clientSign: "Client", contractorSign: "Contractor", stamp: "Stamp", signDate: "Signature & Date", companySeal: "Company Seal",
    signHint: "Sign here with finger only - Photo not allowed", uploadPhoto: "Upload Photo", clear: "Clear",
    totalLabel: "Total", effectiveLabel: "Effective", inWordsLabel: "In Words"
  },
  hi: {
    appTitle: "अनुमान", final: "फाइनल", download: "पीडीएफ डाउनलोड करें", whatsapp: "व्हाट्सऐप", save: "सेव करें", newQuote: "नया कोट",
    clientName: "ग्राहक का नाम * जरूरी है", clientPhone: "ग्राहक का फोन * 10 अंक",
    page1: "पेज 1 - ठेका + प्लॉट + BHK", page2: "पेज 2 - लोकेशन + पैकेज", page3: "पेज 3 - फाइनल",
    nextLoc: "आगे - लोकेशन →", nextFinal: "आगे - फाइनल →", back: "पीछे",
    paymentTitle: "भुगतान", timeline: "समय", valid: "मान्य",
    notInc: "शामिल नहीं है: सरकारी अनुमति, बोरवेल, कंपाउंड वॉल, फर्नीचर, इंटीरियर",
    termsTitle: "नियम व शर्तें:",
    pay1: "30% प्लिंथ पूरा होने पर", pay2: "30% स्लैब पूरा होने पर", pay3: "30% प्लास्टर पूरा होने पर", pay4: "10% हैंडओवर पर",
    terms: [
      "वैधता: यह अनुमान जारी होने की तारीख से 30 दिनों तक मान्य है।",
      "कार्यक्षेत्र: केवल BOQ वाले काम शामिल हैं। अतिरिक्त काम का शुल्क अलग से लगेगा।",
      "अनुमोदन: सरकारी अनुमति, नक्शा पासिंग, NOC ग्राहक की जिम्मेदारी है।",
      "साइट सुविधा: ग्राहक साइट एक्सेस, पानी, बिजली व स्टोरेज देगा।",
      "मूल्य परिवर्तन: यदि मटीरियल के दाम 5% से ज्यादा बढ़े तो अंतर लिया जाएगा।",
      "भुगतान: 30% प्लिंथ, 30% स्लैब, 30% प्लास्टर, 10% हैंडओवर पर। 7 दिन से ज्यादा देरी पर काम रुक सकता है।",
      "समय: अनुमानित है, मौसम व समय पर भुगतान पर निर्भर है।",
      "वारंटी: हैंडओवर से 1 साल की स्ट्रक्चरल वारंटी।",
      "बाहर: बोरवेल, कंपाउंड वॉल, फर्नीचर, इंटीरियर, सरकारी फीस शामिल नहीं है।",
      "विवाद: न्यायालय क्षेत्र - नागपुर, महाराष्ट्र, भारत।"
    ],
    scan: "व्हाट्सऐप पर बात करने के लिए स्कैन करें", history: "हिस्ट्री", noHistory: "अभी कोई हिस्ट्री नहीं है",
    withMat: "मटीरियल सहित - टर्नकी", withoutMat: "बिना मटीरियल - सेंटरिंग + लेबर",
    labourOnly: "केवल लेबर", itemRate: "आइटम - आइटम रेट", gstExtra: "GST अलग से",
    boqOk: "BOQ Sum = Grand Total - Koi Fark Nahi",
    onlyLabourDesc: "Sirf Mistri/Beldar - Ply/Batta Nahi - No Extra Labour",
    itemDesc: "Har Kaam ka Alag Item Rate - Brickwork / Plaster / Flooring Alag - No Extra Labour",
    bhkSelect: "BHK - Ek hi chunenge",
    onlyNumber: "Sirf Number", selected: "Selected",
    searchCity: "Search City - B likho to B wali City aayegi",
    stateLabel: "State: GPS se Auto Aayega | Koi bhi Gaon likho toh State se Rate banega",
    sitePhotoLabel: "Site Photo Upload - PDF me bhi jayegi",
    photoSelected: "Photo Selected", profitLabel: "Profit", gstOnLabel: "GST ON - CGST 9% + SGST 9%", gstOffLabel: "GST OFF - GST Extra",
    approx: "Approximate. Final may vary 10-15%. Valid till",
    clientSign: "ग्राहक", contractorSign: "ठेकेदार", stamp: "मुहर", signDate: "हस्ताक्षर व तारीख", companySeal: "कंपनी की मुहर",
    signHint: "Yahan sirf ungli se sign karo - Photo mat daalo", uploadPhoto: "Photo Upload", clear: "Clear",
    totalLabel: "Total", effectiveLabel: "Effective", inWordsLabel: "In Words"
  }
};
const STATE_BASE_7935: Record<string, number> = {
  "maharashtra": 2000, "madhya pradesh": 1650, "uttar pradesh": 1750,
  "gujarat": 2100, "rajasthan": 1800, "delhi": 3200, "karnataka": 2400,
  "tamil nadu": 2300, "telangana": 2400, "andhra pradesh": 2200,
  "west bengal": 1900, "bihar": 1600, "odisha": 1650, "assam": 1700,
  "punjab": 2100, "haryana": 2200, "kerala": 2600, "jharkhand": 1600,
  "chhattisgarh": 1650, "uttarakhand": 1900, "himachal pradesh": 2000,
  "goa": 2800, "jammu and kashmir": 1900
};
const METRO_7935 = ["mumbai","delhi","bangalore","bengaluru","hyderabad","chennai","pune","kolkata","ahmedabad","nagpur","thane","nashik","aurangabad","indore","bhopal","jaipur","lucknow","kanpur","surat"];
function get7935AutoRate(city: string, stateName: string): number {
  const c = city.toLowerCase().trim();
  const s = (stateName||"").toLowerCase().trim();
  const base = STATE_BASE_7935[s] || 1700;
  if (METRO_7935.includes(c)) return Math.round(base * 1.25);
  return Math.round(base * 0.85);
}
const CITY_RATES: Record<string, number> = { mumbai: 3300, thane: 3100, pune: 2800, nagpur: 2000, nashik: 2400, aurangabad: 2300, "delhi ncr": 3200, bangalore: 3000, hyderabad: 2900, indore: 2200, bhopal: 2100, pohegaon: 1350, kopargaon: 1380, shirdi: 1420, ahmednagar: 2100, balaghat: 1520, seoni: 1510, mandla: 1500,
  khamariya: 1402, khamaria: 1402, jabalpur: 2050, bhusawal: 2000, khandwa: 2050, burhanpur: 2020, jalgaon: 2100, dewas: 2150, waraseoni: 1525, katangi: 1515 };
const CITY_STATE_MAP: Record<string, string> = {
  mumbai: "Maharashtra", thane: "Maharashtra", pune: "Maharashtra", nagpur: "Maharashtra", nashik: "Maharashtra", aurangabad: "Maharashtra", ahmednagar: "Maharashtra", shirdi: "Maharashtra", kopargaon: "Maharashtra", pohegaon: "Maharashtra", bhusawal: "Maharashtra", jalgaon: "Maharashtra",
  indore: "Madhya Pradesh", bhopal: "Madhya Pradesh", jabalpur: "Madhya Pradesh", dewas: "Madhya Pradesh", khandwa: "Madhya Pradesh", burhanpur: "Madhya Pradesh",
  balaghat: "Madhya Pradesh", seoni: "Madhya Pradesh", mandla: "Madhya Pradesh", waraseoni: "Madhya Pradesh", katangi: "Madhya Pradesh", khamariya: "Madhya Pradesh", khamaria: "Madhya Pradesh",
  "delhi ncr": "Delhi", bangalore: "Karnataka", bengaluru: "Karnataka", hyderabad: "Telangana", chennai: "Tamil Nadu", kolkata: "West Bengal", ahmedabad: "Gujarat", surat: "Gujarat", jaipur: "Rajasthan", lucknow: "Uttar Pradesh", kanpur: "Uttar Pradesh"
};
function getStateForCity(city: string, gpsState: string){
  const k = city.toLowerCase().trim();
  if (CITY_STATE_MAP[k]) return CITY_STATE_MAP[k];
  return gpsState;
}
const CITIES = Object.keys(CITY_RATES).map(k=>k.charAt(0).toUpperCase()+k.slice(1));
function getRate(city: string, stateName: string = ""){ 
  const k = city.toLowerCase().trim();
  if (CITY_RATES[k]) return CITY_RATES[k];
  if (stateName) return get7935AutoRate(k, stateName);
  return 1700; 
}
function inr(n:number){ return (Number(n)||0).toLocaleString("en-IN"); }
function maskPhone(p:string){ if(!p || p.length<4) return "__________"; return p.slice(0,5) + "XXXXX"; }
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
type Mat = { id:string; name:string; qty:number; rate:number; baseRate:number; company:string; companies:string[]; mult:number[]; cat:string; owner:boolean; unit:string; factor:number; displayFactor:string };
const COMP: Record<string,string[]> = {
  cement:["UltraTech OPC 43","ACC OPC 43","Ambuja OPC 43","Shree OPC 43"],
  steel:["Kamdhenu Fe500","Tata Tiscon Fe500","JSW Neosteel Fe500","Jindal Panther Fe500"],
  bricks:["Biltech AAC","Magicrete AAC","Renacon AAC","Local AAC"],
  sand:["M-Sand Local","River Sand","Crushed Sand","Plaster Sand"],
  aggregate:["20mm Local","40mm Local","10mm Local","Dust"],
  electrical:["Polycab","Havells","Finolex","RR Kabel"],
  plumbing:["Ashirvad CPVC","Astral CPVC","Supreme CPVC","Prince CPVC"],
  tiles:["Kajaria 2x2","Johnson 2x2","Somany 2x2","Orient Bell"],
  marble:["Italian Statuario","Italian Carrara","Italian Botticino","Indian Marble"],
  paint:["Asian Paints Apex","Berger WeatherCoat","Nerolac Excel","Dulux Weathershield"],
  waterproofing:["Dr Fixit","Fosroc","Pidilite","Sika"],
  doors:["Teak Wood","Sagwan Wood","WPC Door","Flush Door"],
  windows:["Jindal Aluminium","Fenesta UPVC","Tata Pravesh","Local Aluminium"],
  glass:["Saint-Gobain","Asahi Glass","Modi Glass","Local Glass"],
  railing:["Jindal SS304","Tata SS304","Sail SS304","Local SS202"],
  pop:["Gyproc POP","Birla White POP","JK POP","Local POP"],
  sanitary:["Cera","Hindware","Jaquar","Parryware"],
  ply:["Kitply 12mm","Century Ply","Greenply","Local Ply"],
  batta:["Sagwan Batta","Sal Batta","Eucalyptus Batta","Local Batta"],
  jack:["MS Jack Prop","Heavy Jack","Medium Jack","Rental Jack"],
  mistri:["Mistri Standard","Senior Mistri","Mistri + Helper","Contract Mistri"],
  beldar:["Beldar Standard","Senior Beldar","Helper","Contract Beldar"],
  curing:["Local Curing","Pond Curing","Spray Curing","Gunny Curing"],
  contingency:["Site Supervision","Site Engineer","Supervisor","Self Supervision"],
  lift:["OTIS","KONE","Schindler","Johnson"],
};
const MULT = [1, 0.96, 1.07, 0.90];
const BASE_MATS = (built:number, cityRate:number, bhk:number, storeysNum:number, pkgRate:number, contract:string): Mat[] => {
  const doorsQty = bhk===1 ? 6 : bhk===2 ? 8 : 10;
  const f = (cityRate/2000) * (pkgRate/2000);
  const fCity = cityRate/2000;
  const curingDays = 14 + (storeysNum * 7);
  const labourDays = Math.round(built * 0.10);
  const mk = (id:string, name:string, qty:number, base:number, cat:string, owner:boolean, unit:string, factor:number, displayFactor:string):Mat => ({ id, name, qty, rate: Math.round(base), baseRate: Math.round(base), company: COMP[cat][0], companies: COMP[cat], mult: MULT, cat, owner, unit, factor, displayFactor });
  const all: Mat[] = [
    mk("cement","Cement", Math.round(built*0.20), 359*f, "cement", true, "Bags", 0.20, "0.20 Bags / Sqft"),
    mk("steel","Steel", Math.round(built*2.70), 68*f, "steel", true, "Kg", 2.70, "2.70 Kg / Sqft"),
    mk("bricks","Bricks - AAC", Math.round(built*5), 71*f, "bricks", true, "Nos", 5, "5 Nos / Sqft"),
    mk("sand","M-Sand", Math.round(built*0.55), 45*f, "sand", true, "Cft", 0.55, "0.55 Cft / Sqft"),
    mk("aggregate","Aggregate 20mm", Math.round(built*0.48), 38*f, "aggregate", true, "Cft", 0.48, "0.48 Cft / Sqft"),
    mk("electrical","Electrical", Math.round(built*0.80), 85*f, "electrical", true, "Sqft", 0.80, "80% of Built-up"),
    mk("plumbing","Plumbing", Math.round(built*0.80), 90*f, "plumbing", true, "Sqft", 0.80, "80% of Built-up"),
    mk("tiles","Tiles", Math.round(built*0.85), 110*f, "tiles", true, "Sqft", 0.85, "85% of Built-up"),
    mk("marble","Italian Marble", Math.round(built*0.85), 350*f, "marble", true, "Sqft", 0.85, "85% of Built-up"),
    mk("paint","Paint", Math.round(built*0.12), 220*(pkgRate/2000), "paint", true, "Ltr", 0.12, "0.12 Ltr / Sqft"),
    mk("waterproofing","Waterproofing", Math.round(built*0.50), 45*fCity, "waterproofing", true, "Sqft", 0.50, "50% of Built-up"),
    mk("doors","Doors", doorsQty, 12000*(pkgRate/2000)*fCity, "doors", true, "Nos", 0, "Fixed Nos - BHK"),
    mk("windows","Windows", bhk===1?6:bhk===2?8:10, 8500*(pkgRate/2000)*fCity, "windows", true, "Nos", 0, "Fixed Nos - BHK"),
    mk("glass","Glass", Math.round(built*0.15), 180*fCity, "glass", true, "Sqft", 0.15, "15% of Built-up"),
    mk("railing","Railing SS304", Math.round(built*0.12), 450*fCity, "railing", true, "Rft", 0.12, "0.12 Rft / Sqft"),
    mk("pop","POP / Ceiling", Math.round(built*0.75), 55*fCity, "pop", true, "Sqft", 0.75, "75% of Built-up"),
    mk("sanitary","Sanitary", bhk, 8500*(pkgRate/2000)*fCity, "sanitary", true, "Set", 0, "1 Set / Bathroom"),
    mk("ply","Ply - Centering", Math.round(built*0.90), 95*fCity, "ply", false, "Sqft", 0.90, "90% of Built-up"),
    mk("batta","Batta - Sagwan", Math.round(built*0.60), 65*fCity, "batta", false, "Rft", 0.60, "0.60 Rft / Sqft"),
    mk("jack","Jack Prop", Math.round(built*0.08), 120*fCity, "jack", false, "Nos", 0.08, "0.08 Nos / Sqft"),
    mk("mistri","Mistri", labourDays, 750*fCity, "mistri", false, "Days", 0.10, "Same as Beldar"),
    mk("beldar","Beldar", labourDays, 500*fCity, "beldar", false, "Days", 0.10, "Same as Mistri"),
    mk("curing","Curing", curingDays, 800*fCity, "curing", false, "Days", 0, "14 + 7 / Floor"),
    mk("contingency","Contingency + Supervision", built, 25*fCity, "contingency", false, "Sqft", 1, "100% of Built-up"),
    mk("lift","Lift", storeysNum>1 ? 1 : 0, 850000*fCity, "lift", false, "Nos", 0, "1 No if G+1+"),
  ];
  if(contract==="labour") return all.filter(m=> ["mistri","beldar","curing","contingency"].includes(m.id));
  return all.filter(m=> !(m.id==="lift" && m.qty===0));
};
// ZERO KAMI FIX: Signature - sirf finger, photo upload hataya
function SignatureBox({ label, value, onChange, hint, clearLabel }: any) {
  const canvasRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const getPos = (e:any, canvas:any) => { const rect = canvas.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) }; };
  const startDraw = (e:any) => { const canvas = canvasRef.current; if(!canvas) return; const ctx = canvas.getContext("2d"); ctx.strokeStyle = "#000"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; const p = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(p.x, p.y); setIsDrawing(true); };
  const draw = (e:any) => { if(!isDrawing) return; e.preventDefault(); const canvas = canvasRef.current; const ctx = canvas.getContext("2d"); const p = getPos(e, canvas); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const endDraw = () => { if(!isDrawing) return; setIsDrawing(false); if(canvasRef.current) onChange(canvasRef.current.toDataURL()); };
  const clear = () => { onChange(""); const c = canvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); };
  return (
    <div className="bg-white text-black rounded-xl p-3 border min-w-0">
      <p className="font-bold text-center text-sm break-words">{label}</p>
      {value ? <img src={value} alt="sign" className="h-[90px] w-full object-contain bg-white border rounded my-2" /> : <canvas ref={canvasRef} width={260} height={90} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} className="w-full h-[90px] bg-[#fffbe6] border border-dashed rounded my-2 touch-none" />}
      <p className="text-[11px] text-center text-gray-500 break-words">{hint}</p>
      <button onClick={clear} className="w-full mt-2 bg-red-100 text-red-600 text-xs py-2 rounded break-words">❌ {clearLabel}</button>
    </div>
  );
}
export default function Page(){
  const [lang,setLang] = useState<Lang>("en");
  const t = T[lang];
  const [phase,setPhase]=useState(1);
  const [geo,setGeo]=useState("Nagpur");
  const [geoState,setGeoState]=useState("Maharashtra");
  const [showCityDrop,setShowCityDrop]=useState(false);
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
  const [contract,setContract]=useState<"full"|"centring"|"labour"|"item">("centring");
  const [gpsOk,setGpsOk]=useState(false);
  const [history,setHistory]=useState<any[]>([]);
  const [pkgOverride, setPkgOverride] = useState<{basic?:number, standard?:number, premium?:number}>({});
  const [editPkg,setEditPkg]=useState<null|"basic"|"standard"|"premium">(null);
  const [eRate,setERate]=useState("");
  const [mats,setMats]=useState<Mat[]>([]);
  const [editMat,setEditMat]=useState<number|null>(null);
  const [eQty,setEQty]=useState(""); const [eMatRate,setEMatRate]=useState("");
  const [sitePhoto,setSitePhoto]=useState<string>("");
  const [quoteNo,setQuoteNo]=useState("AW-2026-0000");
  const [today,setToday]=useState("");
  const [validTill,setValidTill]=useState("");
  const [compPhone,setCompPhone]=useState("");
  const [compEmail,setCompEmail]=useState("");
  const [compAddress,setCompAddress]=useState("");
  const [compWebsite,setCompWebsite]=useState("");
  const [compGstin,setCompGstin]=useState("");
  const [compLogo,setCompLogo]=useState<string>("");
  const [clientSign,setClientSign]=useState<string>("");
  const [contractorSign,setContractorSign]=useState<string>("");
  const editedIds = useRef<Set<string>>(new Set());
  const cityRate = getRate(geo, geoState);
  const plotNum = parseInt(plot)||0;
  const ground = Math.round(plotNum*cov/100);
  const builtRaw = ground*(parseInt(storeys)||1);
  const extra = Math.round(builtRaw*0.15);
  const built115 = builtRaw + extra;
  const pkgRates = {
    basic: pkgOverride.basic ?? Math.round(cityRate * 0.82),
    standard: pkgOverride.standard ?? cityRate,
    premium: pkgOverride.premium ?? Math.round(cityRate * 1.38),
  };
  const pkgRate = pkgRates[pkg as keyof typeof pkgRates];
  const sqmt = (built115*0.092903).toFixed(1);
  const storeysNum = parseInt(storeys)||1;
  const filteredCities = geo.trim() ? CITIES.filter(c=>c.toLowerCase().includes(geo.toLowerCase().trim())).sort((a,b)=>a.toLowerCase().indexOf(geo.toLowerCase().trim()) - b.toLowerCase().indexOf(geo.toLowerCase().trim())) : CITIES;
  const rebuildBOQ = (preserve:boolean=true)=>{
    const fresh = BASE_MATS(built115, cityRate, bhk, storeysNum, pkgRate, contract);
    if(preserve && mats.length>0){
      const map = new Map(mats.map(m=>[m.id,m]));
      const merged = fresh.map(fm=>{ const old = map.get(fm.id); if(old && editedIds.current.has(fm.id)) return {...fm, qty: old.qty, rate: old.rate, company: old.company}; return fm; });
      setMats(merged);
    } else setMats(fresh);
  };
  const ownerMats = mats.filter(m=>m.owner);
  const contMats = mats.filter(m=>!m.owner);
  const ownerCost = ownerMats.reduce((s,m)=>s+m.qty*m.rate,0);
  const contCost = contMats.reduce((s,m)=>s+m.qty*m.rate,0);
  const labourRate = contract==="full" ? 550 : contract==="centring" ? 450 : 0;
  const labourCost = built115*labourRate;
  const subTotal = ownerCost + contCost + labourCost;
  const profit = Math.round(subTotal*(profitP/100));
  const baseTotal = subTotal + profit;
  const cgst = gstOn ? Math.round(baseTotal*0.09) : 0;
  const sgst = gstOn ? Math.round(baseTotal*0.09) : 0;
  const gstAmt = cgst+sgst;
  const finalTotal = baseTotal + gstAmt;
  const gstExtraAmt = Math.round(baseTotal * 0.18);
  const totalWithGstExtra = baseTotal + gstExtraAmt;
  const displayTotal = gstOn ? finalTotal : baseTotal;
  const effRate = Math.round(displayTotal/(built115||1));
  const timeline = storeys==="1" ? "G+0 = 6 Months" : `G+${storeysNum-1} = ${6+(storeysNum-1)*3} Months`;
  const list = view==="owner" ? ownerMats : view==="contractor" ? contMats : mats;
  const pay30 = Math.round(displayTotal*0.30);
  const pay10 = displayTotal - (pay30*3);
  const changeCompany = (matId:string, idx:number)=>{
    const nm = mats.map(m=>{ if(m.id!==matId) return m; const newRate = Math.round(m.baseRate * m.mult[idx]); editedIds.current.add(m.id); return {...m, company: m.companies[idx], rate: newRate}; });
    setMats(nm);
  };
  const savePkg = ()=>{ const r=parseInt(eRate); if(!r||r<=0) return alert("Sahi Rate dalo"); setPkgOverride(p=>({...p,[editPkg as string]:r})); setEditPkg(null); };
  const saveMat = (idx:number)=>{ const q=parseInt(eQty), r=parseInt(eMatRate); if(!q||!r) return; const nm=[...mats]; const realIdx = mats.findIndex(m=>m===list[idx]); nm[realIdx]={...nm[realIdx],qty:q,rate:r}; editedIds.current.add(nm[realIdx].id); setMats(nm); setEditMat(null); };
  const gps = ()=>{ if(!navigator.geolocation) return alert("GPS not supported"); navigator.geolocation.getCurrentPosition(async(pos)=>{ setGpsOk(true); try{ const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d=await res.json(); const c=d.address?.city||d.address?.town||d.address?.village||d.address?.hamlet||geo; const stRaw=d.address?.state||geoState; const st=getStateForCity(c, stRaw); setGeo(c); setGeoState(st); setPkgOverride({}); }catch(e){ setGeo(geo); } },()=>alert("GPS Denied")); };
  const validate = ()=>{ if(!cname.trim()){ alert(lang==="hi"?"Pehle Client Name bhare":"Please enter Client Name"); return false; } if(cphone.length!==10||isNaN(Number(cphone))){ alert("Phone 10 Digit ka hona chahiye"); return false; } if(!plot || isNaN(Number(plot)) || plotNum<=0){ alert("Plot me sirf Number dalo, 0 nahi"); return false; } if(cov<10||cov>90){ alert("Coverage 10% se 90% ke beech hona chahiye"); return false; } return true; };
  const saveEst = ()=>{ if(!validate()) return; const e={name:cname||"No Name",geo,built:built115,total:displayTotal,gstMode:gstOn?"With GST":"GST Extra",date:today,quoteNo}; const nh=[e,...history].slice(0,10); setHistory(nh); try{ localStorage.setItem("aw_history",JSON.stringify(nh)); }catch(e){} alert(`Estimate Save - Quote ${quoteNo}`); const nq=makeQuote(); setQuoteNo(nq); try{ localStorage.setItem("aw_quote",nq); }catch(e){} };
  const wa = ()=>{ const t2=`${COMPANY.name} ${quoteNo} - ${cname||geo} - ${geo} - ${bhk} BHK - Built ${built115} Sqft - ${contract} - Total Rs.${inr(displayTotal)} ${gstOn?"With GST":t.gstExtra} - Valid ${validTill} - ${inWords(displayTotal)}`; window.open(`https://wa.me/?text=${encodeURIComponent(t2)}`,"_blank"); };
  const pdf = async ()=>{
    if(!clientSign || !contractorSign){ alert(lang==="hi" ? "Pehle Client aur Contractor dono sign karo, tabhi PDF banegi" : "Please add both Client and Contractor signatures before downloading PDF"); return; }
    if(!validate()) return;
    if(!compPhone.trim() || !compAddress.trim() || !compWebsite.trim() || !compGstin.trim()){ alert(lang==="hi"?"Pehle upar Company Phone / Address / Website / GSTIN bhare, tabhi PDF banegi":"Please fill Company Phone, Address, Website and GSTIN above before PDF"); return; }
    const doc=new jsPDF();
    const isHi = lang==="hi";
    const DISPLAY_PHONE = compPhone;
    const DISPLAY_EMAIL = compEmail || compPhone;
    const DISPLAY_ADDRESS = compAddress;
    const DISPLAY_WEBSITE = compWebsite;
    const DISPLAY_GSTIN = compGstin;
    doc.setFillColor(0,0,0); doc.rect(0,0,210,42,"F");
    if(compLogo){ try{ doc.addImage(compLogo, "JPEG", 14, 4, 18, 18); }catch(e){} }
    doc.setTextColor(212,175,55); doc.setFontSize(20); doc.setFont("helvetica","bold");
    const compNameLines = doc.splitTextToSize(COMPANY.name, 160);
    doc.text(compNameLines, compLogo ? 36 : 14, 14);
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","normal");
    const contactLines = doc.splitTextToSize(`Phone: ${DISPLAY_PHONE} | Email: ${DISPLAY_EMAIL}`, 170);
    doc.text(contactLines, compLogo ? 36 : 14, 24);
    const addrLines = doc.splitTextToSize(`Address: ${DISPLAY_ADDRESS}`, 170);
    doc.text(addrLines, compLogo ? 36 : 14, 30);
    const webLines = doc.splitTextToSize(`Website: ${DISPLAY_WEBSITE} | GSTIN: ${DISPLAY_GSTIN}`, 170);
    doc.text(webLines, compLogo ? 36 : 14, 35);
    doc.setTextColor(0,0,0);
    doc.setFontSize(10); doc.setFont("helvetica","bold");
    const quoteLines = doc.splitTextToSize(isHi ? `Quote No: ${quoteNo} | Date: ${today} | Valid Till: ${validTill} (30 Din)` : `Quote No: ${quoteNo} | Date: ${today} | Valid Till: ${validTill} (30 Days)`, 182);
    doc.text(quoteLines,14,48);
    const clientLines = doc.splitTextToSize(isHi ? `Graahak: ${cname||"Not Provided"} | Phone: ${maskPhone(cphone)}` : `Client: ${cname||"Not Provided"} | Phone: ${maskPhone(cphone)}`, 182);
    doc.text(clientLines,14,55);
    const plotLines = doc.splitTextToSize(`Plot ${plotNum} Sqft | Coverage ${cov}% | Ground ${ground} + 15% ${extra} = Built-up ${built115} Sqft (${sqmt} Sqmt)`, 182);
    doc.text(plotLines,14,62);
    const pkgLines = doc.splitTextToSize(`Package: ${pkg} Rs.${pkgRate} | ${bhk} BHK | ${getLabel(storeys)} | Mode: ${contract} | Timeline: ${timeline}`, 182);
    doc.text(pkgLines,14,69);
    doc.setFontSize(11);
    const grandLines = doc.splitTextToSize(gstOn ? `Grand Total: Rs. ${inr(finalTotal)}` : `Grand Total: Rs. ${inr(baseTotal)}`, 182);
    doc.text(grandLines,14,79);
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    const gstLine2 = doc.splitTextToSize(gstOn ? `(With GST - CGST Rs.${inr(cgst)} + SGST Rs.${inr(sgst)})` : `(+ 18% GST Extra = Rs. ${inr(totalWithGstExtra)})`, 182);
    doc.text(gstLine2,14,85);
    const wordsLines = doc.splitTextToSize(`In Words: ${inWords(displayTotal)}`, 182);
    doc.text(wordsLines,14,91);
    const effLines = doc.splitTextToSize(`Effective Rate: Rs.${effRate} / sqft | 1 Year Warranty | Price Lock 30 Days`, 182);
    doc.text(effLines,14,97);
    let y=105;
    if(sitePhoto){ try{ doc.addImage(sitePhoto, "JPEG", 14, y, 60, 35); doc.text("Site Photo", 80, y+10); y+=40; }catch(e){} }
    const drawTableHeader = (yy:number)=>{
      doc.setFillColor(212,175,55); doc.rect(14, yy, 182, 7, "F");
      doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(9);
      doc.text("No.",15,yy+5); doc.text(isHi?"Item":"Item",24,yy+5); doc.text("Qty",110,yy+5); doc.text("Rate",140,yy+5); doc.text("Amount",165,yy+5);
      return yy+7;
    };
    y = drawTableHeader(y);
    doc.setFont("helvetica","normal"); doc.setTextColor(0,0,0); doc.setFontSize(8);
    mats.forEach((m,i)=>{
      const fullName = `${m.name} - ${m.company}`;
      const nameLines = doc.splitTextToSize(fullName, 82);
      const rowH = Math.max(6, nameLines.length * 4.5 + 2);
      if(y + rowH > 250){ doc.addPage(); y=14; y = drawTableHeader(y); doc.setFont("helvetica","normal"); doc.setFontSize(8); }
      doc.text(`${i+1}.`,15,y+4);
      doc.text(nameLines,24,y+4);
      const qtyLines = doc.splitTextToSize(`${m.qty} ${m.unit}`, 28);
      doc.text(qtyLines,110,y+4);
      const rateLines = doc.splitTextToSize(`Rs.${m.rate}`, 24);
      doc.text(rateLines,140,y+4);
      const amtLines = doc.splitTextToSize(`Rs.${inr(m.qty*m.rate)}`, 30);
      doc.text(amtLines,165,y+4);
      y+=rowH;
    });
    y+=4; doc.setFont("helvetica","bold"); doc.setFontSize(9);
    const totalLines = doc.splitTextToSize(`Grand Total = Rs.${inr(displayTotal)}`,182);
    doc.text(totalLines,14,y); y+= totalLines.length*5+2;
    const payLine = isHi ? `Bhugtan: 30% Plinth Rs.${inr(pay30)} | 30% Slab Rs.${inr(pay30)} | 30% Plaster Rs.${inr(pay30)} | 10% Handover Rs.${inr(pay10)}` : `Payment: 30% On Plinth Rs.${inr(pay30)} | 30% On Slab Rs.${inr(pay30)} | 30% On Plaster Rs.${inr(pay30)} | 10% Handover Rs.${inr(pay10)}`;
    const payLines = doc.splitTextToSize(payLine, 182); doc.text(payLines,14,y); y += payLines.length*5+2;
    doc.setFont("helvetica","normal");
    const notIncLines = doc.splitTextToSize(t.notInc, 182); doc.text(notIncLines,14,y); y+=notIncLines.length*5+2;
    doc.setFont("helvetica","bold"); doc.setFontSize(10);
    const termsTitleLines = doc.splitTextToSize(t.termsTitle, 182); doc.text(termsTitleLines,14,y); y+=6;
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
    t.terms.forEach((term,idx)=>{ const lines = doc.splitTextToSize(`${idx+1}. ${term}`,182); if(y + lines.length*4.5 > 265){doc.addPage(); y=14;} doc.text(lines,14,y); y+=lines.length*4.5+1; });
    y+=8; doc.setFontSize(10);
    if(y+40>280){ doc.addPage(); y=14; }
    try{
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://wa.me/91${compPhone || "9823000000"}`;
      const qrImg = await fetch(qrUrl).then(r=>r.blob()).then(b=>new Promise<string>((res)=>{ const fr=new FileReader(); fr.onload=()=>res(String(fr.result)); fr.readAsDataURL(b); })).catch(()=> "");
      if(qrImg) doc.addImage(qrImg, "PNG", 150, y, 30, 30);
    }catch(e){}
    if(clientSign){ try{ doc.addImage(clientSign, "PNG", 14, y, 45, 18); }catch(e){} }
    if(contractorSign){ try{ doc.addImage(contractorSign, "PNG", 85, y, 45, 18); }catch(e){} }
    y+=22;
    const signLines = doc.splitTextToSize(isHi ? `Hastakshar: Graahak ${cname||""}` : `Signature: Client ${cname||""}`, 182);
    doc.text(signLines,14,y); y+=6;
    const signLines2 = doc.splitTextToSize(`Contractor __________  Stamp: __________  Date: ${today}`, 182);
    doc.text(signLines2,14,y);
    const totalPages = doc.getNumberOfPages();
    for(let p=1;p<=totalPages;p++){ doc.setPage(p); doc.setFontSize(8); doc.setTextColor(100,100,100); const footerLines = doc.splitTextToSize(`Page ${p} of ${totalPages} | ${quoteNo} | Total Rs.${inr(displayTotal)} | ${COMPANY.name}`, 182); doc.text(footerLines, 14, 290);
      doc.setTextColor(248,248,248); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text(COMPANY.name, 30, 150, { angle: 30 } as any); doc.setTextColor(100,100,100); doc.setFontSize(8);
    }
    doc.save(`${COMPANY.name}_${quoteNo}_${built115}.pdf`);
  };
  const newQuote = ()=>{ const q=makeQuote(); setQuoteNo(q); setCname(""); setCphone(""); setPlot("2000"); setCov(64); setStoreys("1"); setBhk(2); setPhase(1); setSitePhoto(""); setClientSign(""); setContractorSign(""); try{ localStorage.setItem("aw_quote",q); }catch(e){} alert(`Naya Quote: ${q}`); };
  useEffect(()=>{ setToday(new Date().toLocaleDateString("en-IN")); setValidTill(new Date(Date.now()+30*24*60*60*1000).toLocaleDateString("en-IN")); setQuoteNo(makeQuote()); },[]);
  useEffect(()=>{ rebuildBOQ(false); },[]);
  useEffect(()=>{ if(mats.length===0) return; const tt=setTimeout(()=>rebuildBOQ(true), 150); return ()=>clearTimeout(tt); },[geo,pkg,contract,bhk,storeys,plot,cov,pkgOverride, geoState]);
  useEffect(()=>{ try{ const h=JSON.parse(localStorage.getItem("aw_history")||"[]"); setHistory(Array.isArray(h)?h:[]); const d=JSON.parse(localStorage.getItem("aw_draft")||"{}"); if(d.cname) setCname(d.cname); if(d.cphone) setCphone(d.cphone);
    const c=JSON.parse(localStorage.getItem("aw_company")||"{}"); if(c.phone) setCompPhone(c.phone); if(c.email) setCompEmail(c.email); if(c.address) setCompAddress(c.address); if(c.website) setCompWebsite(c.website); if(c.gstin) setCompGstin(c.gstin); if(c.logo) setCompLogo(c.logo);
    const s=JSON.parse(localStorage.getItem("aw_sign")||"{}"); if(s.client) setClientSign(s.client); if(s.contractor) setContractorSign(s.contractor);
  }catch(e){} },[]);
  useEffect(()=>{ try{ localStorage.setItem("aw_draft", JSON.stringify({cname,cphone,geo,plot,storeys,pkg,bhk})); }catch(e){} },[cname,cphone,geo,plot,storeys,pkg,bhk]);
  useEffect(()=>{ try{ localStorage.setItem("aw_company", JSON.stringify({phone:compPhone,email:compEmail,address:compAddress,website:compWebsite,gstin:compGstin,logo:compLogo})); }catch(e){} },[compPhone,compEmail,compAddress,compWebsite,compGstin,compLogo]);
  useEffect(()=>{ try{ localStorage.setItem("aw_sign", JSON.stringify({client:clientSign,contractor:contractorSign})); }catch(e){} },[clientSign,contractorSign]);
  return (
  <div className="min-h-screen bg-[#02020a] text-white p-2 pb-32">
    <div className="max-w-[720px] mx-auto min-w-0">
      <div className="bg-[#0f141f] border border-[#d4af37]/20 rounded-2xl px-4 py-3 mb-2 text-center min-w-0">
        <b className="break-words text-[16px] leading-snug block">{COMPANY.name}</b>
        {compLogo && <img src={compLogo} alt="Logo" className="mx-auto h-[60px] object-contain mt-2 bg-white rounded p-1" />}
        <label className="block mt-2 text-[11px] text-white/60 cursor-pointer break-words">📷 Company Logo Upload - PDF me bhi jayega<input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setCompLogo(String(r.result)); r.readAsDataURL(f); } }} /></label>
        <div className="grid grid-cols-2 gap-1.5 mt-2 text-left min-w-0">
          <input value={compPhone} onChange={e=>setCompPhone(e.target.value)} placeholder="Phone: Apna number likho *" className="bg-black border border-white/20 rounded-full px-3 py-2 text-[12px] placeholder:text-white/40 min-w-0 break-words" />
          <input value={compEmail} onChange={e=>setCompEmail(e.target.value)} placeholder="Email: Apna email likho" className="bg-black border border-white/20 rounded-full px-3 py-2 text-[12px] placeholder:text-white/40 min-w-0 break-words" />
          <input value={compAddress} onChange={e=>setCompAddress(e.target.value)} placeholder="Address: Apna address likho *" className="bg-black border border-white/20 rounded-full px-3 py-2 text-[12px] placeholder:text-white/40 min-w-0 break-words" />
          <input value={compWebsite} onChange={e=>setCompWebsite(e.target.value)} placeholder="Website: Apni website likho *" className="bg-black border border-white/20 rounded-full px-3 py-2 text-[12px] placeholder:text-white/40 min-w-0 break-words" />
          <input value={compGstin} onChange={e=>setCompGstin(e.target.value)} placeholder="GSTIN: Apna GSTIN likho *" className="bg-black border border-white/20 rounded-full px-3 py-2 text-[12px] placeholder:text-white/40 col-span-2 min-w-0 break-words" />
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex bg-black rounded-full p-1 gap-1 border border-white/20">
            <button onClick={()=>setLang("en")} className={`px-4 py-1.5 rounded-full text-[12px] font-bold ${lang==="en"?"bg-[#d4af37] text-black":"text-white/70"}`}>English</button>
            <button onClick={()=>setLang("hi")} className={`px-4 py-1.5 rounded-full text-[12px] font-bold ${lang==="hi"?"bg-[#d4af37] text-black":"text-white/70"}`}>हिंदी</button>
          </div>
        </div>
        <div className="text-[11px] mt-1 break-words leading-relaxed">Quote: {quoteNo} | Date: {today} | {t.valid}: {validTill} (30 Days) <button onClick={newQuote} className="ml-1 px-2 py-0.5 rounded-full bg-[#d4af37] text-black font-bold">{t.newQuote}</button></div>
      </div>
      <div className="flex justify-between items-center bg-[#0f141f] border rounded-2xl px-4 py-2.5 mb-2 min-w-0 flex-wrap gap-2">
        <b className="break-words">{t.appTitle}</b>
        <div className="flex bg-black rounded-full p-1 gap-1 flex-wrap">
          <button onClick={()=>setView("all")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="all"?"bg-white text-black":"text-white/70"}`}>All: {mats.length}</button>
          <button onClick={()=>setView("owner")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="owner"?"bg-white text-black":"text-white/70"}`}>Owner: {ownerMats.length}</button>
          <button onClick={()=>setView("contractor")} className={`px-2 py-1 rounded-full text-[11px] font-bold ${view==="contractor"?"bg-[#d4af37] text-black":"text-white/70"}`}>Contractor: {contMats.length}</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">{[1,2,3].map(n=><button key={n} onClick={()=>setPhase(n)} className={`text-center text-[11px] py-1.5 rounded-full font-bold break-words ${phase===n?"bg-[#d4af37] text-black":"bg-white/10"}`}>{n===1?"1. Contract":n===2?"2. Location":"3. Final"}</button>)}</div>
      <div className="bg-black/60 border border-cyan-400/20 rounded-2xl px-3 py-2 mb-3 text-center min-w-0">
        <div className="text-[12px] text-[#d4af37] font-bold break-words">Base Rs.{cityRate} | Built-up {built115} Sqft ({sqmt} Sqmt) | {today} | {geo} - {geoState}</div>
        <div className="font-black text-[18px] break-words">Total Rs.{inr(displayTotal)}</div>
        {view==="contractor" ? (
          <div className="text-[12px] flex flex-col gap-0.5 break-words">
            <span>Owner Rs.{inr(ownerCost)}</span>
            <span>Contractor Rs.{inr(contCost)}</span>
            <span>Labour Rs.{inr(labourCost)} ({labourRate}/sqft)</span>
            <span>Profit Rs.{inr(profit)} - Only For You</span>
            <span className="font-bold">Total = Rs.{inr(baseTotal)}</span>
          </div>
        ) : (
          <div className="text-[12px] break-words">Client Total - Rs.{inr(displayTotal)} | Effective Rs.{effRate}/sqft</div>
        )}
        <div className="text-[12px] text-cyan-300 mt-1 break-words">{plotNum} x {cov}% = {ground} + 15% {extra} = {built115} | {gstOn?`GST CGST ${inr(cgst)} + SGST ${inr(sgst)}`:t.gstExtra} | Effective Rs.{effRate}/sqft</div>
        <div className="text-[11px] italic break-words">{inWords(displayTotal)}</div>
        <div className="text-[11px] text-[#d4af37] break-words">{t.boqOk}</div>
      </div>
      {phase===1 && <div className="bg-[#0f141f] border rounded-[24px] p-4 min-w-0">
        <h2 className="font-black text-[#d4af37] mb-3 break-words">{t.page1}</h2>
        <div className="grid gap-2 mb-3 min-w-0">
          <button onClick={()=>setContract("full")} className={`text-left p-4 rounded-[16px] border min-w-0 ${contract==="full"?"bg-white text-black":"bg-[#1a2332] text-white"}`}><div className="font-black text-[13px] break-words">{t.withMat} {contract==="full"&&<span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">{t.selected}</span>}</div><div className="text-[12px] mt-1 break-words">All Materials + Labour Included - 550/sqft Labour</div></button>
          <button onClick={()=>setContract("centring")} className={`text-left p-4 rounded-[16px] border min-w-0 ${contract==="centring"?"bg-white text-black":"bg-[#1a2332] text-white"}`}><div className="font-black text-[13px] break-words">{t.withoutMat} {contract==="centring"&&<span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">{t.selected}</span>}</div><div className="text-[12px] mt-1 break-words">Owner Provides Material - 450/sqft Labour</div></button>
          <button onClick={()=>setContract("labour")} className={`text-left p-4 rounded-[16px] border min-w-0 ${contract==="labour"?"bg-white text-black":"bg-[#1a2332] text-white"}`}><div className="font-black text-[13px] break-words">{t.labourOnly} {contract==="labour"&&<span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">{t.selected}</span>}</div><div className="text-[12px] mt-1 break-words">{t.onlyLabourDesc}</div></button>
          <button onClick={()=>setContract("item")} className={`text-left p-4 rounded-[16px] border min-w-0 ${contract==="item"?"bg-white text-black":"bg-[#1a2332] text-white"}`}><div className="font-black text-[13px] break-words">{t.itemRate} {contract==="item"&&<span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full">{t.selected}</span>}</div><div className="text-[12px] mt-1 break-words">{t.itemDesc}</div></button>
        </div>
        <div className="text-[12px] font-bold text-[#d4af37] mb-2 break-words">{t.bhkSelect}</div>
        <div className="grid grid-cols-3 gap-2 mb-3">{[1,2,3].map(b=>(<button key={b} onClick={()=>setBhk(b)} className={`py-3 rounded-[16px] border font-black min-w-0 break-words ${bhk===b?"bg-white text-black":"bg-[#1a2332]"}`}>{b} BHK<br/><span className="text-[11px] font-normal">Doors: {b===1?6:b===2?8:10}</span></button>))}</div>
        <div className="text-[11px] mb-3 break-words">Room: {bhk} BHK = Living + Kitchen + {bhk} Bedroom + {bhk} Bath + Balcony</div>
        <div className="grid grid-cols-2 gap-3 mb-3 min-w-0">
          <div className="bg-black/60 border rounded-[18px] p-3 min-w-0"><div className="text-[12px] font-black text-[#d4af37] break-words">Plot Area</div><input type="number" value={plot} onChange={e=>setPlot(e.target.value)} className="w-full bg-black border rounded-full px-3 py-2.5 text-[18px] font-black text-center min-w-0" /><div className="text-[12px] break-words">{t.onlyNumber}</div></div>
          <div className="bg-black/60 border rounded-[18px] p-3 min-w-0"><div className="text-[12px] font-black text-cyan-300 break-words">Coverage (10-90%)</div><input type="number" min={10} max={90} value={cov} onChange={e=>setCov(parseInt(e.target.value)||0)} className="w-full bg-black border rounded-full px-3 py-2.5 text-[18px] font-black text-center min-w-0" /><div className="text-[12px] break-words">{plotNum} x {cov}% = {ground}</div></div>
        </div>
        <label className="text-[12px] font-bold text-[#d4af37] break-words">Floor - 1 se 50 tak - G+0 se G+49</label>
        <select value={storeys} onChange={e=>setStoreys(e.target.value)} className="w-full bg-black border rounded-full px-3 py-3.5 mb-1 mt-1 min-w-0">{Array.from({length:50},(_,i)=>i+1).map(n=><option key={n} value={n}>{getLabel(String(n))}</option>)}</select>
        <div className="text-[12px] mb-3 break-words">Selected: {getLabel(storeys)} | {t.timeline}: {timeline} | Curing: {14+(storeysNum*7)} Days | Lift: {storeysNum>1?"Yes":"No"}</div>
        <div className="text-[11px] text-white/60 mb-1 break-words">Client Name / Phone</div>
        <input value={cname} onChange={e=>setCname(e.target.value)} placeholder={t.clientName} className="w-full bg-black/50 border rounded-full px-4 py-3 mb-2 min-w-0" />
        <input value={cphone} onChange={e=>setCphone(e.target.value)} placeholder={t.clientPhone} maxLength={10} className="w-full bg-black/50 border rounded-full px-4 py-3 mb-3 min-w-0" />
        <button onClick={()=>{if(validate()) setPhase(2)}} className="w-full bg-[#d4af37] text-black font-black py-4 rounded-full break-words">{t.nextLoc}</button>
      </div>}
      {phase===2 && <div className="bg-[#0f141f] border rounded-[24px] p-4 min-w-0">
        <h2 className="font-black text-[#d4af37] mb-3 break-words">{t.page2}</h2>
        <div className="bg-white/5 border rounded-[16px] p-3 mb-3 min-w-0">
          <div className="flex justify-between flex-wrap gap-2"><b className="text-[13px] text-cyan-300 break-words">Location + GPS + Site Photo</b><button onClick={gps} className="text-[12px] px-3 py-1 rounded-full bg-cyan-400 text-black font-black break-words">{gpsOk?`${geo} - GPS Verified`:"Use GPS"}</button></div>
          <div className="relative min-w-0">
            <input value={geo} onChange={e=>{setGeo(e.target.value); setShowCityDrop(true); setPkgOverride({}); const st=getStateForCity(e.target.value, geoState); if(st!==geoState) setGeoState(st);}} onFocus={()=>setShowCityDrop(true)} onBlur={()=>setTimeout(()=>setShowCityDrop(false),200)} className="w-full bg-black border rounded-full px-4 py-3 mt-2 min-w-0" placeholder={t.searchCity} />
            {showCityDrop && filteredCities.length>0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a2332] border rounded-2xl overflow-hidden z-20 max-h-[220px] overflow-y-auto">
                {filteredCities.map(c=>(
                  <button key={c} onMouseDown={()=>{setGeo(c); setShowCityDrop(false); setPkgOverride({}); setGeoState(getStateForCity(c, geoState));}} className="w-full text-left px-4 py-2.5 text-[13px] border-b border-white/10 last:border-0 hover:bg-white/10 break-words">{c} - Rs.{getRate(c, geoState)} / sqft</button>
                ))}
              </div>
            )}
          </div>
          <label className="block mt-2 text-[12px] font-bold break-words">State: {geoState} - {t.stateLabel}</label>
          <input value={geoState} onChange={e=>setGeoState(e.target.value)} placeholder="State - Madhya Pradesh / Maharashtra" className="w-full bg-black border rounded-full px-4 py-3 mt-1 min-w-0" />
          <label className="block mt-3 text-[12px] font-bold break-words">📸 {t.sitePhotoLabel} {sitePhoto && <span className="text-green-400">✓ {t.photoSelected}</span>}</label>
          <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setSitePhoto(String(r.result)); r.readAsDataURL(f); } }} className="w-full bg-black border rounded-full px-3 py-2 mt-1 text-[12px] min-w-0" />
          {sitePhoto && <img src={sitePhoto} alt="Site" className="w-full h-[160px] object-cover rounded-xl mt-2" />}
        </div>
        <div className="bg-[#d4af37]/10 border rounded-[18px] p-3 mb-3 min-w-0">
          <div className="text-[12px] font-black text-[#d4af37] mb-2 break-words">{t.profitLabel} {profitP}% = Rs.{inr(profit)} | GST {gstOn?"ON":"OFF"} - Only For You, Not For Client PDF</div>
          <input type="range" min={5} max={50} value={profitP} onChange={e=>setProfitP(parseInt(e.target.value))} className="w-full accent-[#d4af37]" />
          <button onClick={()=>setGstOn(!gstOn)} className="mt-2 px-3 py-1.5 rounded-full bg-white text-black text-[12px] font-black break-words">{gstOn?t.gstOnLabel:t.gstOffLabel}</button>
          <div className="grid grid-cols-3 gap-2 mt-3 min-w-0">{(["basic","standard","premium"] as const).map(k=>(<div key={k} className={`rounded-[16px] border p-3 relative min-w-0 ${pkg===k?"bg-white text-black":"bg-black/40"}`}><button onClick={()=>{setEditPkg(k); setERate(String(pkgRates[k]));}} className="absolute top-1 right-1 text-[11px] bg-[#d4af37] text-black px-2 py-0.5 rounded-full font-black">Edit</button><button onClick={()=>setPkg(k)} className="w-full text-left mt-3 min-w-0"><div className="text-[12px] capitalize break-words">{k}</div><div className="font-black break-words">Rs.{pkgRates[k]} / sqft</div></button></div>))}</div>
        </div>
        <div className="bg-yellow-400/10 border rounded-[16px] p-3 text-[12px] text-yellow-200 mb-3 break-words">⚠️ {t.approx} {validTill} (30 Days).</div>
        <div className="flex gap-2"><button onClick={()=>setPhase(1)} className="flex-1 bg-white/10 rounded-full py-3.5 break-words">{t.back}</button><button onClick={()=>{if(validate()) setPhase(3)}} className="flex-[2] bg-white text-black font-black py-3.5 rounded-full break-words">{t.nextFinal}</button></div>
      </div>}
      {phase===3 && <div className="bg-[#0f141f] border rounded-[24px] p-4 min-w-0">
        <div className="flex justify-between mb-3 flex-wrap gap-2"><h2 className="font-black text-[#d4af37] break-words">{t.page3} - {quoteNo}</h2><button onClick={()=>setPhase(2)} className="text-[12px] px-3 py-1 rounded-full bg-white/10 break-words">{t.back}</button></div>
        <div className="bg-black/60 border rounded-[16px] p-3 mb-3 text-[12px] flex flex-col gap-1 break-words"><span>Client Total = Rs.{inr(displayTotal)} {gstOn?`+ GST ${inr(gstAmt)} Included`:"+ " + t.gstExtra}</span><span>{today} | {t.valid}: {validTill}</span>{view==="contractor" && <span>Internal: Owner Rs.{inr(ownerCost)} + Contractor Rs.{inr(contCost)} + Labour Rs.{inr(labourCost)} + Profit Rs.{inr(profit)} = Rs.{inr(baseTotal)} - Only For You</span>}</div>
        <div className="flex flex-col gap-2">{list.map((m,i)=>(<div key={m.id} className="border-b border-white/10 pb-2 flex justify-between gap-2 min-w-0"><div className="min-w-0 flex-1"><div className="break-words text-[13px]">{i+1}. {m.name}</div><select value={m.company} onChange={e=>changeCompany(m.id, m.companies.indexOf(e.target.value))} className="bg-black border rounded-full px-2 py-1 text-[11px] mt-1 max-w-full"><option value={m.company}>{m.company}</option>{m.companies.filter(c=>c!==m.company).map(c=><option key={c} value={c}>{c}</option>)}</select><div className="text-[11px] text-white/60 break-words mt-1">{m.displayFactor}</div><div className="text-[11px] text-white/60 break-words">{m.owner?"Owner":"Contractor"} | Rate: Rs.{m.rate}</div></div><div className="text-right shrink-0"><div className="break-words text-[13px]">{m.qty} {m.unit}</div><div className="text-[12px] break-words">x Rs.{m.rate}</div><div className="font-bold break-words">= Rs.{inr(m.qty*m.rate)}</div><button onClick={()=>{setEditMat(i); setEQty(String(m.qty)); setEMatRate(String(m.rate));}} className="mt-1 text-[11px] bg-[#d4af37] text-black px-3 py-1 rounded-full font-black whitespace-nowrap">Edit</button></div></div>))}</div>
        {sitePhoto && <div className="mt-3"><b className="text-[12px] break-words">{t.sitePhotoLabel}</b><img src={sitePhoto} alt="Site" className="w-full h-[160px] object-cover rounded-xl mt-1" /></div>}
        <div className="bg-black/60 border rounded-[16px] p-3 mt-3 text-[12px] break-words"><b className="text-[#d4af37]">{t.paymentTitle}</b><div className="flex flex-col gap-1 mt-1 break-words"><span>{t.pay1} - Rs.{inr(pay30)}</span><span>{t.pay2} - Rs.{inr(pay30)}</span><span>{t.pay3} - Rs.{inr(pay30)}</span><span>{t.pay4} - Rs.{inr(pay10)}</span></div><div className="flex flex-col gap-0.5 mt-2 break-words"><b className="text-[#d4af37] break-words">{t.timeline}: {timeline}</b><b className="text-[#d4af37] break-words">{t.valid}: {validTill} (30 Days)</b></div><div className="mt-1 break-words">{t.notInc}</div></div>
        <div className="font-black text-[18px] mt-3 break-words">{t.final}: Rs.{inr(displayTotal)} | Effective Rs.{effRate}/sqft</div>
        <div className="text-[11px] italic mt-1 break-words">{inWords(displayTotal)}</div>
        <div className="bg-white/5 border rounded-[16px] p-3 mt-3 text-[11px] leading-relaxed break-words"><b className="text-[#d4af37]">{t.termsTitle}</b><br/>{t.terms.map((term,idx)=><div key={idx} className="break-words">{idx+1}. {term}</div>)}</div>
        <div className="grid grid-cols-2 gap-3 mt-4 min-w-0">
          <SignatureBox label={t.clientSign + " Signature"} value={clientSign} onChange={setClientSign} hint={t.signHint} clearLabel={t.clear} />
          <SignatureBox label={t.contractorSign + " Signature"} value={contractorSign} onChange={setContractorSign} hint={t.signHint} clearLabel={t.clear} />
        </div>
        <div className="text-center text-[11px] mt-2 text-white/60 break-words">{t.clientSign}: {cname || "__________"} | Date: {today} | {t.stamp}: {t.companySeal}</div>
        <div className="text-center mt-3"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://wa.me/91${compPhone || "9823000000"}`} alt="WhatsApp QR" className="mx-auto border border-white/20 p-1 bg-white" /><div className="text-[11px] mt-1 break-words">{t.scan}</div></div>
        <div className="flex gap-2 mt-3"><button onClick={wa} className="flex-1 bg-green-600 rounded-full py-3 font-bold break-words">{t.whatsapp}</button><button onClick={pdf} className="flex-1 bg-blue-600 rounded-full py-3 font-bold break-words">{t.download}</button></div>
        <div className="flex gap-2 mt-2"><button onClick={saveEst} className="flex-1 bg-white/10 rounded-full py-3 break-words">💾 {t.save}</button><button onClick={newQuote} className="flex-1 bg-[#d4af37] text-black rounded-full py-3 font-bold break-words">🆕 {t.newQuote}</button></div>
        {history.length>0 && <div className="mt-3"><b className="text-[13px] break-words">{t.history}</b>{history.map((h,i)=><div key={i} className="text-[12px] bg-white/5 px-2 py-1.5 rounded-lg mt-1 break-words">{h.quoteNo} - {h.name} - {h.built} Sqft - Rs.{inr(h.total)} ({h.gstMode||""}) - {h.date}</div>)}</div>}
        {history.length===0 && <div className="mt-3 text-[12px] text-white/50 text-center break-words">{t.noHistory}</div>}
      </div>}
    </div>
    {editMat!==null && <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999]"><div className="bg-white text-black rounded-2xl p-4 w-full max-w-[400px] min-w-0"><h3 className="font-black break-words">Edit {list[editMat].name}</h3><input value={eQty} onChange={e=>setEQty(e.target.value)} placeholder="Qty" className="w-full border rounded-full px-3 py-2 mt-2 text-black min-w-0" /><input value={eMatRate} onChange={e=>setEMatRate(e.target.value)} placeholder="Rate" className="w-full border rounded-full px-3 py-2 mt-2 text-black min-w-0" /><div className="text-[12px] mt-1 break-words">Save dabate hi Total badlega</div><div className="flex gap-2 mt-3"><button onClick={()=>setEditMat(null)} className="flex-1 bg-gray-200 rounded-full py-3 break-words">Cancel</button><button onClick={()=>saveMat(editMat)} className="flex-1 bg-black text-white rounded-full py-3 font-bold break-words">Save</button></div></div></div>}
    {editPkg && <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999]"><div className="bg-white text-black rounded-2xl p-4 w-full max-w-[400px] min-w-0"><h3 className="font-black capitalize break-words">Edit {editPkg} Package</h3><input value={eRate} onChange={e=>setERate(e.target.value)} type="number" className="w-full border rounded-full px-3 py-3 mt-2 text-black min-w-0" /><div className="text-[12px] mt-1 break-words">Abhi: Rs.{pkgRates[editPkg]} | Save ke baad Auto-Rebuild ho jayega</div><div className="flex gap-2 mt-3"><button onClick={()=>setEditPkg(null)} className="flex-1 bg-gray-200 rounded-full py-3 break-words">Cancel</button><button onClick={savePkg} className="flex-1 bg-black text-white rounded-full py-3 font-bold break-words">Save</button></div></div></div>}
  </div>
  );
}
