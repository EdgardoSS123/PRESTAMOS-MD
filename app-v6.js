const BASE_BONDS={funding:.0654,bonds:[
["M27","270304",.0671,99.90154199548631,99.883232000756,.00418607362857415],
["J27","270603",.0671,102.96297835206319,102.94410725604814,.006647784313955185],
["M28","280302",.0759,101.84798877251431,101.82691973301326,.013563308429894505],
["MZ29","290301",.0808,101.54435525063876,101.52201983534937,.022008680965001304],
["MY29","290531",.0819,103.50492492730092,103.48185456594715,.023983004583911338],
["F30","300228",.0859,100.36127210166906,100.33783292682487,.029395405148633813],
["M31","310529",.0882,98.45675421517917,98.43315746570238,.0370551400001915],
["AB32","320415",.091,98.7881282554666,98.76371720992681,.04197847822707956],
["M33","330526",.0931,93.51742777064584,93.49379801129936,.04650634394317876],
["N34","341123",.0949,92.70533340673329,92.68146646010958,.05279518040302378],
["F36","360221",.0962,90.62727124285686,90.60362718850776,.05738084871921956],
["N36","361120",.0959,105.89451054080345,105.86696750178814,.06565646082549392],
["N38","381118",.0987,93.12241239764495,93.09750122068627,.06556687762316926],
["N42","421113",.1004,84.3061581899547,84.2832265151695,.06852641333875908],
["N47","471107",.1009,84.40425409916983,84.38118422034299,.07412553678145173],
["J53","530731",.1012,81.06498707906043,81.0427656555963,.07643929988431353],
["AB55","550429",.1012,82.84827757714287,82.8255673205247,.07690961618706638]
].map(x=>({bond:x[0],code:x[1],valuation:x[2],yesterday:null,q:x[3],r:x[4],u:x[5]}))};

const DEFAULT_CETES=[
["261001",3,6.56,6.55],["261008",10,6.54,6.54],["261015",17,6.53,6.52],["261022",24,6.52,6.51],
["261029",31,6.51,6.50],["261105",38,6.51,6.50],["261112",45,6.51,6.50],["261119",52,6.51,6.50],
["261126",59,6.51,6.50],["261203",66,6.51,6.50],["261210",73,6.61,6.60],["261217",80,6.61,6.60],
["261224",87,6.62,6.60],["261231",94,6.62,6.60],["270107",101,6.71,6.68],["270121",115,6.73,6.71],
["270204",129,6.71,6.70],["270218",143,6.77,6.71],["270304",157,6.81,6.80],["270318",171,6.94,6.91],
["270401",185,6.94,6.91],["270429",213,6.93,6.92],["270513",227,6.99,6.98],["270527",241,7.00,6.99],
["270624",269,7.08,7.06],["270708",283,7.11,7.09],["270722",297,7.10,7.07],["270819",325,7.17,7.12],
["270902",339,7.31,7.24],["270915",352,7.37,7.29],["271028",395,7.50,7.42],["271223",451,7.65,7.56],
["280217",507,7.85,7.75],["280412",562,7.98,7.90],["280608",619,8.10,8.02],["280803",675,8.17,8.11]
].map(x=>({emission:x[0],days:x[1],close:x[2],yesterday:x[3]}));

let bonds=JSON.parse(JSON.stringify(BASE_BONDS.bonds)), bondFunding=BASE_BONDS.funding, selectedBond="AB55";
let cetes=JSON.parse(JSON.stringify(DEFAULT_CETES)), selectedCete="261008", valuationDate=new Date("2026-09-28T12:00:00"), valuationName="Resumen 28/09/2026";
let banxico={sourceDate:null,items:{}};

