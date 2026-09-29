const BASE={funding:.0654,fileName:"SENS PRESTAMOS2.xlsx",bonds:[
["M27",.0671,99.90154199548631,99.883232000756,.00418607362857415],
["J27",.0671,102.96297835206319,102.94410725604814,.006647784313955185],
["M28",.0759,101.84798877251431,101.82691973301326,.013563308429894505],
["MZ29",.0808,101.54435525063876,101.52201983534937,.022008680965001304],
["MY29",.0819,103.50492492730092,103.48185456594715,.023983004583911338],
["F30",.0859,100.36127210166906,100.33783292682487,.029395405148633813],
["M31",.0882,98.45675421517917,98.43315746570238,.0370551400001915],
["AB32",.091,98.7881282554666,98.76371720992681,.04197847822707956],
["M33",.0931,93.51742777064584,93.49379801129936,.04650634394317876],
["N34",.0949,92.70533340673329,92.68146646010958,.05279518040302378],
["F36",.0962,90.62727124285686,90.60362718850776,.05738084871921956],
["N36",.0959,105.89451054080345,105.86696750178814,.06565646082549392],
["N38",.0987,93.12241239764495,93.09750122068627,.06556687762316926],
["N42",.1004,84.3061581899547,84.2832265151695,.06852641333875908],
["N47",.1009,84.40425409916983,84.38118422034299,.07412553678145173],
["J53",.1012,81.06498707906043,81.0427656555963,.07643929988431353],
["AB55",.1012,82.84827757714287,82.8255673205247,.07690961618706638]
].map(x=>({bond:x[0],valuation:x[1],q:x[2],r:x[3],u:x[4]}))};
let state=structuredClone(BASE),selected="AB55";
const $=x=>document.getElementById(x),pct=x=>Number.isFinite(x)?(x*100).toFixed(2)+"%":"—",loan=x=>Number.isFinite(x)?x.toFixed(4):"—";
const dec=s=>Number(String(s).replace(",",".").trim()),pdec=s=>{let n=dec(String(s).replace("%",""));return Number.isFinite(n)?n/100:NaN};
function atFunding(b,f){return((b.q-b.r)-(b.r*f/360))/b.u}
function atLoan(b,l){return 360*((b.q-b.r)-l*b.u)/b.r}
function bond(){return state.bonds.find(b=>b.bond.toUpperCase()===selected.toUpperCase())}
function error(m){$("error").hidden=!m;$("error").textContent=m||""}
function render(){let b=bond()||state.bonds[0];if(!b)return;selected=b.bond;$("bondInput").value=b.bond;$("fileName").textContent=state.fileName;$("fundingHead").textContent=pct(state.funding);$("currentLoan").textContent=loan(atFunding(b,state.funding));$("currentFunding").textContent=pct(state.funding);$("currentYield").textContent=pct(b.valuation);$("loanResult").textContent=loan(atFunding(b,pdec($("fundingInput").value)));$("fundingResult").textContent=pct(atLoan(b,dec($("loanInput").value)));$("bondList").innerHTML=state.bonds.map(x=>'<option value="'+x.bond+'"></option>').join("");$("bondCount").textContent=state.bonds.length+" bonos";$("curveBody").innerHTML=state.bonds.map(x=>'<tr class="'+(x.bond===b.bond?"sel":"")+'" data-bond="'+x.bond+'"><td>'+x.bond+'</td><td>'+pct(x.valuation)+'</td><td>'+loan(atFunding(x,state.funding))+'</td></tr>').join("");document.querySelectorAll("#curveBody tr").forEach(tr=>tr.onclick=()=>{selected=tr.dataset.bond;render()})}
$("bondInput").oninput=e=>{selected=e.target.value.trim().toUpperCase();if(bond())render()};$("fundingInput").oninput=render;$("loanInput").oninput=render;
$("fileInput").onchange=async e=>{error("");const file=e.target.files?.[0];if(!file)return;try{const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellFormula:true,cellNF:true});const ws=wb.Sheets["SENS-PRESTAMOS"];if(!ws)throw Error('No encontré "SENS-PRESTAMOS".');const g=a=>ws[a]?.v;const funding=Number(g("I1"));if(!Number.isFinite(funding))throw Error("No pude leer el fondeo de I1.");const bonds=[];for(let r=6;r<=200;r++){const name=String(g("C"+r)??"").trim(),valuation=Number(g("H"+r)),q=Number(g("Q"+r)),rr=Number(g("R"+r)),u=Number(g("U"+r));if(name&&[valuation,q,rr,u].every(Number.isFinite)&&u!==0)bonds.push({bond:name,valuation,q,r:rr,u})}if(!bonds.length)throw Error("No encontré la curva de bonos.");state={funding,fileName:file.name,bonds};if(!bond())selected=bonds[0].bond;render()}catch(err){error("No pude leer el archivo: "+err.message)}finally{e.target.value=""}};
render();