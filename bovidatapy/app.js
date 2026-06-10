/* ===================================================================
   BoviDataPy — app.js
   Análisis y visualización de la faena bovina del Paraguay.
   Datos en data.js (const FAENA_DATA). Actualización: solo data.js.
=================================================================== */
"use strict";

const C = { pine:"#2E7D5B", steel:"#3E7CA8", clay:"#C77B3C", wheat:"#E0B23E",
            ink:"#14201A", soft:"#5E6E64", alert:"#B24631", line:"#DCE2DA" };
const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmt  = (n)=> n==null ? "—" : Math.round(n).toLocaleString("es-PY");
const pct  = (n,d=1)=> n==null ? "—" : n.toFixed(d).replace(".",",")+" %";
const sign = (n,d=1)=> n==null ? "—" : (n>=0?"+":"")+pct(n,d);
const labelOf = (f)=> MES[+f.slice(5,7)-1]+" "+f.slice(2,4);

const D = FAENA_DATA;
const LAST = D[D.length-1];
const LY = +LAST.fecha.slice(0,4), LM = +LAST.fecha.slice(5,7);
const years = [...new Set(D.map(r=>+r.fecha.slice(0,4)))];
const byYear = {}; years.forEach(y=> byYear[y]=D.filter(r=>+r.fecha.slice(0,4)===y));
const sumY = (y,k="total")=> byYear[y].reduce((s,r)=>s+(r[k]??0),0);
const fullYears = years.filter(y=>byYear[y].length===12);
const lastFull = fullYears[fullYears.length-1];
const machos  = r=> r.novillos+r.toros;
const hembras = r=> r.vacas+(r.vaquillas??0);

/* Chart defaults */
Chart.defaults.font.family='"IBM Plex Mono", monospace';
Chart.defaults.font.size=11;
Chart.defaults.color=C.soft;
Chart.defaults.borderColor=C.line;
Chart.defaults.plugins.legend.labels.boxWidth=12;
Chart.defaults.plugins.legend.labels.boxHeight=12;
Chart.defaults.plugins.legend.labels.padding=14;
Chart.defaults.plugins.tooltip.padding=9;
Chart.defaults.plugins.tooltip.backgroundColor="#14201A";
Chart.defaults.plugins.tooltip.titleFont={family:'"Archivo"',weight:"600"};
Chart.defaults.plugins.tooltip.callbacks={ label:c=>` ${c.dataset.label}: ${fmt(c.parsed.y ?? c.parsed)}` };
const M_ = (v)=> (v/1e6).toFixed(1).replace(".",",")+" M";
const charts={};
function make(id,cfg){ if(charts[id])charts[id].destroy(); charts[id]=new Chart(document.getElementById(id),cfg); }
function seg(id,fn){ document.querySelectorAll(`#${id} button`).forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(`#${id} button`).forEach(x=>x.classList.remove("on")); b.classList.add("on"); fn(b); })); }

/* ===================== FIRMA: pulso ===================== */
(function(){
  const strip=document.getElementById("pulse"), tip=document.getElementById("pulseTip");
  const max=Math.max(...D.map(r=>r.total));
  D.forEach(r=>{ const s=document.createElement("span");
    s.style.height=Math.max(3,(r.total/max)*100)+"%";
    if(r.fecha>="2019-01")s.classList.add("era2");
    s.dataset.f=r.fecha; s.dataset.t=r.total; strip.appendChild(s); });
  strip.addEventListener("mousemove",e=>{ const t=e.target;
    if(t.tagName!=="SPAN"){tip.hidden=true;return;}
    tip.textContent=`${labelOf(t.dataset.f)} · ${fmt(+t.dataset.t)} cab.`;
    tip.style.left=Math.min(e.clientX+12,innerWidth-180)+"px"; tip.style.top=(e.clientY+14)+"px"; tip.hidden=false; });
  strip.addEventListener("mouseleave",()=>tip.hidden=true);
  document.getElementById("brandRange").textContent=D[0].fecha.slice(0,4)+"–"+LAST.fecha.slice(0,4);
  document.getElementById("ribbonHint").textContent=`${D.length} meses · color claro = vaquillas separadas (2019+)`;
  const ax=document.getElementById("pulseAxis");
  ax.innerHTML=`<span>${D[0].fecha.slice(0,4)}</span><span>2012</span><span>2016</span><span>2020</span><span>${LAST.fecha.slice(0,4)}</span>`;
})();

/* ===================== TABS ===================== */
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  b.classList.add("active");
  const panel=document.getElementById("panel-"+b.dataset.tab);
  panel.classList.add("active");
  // Charts construidos mientras el panel estaba oculto se dibujan a 0×0;
  // al mostrarse hay que remedirlos.
  requestAnimationFrame(()=>panel.querySelectorAll("canvas").forEach(cv=>{
    const ch=charts[cv.id]; if(ch) ch.resize();
  }));
}));

