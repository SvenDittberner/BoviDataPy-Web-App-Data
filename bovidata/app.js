/* ===================================================================
   BoviData — app.js
   Toda la lógica de análisis y visualización. Los datos viven en
   data.js (const FAENA_DATA). Para actualizar la base solo se toca
   data.js; este archivo no necesita cambios mes a mes.
=================================================================== */
"use strict";

/* ---------- helpers ---------- */
const C = {
  pine: "#1F5C3D", steel: "#2E7DA6", ochre: "#C26A2E",
  gold: "#D9A53B", ink: "#16201B", soft: "#5A6A60",
  alert: "#9C3A2E", line: "#DDE3DC",
};
const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt = (n) => n == null ? "—" : n.toLocaleString("es-PY");
const pct = (n, d = 1) => n == null ? "—" : n.toFixed(d).replace(".", ",") + " %";
const labelOf = (f) => MES[+f.slice(5, 7) - 1] + " " + f.slice(2, 4);

const D = FAENA_DATA; // serie ordenada cronológicamente
const LAST = D[D.length - 1];
const LAST_YEAR = +LAST.fecha.slice(0, 4);
const LAST_MONTH = +LAST.fecha.slice(5, 7);

/* agregados por año */
const years = [...new Set(D.map(r => +r.fecha.slice(0, 4)))];
const byYear = {};
for (const y of years) byYear[y] = D.filter(r => +r.fecha.slice(0, 4) === y);
const yearSum = (y, k = "total") => byYear[y].reduce((s, r) => s + (r[k] ?? 0), 0);
const fullYears = years.filter(y => byYear[y].length === 12);

/* machos / hembras (consistente en toda la serie: pre-2019 vaquillas ⊂ vacas) */
const machos = (r) => r.novillos + r.toros;
const hembras = (r) => r.vacas + (r.vaquillas ?? 0);