const $=id=>document.getElementById(id);
const n=s=>Number(String(s).replace(",",".").replace("%","").trim());
const pctDec=x=>Number.isFinite(x)?(x*100).toFixed(2)+"%":"—";
const pctNum=x=>Number.isFinite(x)?x.toFixed(2):"—";
const loanFmt=x=>Number.isFinite(x)?x.toFixed(4):"—";
const money=x=>Number.isFinite(x)?x.toLocaleString("es-MX",{maximumFractionDigits:1})+" MM":"—";
const dateFmt=d=>d?new Intl.DateTimeFormat("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d):"—";
function addBusinessDay(d){let x=new Date(d);do{x.setDate(x.getDate()+1)}while(x.getDay()===0||x.getDay()===6);return x}
function emissionDate(e){let yy=2000+Number(e.slice(0,2)),m=Number(e.slice(2,4))-1,d=Number(e.slice(4,6));return new Date(yy,m,d,12)}
function dateKey(e){const d=emissionDate(e);return [String(d.getDate()).padStart(2,"0"),String(d.getMonth()+1).padStart(2,"0"),d.getFullYear()].join("/")}
function atFunding(b,f){return((b.q-b.r)-(b.r*f/360))/b.u}
function atLoan(b,l){return 360*((b.q-b.r)-l*b.u)/b.r}
function selectedB(){return bonds.find(x=>x.bond.toUpperCase()===selectedBond.toUpperCase())}
function selectedC(){return cetes.find(x=>x.emission===selectedCete)}
function showError(m){$("error").hidden=!m;$("error").textContent=m||""}
function ceteLoan(c,fundingPct){
  const md=addBusinessDay(valuationDate), d24=addBusinessDay(md), mat=emissionDate(c.emission);
  const e=Math.round((mat-md)/86400000), f=Math.round((mat-d24)/86400000);
  const rate=c.close/100, rateUp=rate+0.0001;
  const g=10/((rate*e/360)+1), h=10/((rate*f/360)+1);
  const k=10/((rateUp*e/360)+1), pv01=g-k;
  if(!Number.isFinite(pv01)||pv01===0)return NaN;
  return ((h-(g*(1+(fundingPct/36000))))/pv01)/100;
}
function renderBond(){
  const b=selectedB()||bonds[0]; if(!b)return; selectedBond=b.bond;
  $("bondInput").innerHTML=bonds.map(x=>'<option value="'+x.bond+'">'+x.bond+'</option>').join("");$("bondInput").value=b.bond;
  $("currentLoan").textContent=loanFmt(atFunding(b,bondFunding));if(document.activeElement!==$("currentFundingInput"))$("currentFundingInput").value=(bondFunding*100).toFixed(2);$("currentYield").textContent=pctNum(b.valuation*100);
  $("loanResult").textContent=loanFmt(atFunding(b,n($("fundingInput").value)/100));$("fundingResult").textContent=pctDec(atLoan(b,n($("loanInput").value)));
  $("bondCount").textContent=bonds.length+" bonos";
  $("curveBody").innerHTML=bonds.map(x=>'<tr class="'+(x.bond===b.bond?"sel":"")+'" data-bond="'+x.bond+'"><td>'+x.bond+'</td><td>'+pctNum(x.valuation*100)+'</td><td>'+(x.yesterday==null?"—":pctNum(x.yesterday))+'</td><td>'+loanFmt(atFunding(x,bondFunding))+'</td></tr>').join("");
  document.querySelectorAll("#curveBody tr").forEach(tr=>tr.onclick=()=>{selectedBond=tr.dataset.bond;renderBond()});
}
function renderCete(){
  const c=selectedC()||cetes[0];if(!c)return;selectedCete=c.emission;
  $("ceteInput").innerHTML=cetes.map(x=>'<option value="'+x.emission+'">'+x.emission+'</option>').join("");$("ceteInput").value=c.emission;
  const bx=banxico.items[c.emission]||null;
  $("ceteClose").textContent=pctNum(c.close);$("ceteDays").textContent=c.days+" días";
  $("ceteWindow").textContent=bx?money(bx.window):"—";
  $("ceteLoanResult").textContent=loanFmt(ceteLoan(c,n($("ceteFundingInput").value)));
  $("ceteCount").textContent=cetes.length+" emisiones";
  $("ceteBody").innerHTML=cetes.map(x=>{const q=banxico.items[x.emission];return '<tr class="'+(x.emission===c.emission?"sel":"")+'" data-cete="'+x.emission+'"><td>'+x.emission+'</td><td>'+x.days+'</td><td>'+pctNum(x.close)+'</td><td>'+(q?money(q.window):"—")+'</td></tr>'}).join("");
  document.querySelectorAll("#ceteBody tr").forEach(tr=>tr.onclick=()=>{selectedCete=tr.dataset.cete;renderCete()});
}
function renderHeader(){$("valuationName").textContent=valuationName;$("banxicoDate").textContent=banxico.sourceDate||"—"}
function saveLocal(){
  try{
    localStorage.setItem("prestamosMD.state",JSON.stringify({
      bonds,cetes,bondFunding,selectedBond,selectedCete,
      valuationDate:valuationDate.toISOString(),
      valuationName
    }));
  }catch(e){}
}
function restoreLocal(){
  try{
    const raw=localStorage.getItem("prestamosMD.state");
    if(!raw)return;
    const s=JSON.parse(raw);
    if(Array.isArray(s.bonds)&&s.bonds.length)bonds=s.bonds;
    if(Array.isArray(s.cetes)&&s.cetes.length)cetes=s.cetes;
    if(Number.isFinite(s.bondFunding))bondFunding=s.bondFunding;
    if(s.selectedBond)selectedBond=s.selectedBond;
    if(s.selectedCete)selectedCete=s.selectedCete;
    if(s.valuationDate)valuationDate=new Date(s.valuationDate);
    if(s.valuationName)valuationName=s.valuationName;
  }catch(e){}
}
function renderAll(){renderHeader();renderBond();renderCete()}
async function loadBanxico(){try{const r=await fetch("./banxico.json?ts="+Date.now(),{cache:"no-store"});if(r.ok){banxico=await r.json();renderAll()}}catch(e){}}
function parseFilenameDate(name){const m=name.match(/(20\d{6})/);if(!m)return null;const s=m[1];return new Date(Number(s.slice(0,4)),Number(s.slice(4,6))-1,Number(s.slice(6,8)),12)}
function parseValuation(wb,file){
  const ws=wb.Sheets["RESUMEN"]||wb.Sheets[wb.SheetNames[0]], rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
  const newCetes=[], bondMap={};
  for(const row of rows){
    for(let i=0;i<row.length;i++){
      const v=String(row[i]??"");
      if(v.startsWith("BI_CETES_")){
        const em=v.replace("BI_CETES_",""); const days=Number(row[i+1]), close=Number(row[i+2]), y=Number(row[i+3]);
        if(/^\d{6}$/.test(em)&&[days,close,y].every(Number.isFinite))newCetes.push({emission:em,days,close,yesterday:y});
      }
      if(v.startsWith("M_BONOS_")){
        const code=v.replace("M_BONOS_",""); const close=Number(row[i+2]), y=Number(row[i+3]);
        if(/^\d{6}$/.test(code)&&Number.isFinite(close))bondMap[code]={close,yesterday:Number.isFinite(y)?y:null};
      }
    }
  }
  if(!newCetes.length&&!Object.keys(bondMap).length)throw Error("No encontré Directo_Cete's ni Bonos M en el archivo.");
  if(newCetes.length)cetes=newCetes;
  bonds=bonds.map(b=>bondMap[b.code]?{...b,valuation:bondMap[b.code].close/100,yesterday:bondMap[b.code].yesterday}:b);
  const d=parseFilenameDate(file.name);if(d)valuationDate=d;valuationName=file.name;
}
document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));$("bonosView").hidden=btn.dataset.tab!=="bonos";$("cetesView").hidden=btn.dataset.tab!=="cetes"});
$("bondInput").onchange=e=>{selectedBond=e.target.value.trim().toUpperCase();if(selectedB())renderBond()};$("currentFundingInput").oninput=e=>{const v=n(e.target.value);if(Number.isFinite(v)){bondFunding=v/100;saveLocal();renderBond()}};$("fundingInput").oninput=renderBond;$("loanInput").oninput=renderBond;
$("ceteInput").onchange=e=>{selectedCete=e.target.value.trim();if(selectedC())renderCete()};$("ceteFundingInput").oninput=renderCete;
$("valuationFile").onchange=async e=>{showError("");const file=e.target.files?.[0];if(!file)return;try{const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellFormula:true,cellDates:true});parseValuation(wb,file);saveLocal();renderAll()}catch(err){showError("No pude leer la valuación: "+err.message)}finally{e.target.value=""}};
restoreLocal();renderAll();loadBanxico();