/* ===================== HERO KPIs ===================== */
(function(){
  const prevSame=D.find(r=>r.fecha===(LY-1)+LAST.fecha.slice(4));
  const yoyM=prevSame?(LAST.total/prevSame.total-1)*100:null;
  const ytd=sumY(LY);
  const ytdPrev=byYear[LY-1].filter(r=>+r.fecha.slice(5,7)<=LM).reduce((s,r)=>s+r.total,0);
  const yoyY=(ytd/ytdPrev-1)*100;
  const last12=D.slice(-12).reduce((s,r)=>s+r.total,0);
  const hp12=D.slice(-12).reduce((s,r)=>s+hembras(r),0)/last12*100;
  const arr=v=>v==null?"":`<span class="${v>=0?"up":"down"}">${v>=0?"▲":"▼"} ${pct(Math.abs(v))}</span>`;
  document.getElementById("heroKpis").innerHTML=`
    <div class="hkpi"><div class="lbl">Último mes · ${labelOf(LAST.fecha)}</div>
      <div class="val">${fmt(LAST.total)}</div><div class="sub">${arr(yoyM)} interanual</div></div>
    <div class="hkpi"><div class="lbl">Acumulado ${LY}</div>
      <div class="val">${fmt(ytd)}</div><div class="sub">${arr(yoyY)} vs ${LY-1}</div></div>
    <div class="hkpi"><div class="lbl">Últimos 12 meses</div>
      <div class="val">${M_(last12)}</div><div class="sub">cabezas faenadas</div></div>
    <div class="hkpi"><div class="lbl">% hembras · 12 m</div>
      <div class="val">${pct(hp12)}</div><div class="sub">${hp12>=45?"liquidación":"retención relativa"}</div></div>`;
})();

/* ===================== RESUMEN ===================== */
(function(){
  // anual
  make("chAnnual",{type:"bar",
    data:{labels:fullYears,datasets:[{label:"Cabezas / año",data:fullYears.map(y=>sumY(y)),
      backgroundColor:fullYears.map(y=>y===lastFull?C.pine:C.pine+"B0"),borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{y:{ticks:{callback:M_}}}}});
  document.getElementById("annualNote").textContent=
    `Años completos ${fullYears[0]}–${lastFull}. ${LY} acumula ${fmt(sumY(LY))} cabezas a ${MESL[LM-1].toLowerCase()}.`;

  // crecimiento interanual
  const g=fullYears.slice(1).map((y,i)=>+((sumY(y)/sumY(fullYears[i])-1)*100).toFixed(1));
  make("chGrowth",{type:"bar",
    data:{labels:fullYears.slice(1),datasets:[{label:"Variación %",data:g,
      backgroundColor:g.map(v=>v>=0?C.pine:C.alert),borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>" "+sign(c.parsed.y)}}},
      scales:{y:{ticks:{callback:v=>v+" %"}}}}});

  // mensual
  function monthly(m){ const sl=m?D.slice(-m):D;
    make("chMonthly",{type:"line",
      data:{labels:sl.map(r=>labelOf(r.fecha)),datasets:[{label:"Faena mensual",data:sl.map(r=>r.total),
        borderColor:C.pine,backgroundColor:C.pine+"1F",fill:true,
        pointRadius:sl.length>80?0:2,borderWidth:2,tension:.25}]},
      options:{maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{maxTicksLimit:14}},y:{ticks:{callback:fmt}}}}});
  }
  monthly(24); seg("segMonthly",b=>monthly(+b.dataset.m));

  // rolling 12m
  const rl=[],rlab=[];
  for(let i=11;i<D.length;i++){ rlab.push(labelOf(D[i].fecha));
    rl.push(D.slice(i-11,i+1).reduce((s,r)=>s+r.total,0)); }
  make("chRolling",{type:"line",
    data:{labels:rlab,datasets:[{label:"Suma móvil 12 m",data:rl,
      borderColor:C.steel,backgroundColor:C.steel+"1A",fill:true,pointRadius:0,borderWidth:2.5,tension:.3}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{ticks:{maxTicksLimit:12}},y:{ticks:{callback:M_}}}}});

  // acumulado
  const cy=years.slice(-4), pal=[C.line,C.steel,C.clay,C.pine];
  make("chCumulative",{type:"line",
    data:{labels:MES,datasets:cy.map((y,i)=>{let a=0;
      return{label:String(y),data:byYear[y].map(r=>a+=r.total),
        borderColor:pal[i]??C.ink,borderWidth:y===LY?3:2,pointRadius:2,tension:.15};})},
    options:{maintainAspectRatio:false,scales:{y:{ticks:{callback:M_}}}}});

  // records
  const sorted=[...D].sort((a,b)=>b.total-a.total);
  const top=sorted.slice(0,5), bot=sorted.slice(-3).reverse();
  let h=`<thead><tr><th>Ranking</th><th>Mes</th><th>Cabezas</th></tr></thead><tbody>`;
  top.forEach((r,i)=>h+=`<tr><td>Máx #${i+1}</td><td>${MESL[+r.fecha.slice(5,7)-1]} ${r.fecha.slice(0,4)}</td><td><strong>${fmt(r.total)}</strong></td></tr>`);
  bot.forEach((r,i)=>h+=`<tr><td class="neg">Mín #${i+1}</td><td>${MESL[+r.fecha.slice(5,7)-1]} ${r.fecha.slice(0,4)}</td><td>${fmt(r.total)}</td></tr>`);
  document.getElementById("tblRecords").innerHTML=h+`</tbody>`;
})();