Chart.defaults.font.family = '"IBM Plex Mono", monospace';
Chart.defaults.font.size = 11;
Chart.defaults.color = C.soft;
Chart.defaults.borderColor = C.line;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 12;
Chart.defaults.plugins.tooltip.callbacks = {
  label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? ctx.parsed)}`
};
const charts = {};
function make(id, cfg) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), cfg);
}

/* ===================================================================
   FIRMA — tira de pulso (244 barras, una por mes)
=================================================================== */
(function pulseStrip() {
  const strip = document.getElementById("pulseStrip");
  const tip = document.getElementById("pulseTip");
  const max = Math.max(...D.map(r => r.total));
  for (const r of D) {
    const s = document.createElement("span");
    s.style.height = Math.max(2, (r.total / max) * 100) + "%";
    s.dataset.f = r.fecha; s.dataset.t = r.total;
    strip.appendChild(s);
  }
  strip.addEventListener("mousemove", (e) => {
    const t = e.target;
    if (t.tagName !== "SPAN") { tip.hidden = true; return; }
    tip.textContent = `${labelOf(t.dataset.f)} · ${fmt(+t.dataset.t)} cab.`;
    tip.style.left = Math.min(e.clientX + 12, innerWidth - 180) + "px";
    tip.style.top = (e.clientY + 14) + "px";
    tip.hidden = false;
  });
  strip.addEventListener("mouseleave", () => tip.hidden = true);
  document.getElementById("brandRange").textContent =
    D[0].fecha.slice(0, 4) + " – " + LAST.fecha.slice(0, 4);
})();

/* ===================================================================
   TABS
=================================================================== */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

/* ===================================================================
   RESUMEN
=================================================================== */
(function resumen() {
  // KPIs
  const prevSame = D.find(r => r.fecha === (LAST_YEAR - 1) + LAST.fecha.slice(4));
  const yoyMonth = prevSame ? (LAST.total / prevSame.total - 1) * 100 : null;

  const ytd = byYear[LAST_YEAR].reduce((s, r) => s + r.total, 0);
  const ytdPrev = byYear[LAST_YEAR - 1]
    .filter(r => +r.fecha.slice(5, 7) <= LAST_MONTH)
    .reduce((s, r) => s + r.total, 0);
  const yoyYtd = (ytd / ytdPrev - 1) * 100;

  const lastFull = fullYears[fullYears.length - 1];
  const recMonth = D.reduce((a, b) => b.total > a.total ? b : a);

  const arrow = (v) => v == null ? "" :
    `<span class="${v >= 0 ? "up" : "down"}">${v >= 0 ? "▲" : "▼"} ${pct(Math.abs(v))}</span>`;

  document.getElementById("kpiGrid").innerHTML = `
    <div class="kpi"><div class="lbl">Último mes · ${labelOf(LAST.fecha)}</div>
      <div class="val">${fmt(LAST.total)}</div>
      <div class="sub">${arrow(yoyMonth)} vs. ${labelOf(prevSame?.fecha ?? "")}</div></div>
    <div class="kpi"><div class="lbl">Acumulado ${LAST_YEAR} (ene–${MES[LAST_MONTH-1].toLowerCase()})</div>
      <div class="val">${fmt(ytd)}</div>
      <div class="sub">${arrow(yoyYtd)} vs. mismo período ${LAST_YEAR - 1}</div></div>
    <div class="kpi"><div class="lbl">Año completo ${lastFull}</div>
      <div class="val">${fmt(yearSum(lastFull))}</div>
      <div class="sub">cabezas faenadas</div></div>
    <div class="kpi"><div class="lbl">Récord mensual</div>
      <div class="val">${fmt(recMonth.total)}</div>
      <div class="sub">${labelOf(recMonth.fecha)}</div></div>`;

  // anual
  const annualVals = fullYears.map(y => yearSum(y));
  make("chAnnual", {
    type: "bar",
    data: { labels: fullYears, datasets: [{
      label: "Cabezas / año", data: annualVals,
      backgroundColor: fullYears.map(y => y === lastFull ? C.pine : C.pine + "B3"),
      borderRadius: 3,
    }]},
    options: { maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => (v / 1e6).toFixed(1).replace(".", ",") + " M" } } } }
  });
  document.getElementById("annualNote").textContent =
    `Años completos ${fullYears[0]}–${lastFull}. ${LAST_YEAR} acumula ${fmt(ytd)} cabezas a ${MES[LAST_MONTH-1].toLowerCase()}.`;

  // mensual con selector de rango
  function drawMonthly(months) {
    const slice = months ? D.slice(-months) : D;
    make("chMonthly", {
      type: "line",
      data: { labels: slice.map(r => labelOf(r.fecha)), datasets: [{
        label: "Faena mensual", data: slice.map(r => r.total),
        borderColor: C.pine, backgroundColor: C.pine + "22",
        fill: true, pointRadius: slice.length > 80 ? 0 : 2, borderWidth: 2, tension: .25,
      }]},
      options: { maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { maxTicksLimit: 14 } },
          y: { ticks: { callback: v => fmt(v) } } } }
    });
  }
  drawMonthly(24);
  segWire("segMonthly", b => drawMonthly(+b.dataset.months));

  // acumulado por año (últimos 4 años)
  const cumYears = years.slice(-4);
  const palette = [C.line, C.steel, C.ochre, C.pine];
  make("chCumulative", {
    type: "line",
    data: { labels: MES, datasets: cumYears.map((y, i) => {
      let acc = 0;
      const vals = byYear[y].map(r => acc += r.total);
      return { label: String(y), data: vals,
        borderColor: palette[i] ?? C.ink, borderWidth: y === LAST_YEAR ? 3 : 2,
        pointRadius: 2, tension: .15 };
    })},
    options: { maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => (v / 1e6).toFixed(1).replace(".", ",") + " M" } } } }
  });
})();

/* ===================================================================
   CATEGORÍAS
=================================================================== */
(function categorias() {
  function drawStack(from) {
    const slice = from === "all" ? D : D.filter(r => r.fecha >= from);
    const pre2019 = from === "all";
    const ds = [
      { label: "Novillos", key: "novillos", color: C.pine },
      { label: "Toros", key: "toros", color: C.steel },
      { label: pre2019 ? "Vacas (incl. vaquillas antes de 2019)" : "Vacas", key: "vacas", color: C.ochre },
      { label: "Vaquillas", key: "vaquillas", color: C.gold },
    ];
    make("chCatStack", {
      type: "bar",
      data: { labels: slice.map(r => labelOf(r.fecha)), datasets: ds.map(d => ({
        label: d.label, data: slice.map(r => r[d.key] ?? 0),
        backgroundColor: d.color, stack: "s",
      }))},
      options: { maintainAspectRatio: false,
        scales: { x: { stacked: true, ticks: { maxTicksLimit: 14 } },
          y: { stacked: true, ticks: { callback: v => fmt(v) } } } }
    });
  }
  drawStack("2019-01");
  segWire("segCatRange", b => drawStack(b.dataset.from));

  // participación anual %
  const ys = fullYears;
  const shareDs = [
    ["Novillos", "novillos", C.pine], ["Toros", "toros", C.steel],
    ["Vacas", "vacas", C.ochre], ["Vaquillas", "vaquillas", C.gold],
  ].map(([label, key, color]) => ({
    label, borderColor: color, backgroundColor: color, pointRadius: 2, borderWidth: 2, tension: .2,
    data: ys.map(y => {
      const tot = yearSum(y);
      const v = yearSum(y, key);
      return key === "vaquillas" && y < 2019 ? null : +(v / tot * 100).toFixed(1);
    }),
  }));
  make("chCatShare", {
    type: "line",
    data: { labels: ys, datasets: shareDs },
    options: { maintainAspectRatio: false, spanGaps: false,
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${pct(c.parsed.y)}` } } },
      scales: { y: { ticks: { callback: v => v + " %" } } } }
  });

  // tabla anual
  const rowsY = [...fullYears];
  if (!fullYears.includes(LAST_YEAR)) rowsY.push(LAST_YEAR);
  let html = `<thead><tr><th>Año</th><th>Novillos</th><th>Toros</th><th>Vacas</th><th>Vaquillas</th><th>Total</th><th>Δ Total</th></tr></thead><tbody>`;
  let prev = null;
  for (const y of rowsY) {
    const t = yearSum(y);
    const d = prev ? (t / prev - 1) * 100 : null;
    const partial = !fullYears.includes(y);
    html += `<tr><td>${y}${partial ? " *" : ""}</td>
      <td>${fmt(yearSum(y, "novillos"))}</td><td>${fmt(yearSum(y, "toros"))}</td>
      <td>${fmt(yearSum(y, "vacas"))}</td>
      <td>${y < 2019 ? "—" : fmt(yearSum(y, "vaquillas"))}</td>
      <td><strong>${fmt(t)}</strong></td>
      <td class="${d == null ? "" : d >= 0 ? "pos" : "neg"}">${d == null || partial ? "" : (d >= 0 ? "+" : "") + pct(d)}</td></tr>`;
    prev = partial ? prev : t;
  }
  html += `</tbody>`;
  document.getElementById("tblCatAnnual").innerHTML = html;
})();