/* ===================== CATEGORÍAS ===================== */
(function(){
  function stack(from){ const sl=from==="all"?D:D.filter(r=>r.fecha>=from); const pre=from==="all";
    const ds=[["Novillos","novillos",C.pine],["Toros","toros",C.steel],
      [pre?"Vacas (incl. vaquillas <2019)":"Vacas","vacas",C.clay],["Vaquillas","vaquillas",C.wheat]];
    make("chCatStack",{type:"bar",
      data:{labels:sl.map(r=>labelOf(r.fecha)),datasets:ds.map(([l,k,c])=>({label:l,data:sl.map(r=>r[k]??0),backgroundColor:c,stack:"s"}))},
      options:{maintainAspectRatio:false,
        scales:{x:{stacked:true,ticks:{maxTicksLimit:14}},y:{stacked:true,ticks:{callback:fmt}}}}});
  }
  stack("2019-01"); seg("segCatRange",b=>stack(b.dataset.from));

  // participación %
  const ys=fullYears;
  const shareDs=[["Novillos","novillos",C.pine],["Toros","toros",C.steel],["Vacas","vacas",C.clay],["Vaquillas","vaquillas",C.wheat]]
    .map(([l,k,c])=>({label:l,borderColor:c,backgroundColor:c,pointRadius:2,borderWidth:2,tension:.2,
      data:ys.map(y=> (k==="vaquillas"&&y<2019)?null:+(sumY(y,k)/sumY(y)*100).toFixed(1))}));
  make("chCatShare",{type:"line",data:{labels:ys,datasets:shareDs},
    options:{maintainAspectRatio:false,spanGaps:false,
      plugins:{tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${pct(c.parsed.y)}`}}},
      scales:{y:{ticks:{callback:v=>v+" %"}}}}});

  // índice base 2019=100 (desde 2019)
  const ys19=fullYears.filter(y=>y>=2019);
  const idxDs=[["Novillos","novillos",C.pine],["Toros","toros",C.steel],["Vacas","vacas",C.clay],["Vaquillas","vaquillas",C.wheat],["Total","total",C.ink]]
    .map(([l,k,c])=>{const base=sumY(2019,k);
      return{label:l,borderColor:c,backgroundColor:c,pointRadius:2,borderWidth:l==="Total"?3:2,tension:.2,
        data:ys19.map(y=>+(sumY(y,k)/base*100).toFixed(1))};});
  make("chCatIndex",{type:"line",data:{labels:ys19,datasets:idxDs},
    options:{maintainAspectRatio:false,
      plugins:{tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${String(c.parsed.y).replace(".",",")}`}}},
      scales:{y:{ticks:{callback:v=>v}}}}});

  // tabla anual
  const rowsY=[...fullYears]; if(!fullYears.includes(LY))rowsY.push(LY);
  let h=`<thead><tr><th>Año</th><th>Novillos</th><th>Toros</th><th>Vacas</th><th>Vaquillas</th><th>Total</th><th>Δ Total</th></tr></thead><tbody>`;
  let prev=null;
  rowsY.forEach(y=>{const t=sumY(y),d=prev?(t/prev-1)*100:null,partial=!fullYears.includes(y);
    h+=`<tr><td>${y}${partial?" *":""}</td><td>${fmt(sumY(y,"novillos"))}</td><td>${fmt(sumY(y,"toros"))}</td>
      <td>${fmt(sumY(y,"vacas"))}</td><td>${y<2019?"—":fmt(sumY(y,"vaquillas"))}</td>
      <td><strong>${fmt(t)}</strong></td>
      <td class="${d==null?"":d>=0?"pos":"neg"}">${(d==null||partial)?"":sign(d)}</td></tr>`;
    if(!partial)prev=t;});
  document.getElementById("tblCatAnnual").innerHTML=h+`</tbody>`;
})();

/* ===================== MACHOS VS HEMBRAS ===================== */
(function(){
  const last12=D.slice(-12),prev12=D.slice(-24,-12);
  const hp=a=>a.reduce((s,r)=>s+hembras(r),0)/a.reduce((s,r)=>s+r.total,0)*100;
  const h1=hp(last12),h0=hp(prev12);
  const vq=last12.filter(r=>r.vaquillas!=null);
  const vqs=vq.reduce((s,r)=>s+r.vaquillas,0)/vq.reduce((s,r)=>s+hembras(r),0)*100;
  const ratio=last12.reduce((s,r)=>s+machos(r),0)/last12.reduce((s,r)=>s+hembras(r),0);
  document.getElementById("kpiSexo").innerHTML=`
    <div class="kpi accent"><div class="lbl">% hembras · últimos 12 m</div><div class="val">${pct(h1)}</div>
      <div class="sub">${h1>=45?"zona de liquidación":h1>=42?"neutral-alta":"retención relativa"}</div></div>
    <div class="kpi"><div class="lbl">12 meses anteriores</div><div class="val">${pct(h0)}</div>
      <div class="sub">${h1>h0?"se acelera la faena de hembras":"se modera"}</div></div>
    <div class="kpi"><div class="lbl">Ratio machos / hembras</div><div class="val">${ratio.toFixed(2).replace(".",",")}</div>
      <div class="sub">cabezas macho por hembra</div></div>
    <div class="kpi"><div class="lbl">Vaquillas / hembras · 12 m</div><div class="val">${pct(vqs)}</div>
      <div class="sub">peso de hembras jóvenes</div></div>`;

  const lab=[],val=[];
  for(let i=11;i<D.length;i++){lab.push(labelOf(D[i].fecha));val.push(+hp(D.slice(i-11,i+1)).toFixed(2));}
  make("chHembrasPct",{type:"line",
    data:{labels:lab,datasets:[
      {label:"% hembras (MM 12 m)",data:val,borderColor:C.clay,backgroundColor:C.clay+"22",fill:true,pointRadius:0,borderWidth:2.5,tension:.2},
      {label:"Umbral 45 %",data:val.map(()=>45),borderColor:C.alert,borderDash:[6,5],pointRadius:0,borderWidth:1.5}]},
    options:{maintainAspectRatio:false,
      plugins:{tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${pct(c.parsed.y)}`}}},
      scales:{x:{ticks:{maxTicksLimit:14}},y:{ticks:{callback:v=>v+" %"}}}}});

  make("chSexoAnnual",{type:"bar",
    data:{labels:fullYears,datasets:[
      {label:"Machos",data:fullYears.map(y=>byYear[y].reduce((s,r)=>s+machos(r),0)),backgroundColor:C.pine,stack:"s"},
      {label:"Hembras",data:fullYears.map(y=>byYear[y].reduce((s,r)=>s+hembras(r),0)),backgroundColor:C.clay,stack:"s"}]},
    options:{maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:M_}}}}});

  const y19=years.filter(y=>y>=2019);
  make("chVaqShare",{type:"bar",
    data:{labels:y19.map(y=>fullYears.includes(y)?y:y+" *"),datasets:[{label:"Vaquillas % de hembras",
      data:y19.map(y=>+(sumY(y,"vaquillas")/byYear[y].reduce((s,r)=>s+hembras(r),0)*100).toFixed(1)),
      backgroundColor:C.wheat,borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>" "+pct(c.parsed.y)}}},
      scales:{y:{ticks:{callback:v=>v+" %"}}}}});
})();

/* ===================== ESTACIONALIDAD ===================== */
(function(){
  function idxArr(from){ const ys=fullYears.filter(y=>y>=from); const idx=Array(12).fill(0);
    ys.forEach(y=>{const avg=sumY(y)/12; byYear[y].forEach((r,m)=>idx[m]+=r.total/avg*100);});
    return idx.map(v=>+(v/ys.length).toFixed(1)); }
  function season(from){ const idx=idxArr(from);
    make("chSeason",{type:"bar",data:{labels:MES,datasets:[{label:"Índice",data:idx,
      backgroundColor:idx.map(v=>v>=100?C.pine:C.pine+"66"),borderRadius:4}]},
      options:{maintainAspectRatio:false,plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>" índice "+String(c.parsed.y).replace(".",",")}}},
        scales:{y:{suggestedMin:80,suggestedMax:120}}}});
  }
  season(2019); seg("segSeason",b=>season(+b.dataset.from));

  // banda mín-máx-prom (desde 2019)
  const ys=fullYears.filter(y=>y>=2019);
  const mn=[],mx=[],av=[];
  for(let m=0;m<12;m++){const vals=ys.map(y=>byYear[y][m].total);
    mn.push(Math.min(...vals));mx.push(Math.max(...vals));av.push(Math.round(vals.reduce((a,b)=>a+b,0)/vals.length));}
  make("chSeasonBand",{type:"line",
    data:{labels:MES,datasets:[
      {label:"Máximo",data:mx,borderColor:"transparent",backgroundColor:C.pine+"22",fill:"+1",pointRadius:0},
      {label:"Mínimo",data:mn,borderColor:"transparent",backgroundColor:"transparent",fill:false,pointRadius:0},
      {label:"Promedio",data:av,borderColor:C.pine,backgroundColor:C.pine,fill:false,pointRadius:3,borderWidth:2.5,tension:.2}]},
    options:{maintainAspectRatio:false,plugins:{legend:{labels:{filter:i=>i.text!=="Mínimo"}}},
      scales:{y:{ticks:{callback:fmt}}}}});

  // YoY overlay
  const yo=years.slice(-5),pal=["#C9D2CB","#90A99B",C.steel,C.clay,C.pine];
  make("chYoY",{type:"line",
    data:{labels:MES,datasets:yo.map((y,i)=>({label:String(y)+(fullYears.includes(y)?"":" *"),
      data:MES.map((_,m)=>byYear[y][m]?.total??null),borderColor:pal[i],borderWidth:y===LY?3:2,
      pointRadius:2,tension:.15,spanGaps:false}))},
    options:{maintainAspectRatio:false,scales:{y:{ticks:{callback:fmt}}}}});

  // heatmap
  const all=D.map(r=>r.total),lo=Math.min(...all),hi=Math.max(...all);
  const shade=v=>{const t=(v-lo)/(hi-lo),mix=(a,b)=>Math.round(a+(b-a)*t);
    return`rgb(${mix(232,18)},${mix(238,90)},${mix(229,62)})`;};
  let h=`<thead><tr><th></th>${MES.map(m=>`<th>${m}</th>`).join("")}</tr></thead><tbody>`;
  [...years].reverse().forEach(y=>{h+=`<tr><td class="yr">${y}</td>`;
    for(let m=0;m<12;m++){const r=byYear[y][m];
      h+= r? `<td style="background:${shade(r.total)};color:${(r.total-lo)/(hi-lo)>.45?"#fff":"#14201A"}">${fmt(r.total)}</td>`
            : `<td style="background:#F4F6F2;color:#aab5ac">·</td>`;}
    h+=`</tr>`;});
  document.getElementById("tblHeat").innerHTML=h+`</tbody>`;
})();

/* ===================== COMPARAR ===================== */
(function(){
  const selA=document.getElementById("cmpA"),selB=document.getElementById("cmpB");
  const opts=[...years].reverse().map(y=>`<option value="${y}">${y}${fullYears.includes(y)?"":" (parcial)"}</option>`).join("");
  selA.innerHTML=opts; selB.innerHTML=opts;
  selA.value=String(LY); selB.value=String(LY-1);
  const CATS=[["Novillos","novillos",C.pine],["Toros","toros",C.steel],["Vacas","vacas",C.clay],["Vaquillas","vaquillas",C.wheat]];

  function render(){
    const A=+selA.value,B=+selB.value;
    const partial=!fullYears.includes(A)||!fullYears.includes(B);
    const upto=partial?Math.min(byYear[A].length,byYear[B].length):12;
    const sub=(y,k="total")=>byYear[y].slice(0,upto).reduce((s,r)=>s+(r[k]??0),0);
    document.getElementById("cmpMode").textContent=partial
      ? `Comparando meses ene–${MES[upto-1].toLowerCase()} (período común).`:`Años completos.`;

    const tA=sub(A),tB=sub(B),dT=(tA/tB-1)*100;
    const hA=byYear[A].slice(0,upto).reduce((s,r)=>s+hembras(r),0)/tA*100;
    const hB=byYear[B].slice(0,upto).reduce((s,r)=>s+hembras(r),0)/tB*100;
    document.getElementById("cmpKpis").innerHTML=`
      <div class="kpi"><div class="lbl">Total ${A}</div><div class="val">${fmt(tA)}</div><div class="sub">cabezas</div></div>
      <div class="kpi"><div class="lbl">Total ${B}</div><div class="val">${fmt(tB)}</div><div class="sub">cabezas</div></div>
      <div class="kpi accent"><div class="lbl">Diferencia ${A} vs ${B}</div>
        <div class="val ${dT>=0?"up":"down"}">${sign(dT)}</div><div class="sub">${fmt(tA-tB)} cabezas</div></div>
      <div class="kpi"><div class="lbl">% hembras</div><div class="val">${pct(hA)} <span style="font-size:.7em;color:var(--soft)">vs ${pct(hB)}</span></div>
        <div class="sub">${hA>hB?"más hembras en "+A:"menos hembras en "+A}</div></div>`;

    make("chCompare",{type:"bar",
      data:{labels:MES.slice(0,upto),datasets:[
        {label:String(B),data:byYear[B].slice(0,upto).map(r=>r.total),backgroundColor:C.line,borderColor:C.soft,borderWidth:1,borderRadius:3},
        {label:String(A),data:byYear[A].slice(0,upto).map(r=>r.total),backgroundColor:C.pine,borderRadius:3}]},
      options:{maintainAspectRatio:false,scales:{y:{ticks:{callback:fmt}}}}});

    let h=`<thead><tr><th>Categoría</th><th>${B}</th><th>${A}</th><th>Δ abs.</th><th>Δ %</th></tr></thead><tbody>`;
    CATS.forEach(([l,k])=>{const a=sub(A,k),b=sub(B,k);
      if((k==="vaquillas")&&(A<2019||B<2019)){h+=`<tr><td>${l}</td><td>${B<2019?"—":fmt(b)}</td><td>${A<2019?"—":fmt(a)}</td><td>—</td><td>—</td></tr>`;return;}
      const d=a-b,dp=(a/b-1)*100;
      h+=`<tr><td>${l}</td><td>${fmt(b)}</td><td>${fmt(a)}</td>
        <td class="${d>=0?"pos":"neg"}">${d>=0?"+":""}${fmt(d)}</td>
        <td class="${dp>=0?"pos":"neg"}">${sign(dp)}</td></tr>`;});
    h+=`</tbody><tfoot><tr><td>Total</td><td>${fmt(tB)}</td><td>${fmt(tA)}</td>
      <td class="${tA-tB>=0?"pos":"neg"}">${tA-tB>=0?"+":""}${fmt(tA-tB)}</td>
      <td class="${dT>=0?"pos":"neg"}">${sign(dT)}</td></tr></tfoot>`;
    document.getElementById("tblCompare").innerHTML=h;
    document.getElementById("cmpTblNote").textContent=
      `${A} vs ${B}${partial?` · período ene–${MES[upto-1].toLowerCase()}`:""}.`;
  }
  selA.addEventListener("change",render); selB.addEventListener("change",render);
  document.getElementById("cmpSwap").addEventListener("click",()=>{const t=selA.value;selA.value=selB.value;selB.value=t;render();});
  render();
})();

/* ===================== DATOS ===================== */
(function(){
  const sel=document.getElementById("selYear");
  sel.innerHTML=`<option value="all">Todos los años</option>`+[...years].reverse().map(y=>`<option value="${y}">${y}</option>`).join("");
  sel.value=String(LY);
  function render(){const v=sel.value,rows=v==="all"?D:byYear[+v];
    let h=`<thead><tr><th>Mes</th><th>Novillos</th><th>Toros</th><th>Vacas</th><th>Vaquillas</th><th>Total</th><th>Δ interanual</th></tr></thead><tbody>`;
    [...rows].reverse().forEach(r=>{const prev=D.find(x=>x.fecha===(+r.fecha.slice(0,4)-1)+r.fecha.slice(4));
      const d=prev?(r.total/prev.total-1)*100:null;
      h+=`<tr><td>${MESL[+r.fecha.slice(5,7)-1]} ${r.fecha.slice(0,4)}</td>
        <td>${fmt(r.novillos)}</td><td>${fmt(r.toros)}</td><td>${fmt(r.vacas)}</td>
        <td>${fmt(r.vaquillas)}</td><td><strong>${fmt(r.total)}</strong></td>
        <td class="${d==null?"":d>=0?"pos":"neg"}">${d==null?"":sign(d)}</td></tr>`;});
    document.getElementById("tblData").innerHTML=h+`</tbody>`;}
  sel.addEventListener("change",render); render();
  document.getElementById("btnCSV").addEventListener("click",()=>{
    let csv="fecha;novillos;toros;vacas;vaquillas;total\n";
    D.forEach(r=>csv+=`${r.fecha};${r.novillos};${r.toros};${r.vacas};${r.vaquillas??""};${r.total}\n`);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=`bovidatapy_${D[0].fecha}_${LAST.fecha}.csv`; a.click(); URL.revokeObjectURL(a.href);});
})();

/* ===================== PROBABILIDADES ESTACIONALES ===================== */
(function(){
  const ys = fullYears.filter(y=>y>=2019);
  // P(mes > promedio del año) y P(mes sube vs mes anterior)
  const pAbove=[], pUp=[];
  for(let m=0;m<12;m++){
    let above=0, up=0, upN=0;
    ys.forEach(y=>{
      const avg=sumY(y)/12;
      if(byYear[y][m].total>avg) above++;
      const prev = m>0 ? byYear[y][m-1] : (byYear[y-1]?.[11] ?? null);
      if(prev){ upN++; if(byYear[y][m].total>prev.total) up++; }
    });
    pAbove.push(Math.round(above/ys.length*100));
    pUp.push(upN?Math.round(up/upN*100):null);
  }
  make("chProb",{type:"bar",
    data:{labels:MES,datasets:[
      {label:"P(supera promedio anual)",data:pAbove,backgroundColor:C.pine,borderRadius:4},
      {label:"P(sube vs mes anterior)",data:pUp,backgroundColor:C.wheat,borderRadius:4}]},
    options:{maintainAspectRatio:false,
      plugins:{tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${c.parsed.y} %`}}},
      scales:{y:{min:0,max:100,ticks:{callback:v=>v+" %"}}}}});

  // tabla estadística por mes
  const med=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  let h=`<thead><tr><th>Mes</th><th>Promedio</th><th>Mediana</th><th>Mínimo</th><th>Máximo</th><th>CV</th><th>P(&gt;prom. año)</th></tr></thead><tbody>`;
  for(let m=0;m<12;m++){
    const vals=ys.map(y=>byYear[y][m].total);
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    const sd=Math.sqrt(vals.reduce((s,v)=>s+(v-avg)**2,0)/vals.length);
    h+=`<tr><td>${MESL[m]}</td><td>${fmt(avg)}</td><td>${fmt(med(vals))}</td>
      <td>${fmt(Math.min(...vals))}</td><td>${fmt(Math.max(...vals))}</td>
      <td>${pct(sd/avg*100,1)}</td><td>${pAbove[m]} %</td></tr>`;
  }
  document.getElementById("tblMonthStats").innerHTML=h+`</tbody>`;
})();

/* ===================== ESTADÍSTICAS ===================== */
(function(){
  /* ---- CAGR ---- */
  const cagr=(y0,y1)=> (Math.pow(sumY(y1)/sumY(y0),1/(y1-y0))-1)*100;
  const windows=[[fullYears[0],lastFull],[lastFull-15,lastFull],[lastFull-10,lastFull],[lastFull-5,lastFull]]
    .filter(([a])=>fullYears.includes(a));
  make("chCagr",{type:"bar",
    data:{labels:windows.map(([a,b])=>`${a}–${b}`),datasets:[{label:"CAGR",
      data:windows.map(([a,b])=>+cagr(a,b).toFixed(2)),
      backgroundColor:windows.map(([a,b])=>cagr(a,b)>=0?C.pine:C.alert),borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>" "+sign(c.parsed.y,2)+" anual"}}},
      scales:{y:{ticks:{callback:v=>v+" %"}}}}});

  /* ---- variación interanual mensual: serie + histograma ---- */
  const yoy=[];
  D.forEach(r=>{const p=D.find(x=>x.fecha===(+r.fecha.slice(0,4)-1)+r.fecha.slice(4));
    if(p) yoy.push({f:r.fecha,v:(r.total/p.total-1)*100});});
  const bins=[-100,-40,-30,-20,-10,0,10,20,30,40,100];
  const counts=Array(bins.length-1).fill(0);
  yoy.forEach(o=>{for(let i=0;i<bins.length-1;i++) if(o.v>=bins[i]&&o.v<bins[i+1]){counts[i]++;break;}});
  const binLab=bins.slice(0,-1).map((b,i)=> i===0?"< −40 %": i===bins.length-2?"> +40 %": `${b>=0?"+":""}${b} a ${bins[i+1]>=0?"+":""}${bins[i+1]} %`);
  make("chYoYDist",{type:"bar",
    data:{labels:binLab,datasets:[{label:"Meses",data:counts,
      backgroundColor:binLab.map((_,i)=>bins[i]<0?C.alert+"B0":C.pine+"B0"),borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>` ${c.parsed.y} meses (${pct(c.parsed.y/yoy.length*100)})`}}},
      scales:{y:{ticks:{precision:0}}}}});
  const yoyVals=yoy.map(o=>o.v);
  // volatilidad típica: últimos 10 años (evita la distorsión de los shocks 2011-2012)
  const yoy10=yoy.filter(o=>+o.f.slice(0,4)>=LY-10).map(o=>o.v);
  const yoyAvg=yoy10.reduce((a,b)=>a+b,0)/yoy10.length;
  const yoySd=Math.sqrt(yoy10.reduce((s,v)=>s+(v-yoyAvg)**2,0)/yoy10.length);
  const pPos=yoy10.filter(v=>v>0).length/yoy10.length*100;

  /* ---- proyección año en curso ---- */
  const baseYs=fullYears.filter(y=>y>=2019);
  const share=Array(12).fill(0);
  baseYs.forEach(y=>{const t=sumY(y); byYear[y].forEach((r,m)=>share[m]+=r.total/t);});
  for(let m=0;m<12;m++) share[m]/=baseYs.length;
  const cumShare=share.slice(0,LM).reduce((a,b)=>a+b,0);
  const ytd=sumY(LY);
  const projAnnual=Math.round(ytd/cumShare);
  // rango: proyectando con el patrón estacional de cada año base por separado
  const projRange=baseYs.map(y=>{const t=sumY(y);
    const cs=byYear[y].slice(0,LM).reduce((s,r)=>s+r.total,0)/t;
    return ytd/cs;});
  const projMin=Math.round(Math.min(...projRange)), projMax=Math.round(Math.max(...projRange));
  const projMonths=share.map((s,m)=> m<LM ? null : Math.round(projAnnual*s));
  document.getElementById("projYearLbl").textContent=LY;
  document.getElementById("projNote").textContent=
    `Método: el acumulado ene–${MESL[LM-1].toLowerCase()} representa históricamente el ${pct(cumShare*100)} del año (patrón estacional ${baseYs[0]}–${lastFull}). `+
    `Proyección anual: ${fmt(projAnnual)} cabezas (rango ${fmt(projMin)}–${fmt(projMax)} según el patrón de cada año base). Indicativa, no es un pronóstico.`;
  make("chProjection",{type:"bar",
    data:{labels:MES,datasets:[
      {label:`${LY} real`,data:byYear[LY].map(r=>r.total).concat(Array(12-LM).fill(null)),backgroundColor:C.pine,borderRadius:4},
      {label:`${LY} proyectado`,data:projMonths,backgroundColor:C.wheat+"70",borderColor:C.wheat,borderWidth:2,borderRadius:4},
      {label:`${LY-1}`,type:"line",data:byYear[LY-1].map(r=>r.total),borderColor:C.soft,borderWidth:2,pointRadius:2,tension:.15}]},
    options:{maintainAspectRatio:false,scales:{y:{ticks:{callback:fmt}}}}});

  /* ---- anomalías: ratio vs media móvil 12m, z por mes calendario ---- */
  const ma=i=>{ // media móvil centrada (12m) con fallback a móvil simple en los bordes
    const a=Math.max(0,i-6), b=Math.min(D.length,i+6);
    const w=D.slice(a,b); return w.reduce((s,r)=>s+r.total,0)/w.length; };
  const ratios=D.map((r,i)=>({f:r.fecha,t:r.total,m:+r.fecha.slice(5,7)-1,r:r.total/ma(i)}));
  const byM=Array.from({length:12},()=>[]);
  ratios.forEach(o=>byM[o.m].push(o.r));
  const mAvg=byM.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  const mSd=byM.map((a,m)=>Math.sqrt(a.reduce((s,v)=>s+(v-mAvg[m])**2,0)/a.length));
  const notes={"2011-09":"Brote de fiebre aftosa (San Pedro) — cierre de exportaciones","2011-10":"Brote de fiebre aftosa — mínimo histórico de la serie","2011-11":"Recuperación parcial post-aftosa","2011-12":"Recuperación parcial post-aftosa"};
  const anomalies=ratios.map(o=>({...o,z:(o.r-mAvg[o.m])/mSd[o.m]}))
    .filter(o=>Math.abs(o.z)>=2).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z)).slice(0,14);
  let h=`<thead><tr><th>Mes</th><th>Cabezas</th><th>Desvío vs tendencia</th><th>z</th><th>Observación</th></tr></thead><tbody>`;
  anomalies.forEach(o=>{const dev=(o.r-1)*100;
    h+=`<tr><td>${MESL[o.m]} ${o.f.slice(0,4)}</td><td>${fmt(o.t)}</td>
      <td class="${dev>=0?"pos":"neg"}">${sign(dev)}</td>
      <td>${o.z.toFixed(1).replace(".",",")}</td>
      <td>${notes[o.f]??""}</td></tr>`;});
  document.getElementById("tblAnomalies").innerHTML=h+`</tbody>`;

  /* ---- KPIs ---- */
  const c20=cagr(fullYears[0],lastFull), c5=cagr(lastFull-5,lastFull);
  const yoyYtd=(ytd/byYear[LY-1].filter(r=>+r.fecha.slice(5,7)<=LM).reduce((s,r)=>s+r.total,0)-1)*100;
  const projVsPrev=(projAnnual/sumY(lastFull)-1)*100;
  document.getElementById("kpiStats").innerHTML=`
    <div class="kpi accent"><div class="lbl">Proyección ${LY}</div><div class="val">${M_(projAnnual)}</div>
      <div class="sub">${sign(projVsPrev)} vs ${lastFull} · rango ${M_(projMin)}–${M_(projMax)}</div></div>
    <div class="kpi"><div class="lbl">CAGR ${fullYears[0]}–${lastFull}</div><div class="val">${sign(c20,1)}</div>
      <div class="sub">crecimiento anual compuesto</div></div>
    <div class="kpi"><div class="lbl">CAGR últimos 5 años</div><div class="val">${sign(c5,1)}</div>
      <div class="sub">${c5>=0?"expansión reciente":"contracción reciente"}</div></div>
    <div class="kpi"><div class="lbl">Variación interanual típica · 10 a</div><div class="val">± ${pct(yoySd)}</div>
      <div class="sub">desvío estándar mensual · ${pct(pPos,0)} de los meses sube</div></div>`;

  /* ---- lecturas automáticas ---- */
  const ins=[];
  const cls=v=>v>=0?"":"warn";
  // 1. estado del año
  ins.push({c:cls(yoyYtd),t:`<b>${LY}</b> acumula <b>${fmt(ytd)}</b> cabezas a ${MESL[LM-1].toLowerCase()}: <b>${sign(yoyYtd)}</b> frente al mismo período de ${LY-1}${yoyYtd<0?` (${fmt(byYear[LY-1].filter(r=>+r.fecha.slice(5,7)<=LM).reduce((s,r)=>s+r.total,0)-ytd)} cabezas menos)`:""}.`});
  // 2. último mes vs su promedio histórico reciente
  const m0=LM-1, avgM=baseYs.map(y=>byYear[y][m0].total).reduce((a,b)=>a+b,0)/baseYs.length;
  const dM=(LAST.total/avgM-1)*100;
  ins.push({c:cls(dM),t:`${MESL[m0]} ${LY} quedó <b>${sign(dM)}</b> respecto al ${MESL[m0].toLowerCase()} promedio de ${baseYs[0]}–${lastFull} (${fmt(avgM)} cabezas).`});
  // 3. proyección
  ins.push({c:cls(projVsPrev),t:`Si ${LY} sigue el patrón estacional histórico, cerraría en torno a <b>${fmt(projAnnual)}</b> cabezas (<b>${sign(projVsPrev)}</b> vs ${lastFull}).`});
  // 4. hembras
  const hpNow=D.slice(-12).reduce((s,r)=>s+hembras(r),0)/D.slice(-12).reduce((s,r)=>s+r.total,0)*100;
  const hpPrev=D.slice(-24,-12).reduce((s,r)=>s+hembras(r),0)/D.slice(-24,-12).reduce((s,r)=>s+r.total,0)*100;
  ins.push({c:hpNow>=45?"warn":"",t:`La participación de hembras en los últimos 12 meses es <b>${pct(hpNow)}</b> (antes ${pct(hpPrev)}): ${hpNow>=45?"zona de <b>liquidación de rodeo</b> — presión sobre el stock futuro":hpNow>hpPrev?"sube, acercándose a zona de liquidación":"compatible con <b>retención de vientres</b>"}.`});
  // 5. vaquillas
  const vqYs=fullYears.filter(y=>y>=2019);
  const vqShare=y=>sumY(y,"vaquillas")/byYear[y].reduce((s,r)=>s+hembras(r),0)*100;
  ins.push({c:"",t:`Las vaquillas pasaron de <b>${pct(vqShare(2019))}</b> de las hembras faenadas en 2019 a <b>${pct(vqShare(lastFull))}</b> en ${lastFull}: cada vez se faenan hembras más jóvenes.`});
  // 6. estacionalidad
  const idx=Array(12).fill(0); baseYs.forEach(y=>{const a=sumY(y)/12;byYear[y].forEach((r,m)=>idx[m]+=r.total/a*100);});
  const bestM=idx.indexOf(Math.max(...idx)), worstM=idx.indexOf(Math.min(...idx));
  ins.push({c:"",t:`El mes estacionalmente más fuerte es <b>${MESL[bestM]}</b> (índice ${Math.round(idx[bestM]/baseYs.length)}) y el más débil <b>${MESL[worstM]}</b> (índice ${Math.round(idx[worstM]/baseYs.length)}).`});
  // 7. récord/atípico más reciente
  const recent=anomalies.filter(o=>o.f>= (LY-2)+"-01");
  if(recent.length){const o=recent[0];
    ins.push({c:o.z<0?"warn":"",t:`Mes atípico reciente: <b>${MESL[o.m]} ${o.f.slice(0,4)}</b> se desvió <b>${sign((o.r-1)*100)}</b> de la tendencia desestacionalizada (z = ${o.z.toFixed(1).replace(".",",")}).`});}
  document.getElementById("insightsList").innerHTML=ins.map(i=>`<li class="${i.c}">${i.t}</li>`).join("");
})();