/* ===================================================================
   MACHOS VS HEMBRAS
=================================================================== */
(function sexo() {
  // KPI: % hembras últimos 12 meses vs 12 anteriores
  const last12 = D.slice(-12), prev12 = D.slice(-24, -12);
  const hp = (arr) => arr.reduce((s, r) => s + hembras(r), 0) / arr.reduce((s, r) => s + r.total, 0) * 100;
  const h1 = hp(last12), h0 = hp(prev12);
  const vaqArr = last12.filter(r => r.vaquillas != null);
  const vaqShare = vaqArr.reduce((s, r) => s + r.vaquillas, 0) /
                   vaqArr.reduce((s, r) => s + hembras(r), 0) * 100;
  document.getElementById("kpiSexo").innerHTML = `
    <div class="kpi"><div class="lbl">% hembras · últimos 12 m</div>
      <div class="val">${pct(h1)}</div>
      <div class="sub">${h1 >= 45 ? "zona de liquidación" : h1 >= 42 ? "zona neutral-alta" : "zona de retención relativa"}</div></div>
    <div class="kpi"><div class="lbl">12 meses anteriores</div>
      <div class="val">${pct(h0)}</div>
      <div class="sub">${h1 > h0 ? "la faena de hembras se acelera" : "la faena de hembras se modera"}</div></div>
    <div class="kpi"><div class="lbl">Vaquillas / hembras · últimos 12 m</div>
      <div class="val">${pct(vaqShare)}</div>
      <div class="sub">peso de hembras jóvenes</div></div>`;

  // % hembras, media móvil 12m
  const labels = [], vals = [];
  for (let i = 11; i < D.length; i++) {
    const w = D.slice(i - 11, i + 1);
    labels.push(labelOf(D[i].fecha));
    vals.push(+hp(w).toFixed(2));
  }
  make("chHembrasPct", {
    type: "line",
    data: { labels, datasets: [
      { label: "% hembras (MM 12 m)", data: vals,
        borderColor: C.ochre, backgroundColor: C.ochre + "22", fill: true,
        pointRadius: 0, borderWidth: 2, tension: .2 },
      { label: "Umbral 45 %", data: vals.map(() => 45),
        borderColor: C.alert, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.5, fill: false },
    ]},
    options: { maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${pct(c.parsed.y)}` } } },
      scales: { x: { ticks: { maxTicksLimit: 14 } },
        y: { ticks: { callback: v => v + " %" } } } }
  });

  // anual machos vs hembras
  make("chSexoAnnual", {
    type: "bar",
    data: { labels: fullYears, datasets: [
      { label: "Machos (novillos + toros)", data: fullYears.map(y => byYear[y].reduce((s, r) => s + machos(r), 0)), backgroundColor: C.pine, stack: "s" },
      { label: "Hembras (vacas + vaquillas)", data: fullYears.map(y => byYear[y].reduce((s, r) => s + hembras(r), 0)), backgroundColor: C.ochre, stack: "s" },
    ]},
    options: { maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true,
        ticks: { callback: v => (v / 1e6).toFixed(1).replace(".", ",") + " M" } } } }
  });

  // vaquillas / hembras desde 2019
  const y19 = years.filter(y => y >= 2019);
  make("chVaqShare", {
    type: "bar",
    data: { labels: y19.map(y => fullYears.includes(y) ? y : y + " *"), datasets: [{
      label: "Vaquillas como % de hembras faenadas",
      data: y19.map(y => +(yearSum(y, "vaquillas") /
        byYear[y].reduce((s, r) => s + hembras(r), 0) * 100).toFixed(1)),
      backgroundColor: C.gold, borderRadius: 3,
    }]},
    options: { maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => " " + pct(c.parsed.y) } } },
      scales: { y: { ticks: { callback: v => v + " %" } } } }
  });
})();

/* ===================================================================
   ESTACIONALIDAD
=================================================================== */
(function estacionalidad() {
  function seasonIndex(fromYear) {
    const ys = fullYears.filter(y => y >= fromYear);
    const idx = Array(12).fill(0);
    for (const y of ys) {
      const avg = yearSum(y) / 12;
      byYear[y].forEach((r, m) => idx[m] += r.total / avg * 100);
    }
    return idx.map(v => +(v / ys.length).toFixed(1));
  }
  function drawSeason(fromYear) {
    const idx = seasonIndex(fromYear);
    make("chSeason", {
      type: "bar",
      data: { labels: MES, datasets: [{
        label: "Índice (100 = promedio anual)", data: idx,
        backgroundColor: idx.map(v => v >= 100 ? C.pine : C.pine + "59"), borderRadius: 3,
      }]},
      options: { maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: c => " índice " + String(c.parsed.y).replace(".", ",") } } },
        scales: { y: { suggestedMin: 80, suggestedMax: 120 } } }
    });
  }
  drawSeason(2019);
  segWire("segSeason", b => drawSeason(+b.dataset.from));

  // YoY overlay (últimos 5 años)
  const ysOverlay = years.slice(-5);
  const pal = ["#C9D2CB", "#8FA89A", C.steel, C.ochre, C.pine];
  make("chYoY", {
    type: "line",
    data: { labels: MES, datasets: ysOverlay.map((y, i) => ({
      label: String(y) + (fullYears.includes(y) ? "" : " *"),
      data: MES.map((_, m) => byYear[y][m]?.total ?? null),
      borderColor: pal[i], borderWidth: y === LAST_YEAR ? 3 : 2,
      pointRadius: 2, tension: .15, spanGaps: false,
    }))},
    options: { maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => fmt(v) } } } }
  });

  // heatmap
  const all = D.map(r => r.total);
  const mn = Math.min(...all), mx = Math.max(...all);
  const shade = (v) => {
    const t = (v - mn) / (mx - mn);
    // de salvia claro a pino oscuro
    const mix = (a, b) => Math.round(a + (b - a) * t);
    return `rgb(${mix(228, 18)},${mix(236, 70)},${mix(229, 47)})`;
  };
  let h = `<thead><tr><th>Año</th>${MES.map(m => `<th>${m}</th>`).join("")}</tr></thead><tbody>`;
  for (const y of [...years].reverse()) {
    h += `<tr><td class="yr">${y}</td>`;
    for (let m = 0; m < 12; m++) {
      const r = byYear[y][m];
      h += r
        ? `<td style="background:${shade(r.total)};color:${(r.total - mn) / (mx - mn) > .45 ? "#fff" : "#16201B"}" title="${labelOf(r.fecha)}">${fmt(r.total)}</td>`
        : `<td style="background:#fff;color:#aab5ac">·</td>`;
    }
    h += `</tr>`;
  }
  h += `</tbody>`;
  document.getElementById("tblHeat").innerHTML = h;
})();

/* ===================================================================
   DATOS
=================================================================== */
(function datos() {
  const sel = document.getElementById("selYear");
  sel.innerHTML = `<option value="all">Todos los años</option>` +
    [...years].reverse().map(y => `<option value="${y}">${y}</option>`).join("");
  sel.value = String(LAST_YEAR);

  function render() {
    const v = sel.value;
    const rows = v === "all" ? D : byYear[+v];
    let h = `<thead><tr><th>Mes</th><th>Novillos</th><th>Toros</th><th>Vacas</th><th>Vaquillas</th><th>Total</th><th>Δ interanual</th></tr></thead><tbody>`;
    for (const r of [...rows].reverse()) {
      const prev = D.find(x => x.fecha === (+r.fecha.slice(0, 4) - 1) + r.fecha.slice(4));
      const d = prev ? (r.total / prev.total - 1) * 100 : null;
      h += `<tr><td>${labelOf(r.fecha)}</td>
        <td>${fmt(r.novillos)}</td><td>${fmt(r.toros)}</td><td>${fmt(r.vacas)}</td>
        <td>${fmt(r.vaquillas)}</td><td><strong>${fmt(r.total)}</strong></td>
        <td class="${d == null ? "" : d >= 0 ? "pos" : "neg"}">${d == null ? "" : (d >= 0 ? "+" : "") + pct(d)}</td></tr>`;
    }
    document.getElementById("tblData").innerHTML = h + `</tbody>`;
  }
  sel.addEventListener("change", render);
  render();

  document.getElementById("btnCSV").addEventListener("click", () => {
    let csv = "fecha;novillos;toros;vacas;vaquillas;total\n";
    for (const r of D)
      csv += `${r.fecha};${r.novillos};${r.toros};${r.vacas};${r.vaquillas ?? ""};${r.total}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `bovidata_faena_${D[0].fecha}_${LAST.fecha}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();

/* ---------- segment wiring ---------- */
function segWire(id, fn) {
  document.querySelectorAll(`#${id} button`).forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(`#${id} button`).forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      fn(b);
    });
  });
}
