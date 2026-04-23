import { useState, useRef } from "react";

const NAV = "#002D72";
const RED = "#C8102E";
const GOLD = "#F5A623";

const SYS = `Eres experto en planificacion didactica del MINERD de la Republica Dominicana. Dominas el Diseno Curricular del Nivel Secundario y el modelo de Niveles de Desempeno de Tobon.
Dado un PDF de secuencia didactica y un numero de actividad, genera una planificacion de clase COMPLETA con rubrica analitica y lista de cotejo.
REGLA ABSOLUTA: Responde UNICAMENTE con JSON puro valido. Cero texto antes o despues. Sin markdown, sin bloques de codigo, sin explicaciones.
Estructura JSON exacta:
{"actividad":"","area":"","tema":"","grado":"1er Grado","nivel":"Secundaria","duracion":"45 minutos","nivel_tobon":"Receptivo|Resolutivo|Autonomo|Estrategico","intencion_pedagogica":"","indicador_logro":"","competencias":["","",""],"inicio":["","",""],"desarrollo":["","","","",""],"formulas":null,"cierre":["","",""],"evaluacion":["","",""],"recursos":["","","","",""],"rubrica":{"criterios":[{"nombre":"Criterio 1 vinculado al indicador","peso":"25%","avanzado":"desc 4pts","satisfactorio":"desc 3pts","en_proceso":"desc 2pts","inicio":"desc 1pt"},{"nombre":"Criterio 2 procedimiento","peso":"25%","avanzado":"","satisfactorio":"","en_proceso":"","inicio":""},{"nombre":"Criterio 3 comunicacion y argumentacion","peso":"25%","avanzado":"","satisfactorio":"","en_proceso":"","inicio":""},{"nombre":"Criterio 4 actitudes y colaboracion","peso":"25%","avanzado":"","satisfactorio":"","en_proceso":"","inicio":""}]},"lista_cotejo":{"indicadores":["Verbo accion observable 1","ind 2","ind 3","ind 4","ind 5","ind 6","ind 7","ind 8"]},"frase":"frase motivacional"}`;

async function callClaude(b64, act, week) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYS,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
          { type: "text", text: `Genera planificacion para Actividad ${act}${week ? " Semana " + week : ""}. Solo JSON.` }
        ]
      }]
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Error " + r.status);
  const raw = d.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #dde3f0", padding: 18, marginBottom: 14, ...style }}>{children}</div>;
}

function STitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 800, color: NAV, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 3, height: 15, background: RED, borderRadius: 2 }} />
      {children}
    </div>
  );
}

function Sec({ border, bg, label, children }) {
  return (
    <div style={{ border: `1.5px solid ${border}`, borderRadius: 9, background: bg, padding: "9px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6, color: border, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Ul({ items }) {
  if (!items?.length) return null;
  return (
    <ul style={{ paddingLeft: 15, margin: 0 }}>
      {items.map((x, i) => <li key={i} style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 2, color: "#222" }}>{x}</li>)}
    </ul>
  );
}

function MetaBox({ label, value }) {
  return (
    <div style={{ background: "#f4f7ff", borderRadius: 7, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{value}</div>
    </div>
  );
}

function PlanView({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <MetaBox label="Área" value={p.area} />
        <MetaBox label="Grado · Nivel" value={`${p.grado} · ${p.nivel}`} />
        <MetaBox label="Nivel Tobón" value={p.nivel_tobon} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <Sec border="#E91E63" bg="#FFF0F5" label="🎯 Intención pedagógica"><p style={{ fontSize: 11, lineHeight: 1.65, color: "#222", margin: 0 }}>{p.intencion_pedagogica}</p></Sec>
        <Sec border="#43A047" bg="#F1F8E9" label="✓ Indicador de logro"><p style={{ fontSize: 11, lineHeight: 1.65, color: "#222", margin: 0 }}>{p.indicador_logro}</p></Sec>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
        <Sec border="#FFB300" bg="#FFFDE7" label="⏰ Inicio · 10 min"><Ul items={p.inicio} /></Sec>
        <Sec border="#1E88E5" bg="#E3F2FD" label="📚 Desarrollo · 25 min">
          <Ul items={p.desarrollo} />
          {p.formulas && <div style={{ background: "#fff", border: "1px solid #90CAF9", borderRadius: 5, padding: "5px 9px", marginTop: 7, fontFamily: "monospace", fontSize: 12, fontWeight: 800, textAlign: "center", color: "#1A237E" }}>{p.formulas}</div>}
        </Sec>
        <Sec border="#FB8C00" bg="#FFF8F0" label="💬 Cierre · 10 min"><Ul items={p.cierre} /></Sec>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <Sec border="#8E24AA" bg="#F3E5F5" label="📋 Evaluación"><Ul items={p.evaluacion} /></Sec>
        <Sec border="#00ACC1" bg="#E0F7FA" label="🛠 Recursos"><Ul items={p.recursos} /></Sec>
      </div>
      {p.competencias?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 5 }}>Competencias fundamentales</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {p.competencias.map((c, i) => <span key={i} style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: "#E3F2FD", color: "#0C447C" }}>{c}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function RubricaView({ p }) {
  const crits = p.rubrica?.criterios;
  if (!crits?.length) return <p style={{ fontSize: 12, color: "#888" }}>Sin rúbrica.</p>;
  const nivs = [
    { k: "avanzado", label: "Avanzado (4)", bg: "#E8F5E9", c: "#1B5E20" },
    { k: "satisfactorio", label: "Satisfactorio (3)", bg: "#E3F2FD", c: "#0C447C" },
    { k: "en_proceso", label: "En Proceso (2)", bg: "#FFF3E0", c: "#E65100" },
    { k: "inicio", label: "Inicio (1)", bg: "#FFEBEE", c: "#B71C1C" },
  ];
  return (
    <div>
      <div style={{ background: "#f4f7ff", borderRadius: 7, padding: "8px 11px", fontSize: 11, marginBottom: 10 }}>
        <b>Indicador:</b> {p.indicador_logro}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: NAV }}>
              <th style={{ color: "#fff", padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 800, width: "22%" }}>Criterio</th>
              {nivs.map(n => (
                <th key={n.k} style={{ color: "#fff", padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 800 }}>
                  <span style={{ background: n.bg, color: n.c, padding: "2px 6px", borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{n.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crits.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                <td style={{ padding: "8px 9px", borderBottom: "0.5px solid #e0e8f5", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 800, fontSize: 10 }}>{c.nombre}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{c.peso}</div>
                </td>
                {nivs.map(n => (
                  <td key={n.k} style={{ padding: "8px 9px", borderBottom: "0.5px solid #e0e8f5", verticalAlign: "top", lineHeight: 1.5, fontSize: 10, color: "#222" }}>
                    {c[n.k] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 9, color: "#999", marginTop: 7 }}>Máx: 16 pts · Avanzado: 13-16 · Satisfactorio: 9-12 · En proceso: 5-8 · Inicio: 4</div>
    </div>
  );
}

function CotejoView({ p }) {
  const inds = p.lista_cotejo?.indicadores;
  if (!inds?.length) return <p style={{ fontSize: 12, color: "#888" }}>Sin lista de cotejo.</p>;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {["Estudiante", "Fecha", "Docente"].map(l => (
          <div key={l} style={{ background: "#f4f7ff", borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{l}</div>
            <div style={{ borderBottom: "1px solid #ccd", height: 16 }} />
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: "#6A1B9A" }}>
              <th style={{ color: "#fff", padding: "6px 8px", textAlign: "center", width: 28, fontSize: 9, fontWeight: 800 }}>#</th>
              <th style={{ color: "#fff", padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 800 }}>Indicador observable</th>
              <th style={{ color: "#fff", padding: "6px 8px", textAlign: "center", width: 60, fontSize: 9, fontWeight: 800 }}>Logrado</th>
              <th style={{ color: "#fff", padding: "6px 8px", textAlign: "center", width: 70, fontSize: 9, fontWeight: 800 }}>No logrado</th>
              <th style={{ color: "#fff", padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 800 }}>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {inds.map((ind, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #e0e8f5", textAlign: "center", color: "#888" }}>{i + 1}</td>
                <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #e0e8f5", lineHeight: 1.55, color: "#222" }}>{ind}</td>
                <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #e0e8f5", textAlign: "center" }}>
                  <div style={{ width: 16, height: 16, border: "1.5px solid #aaa", borderRadius: 3, margin: "0 auto" }} />
                </td>
                <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #e0e8f5", textAlign: "center" }}>
                  <div style={{ width: 16, height: 16, border: "1.5px solid #aaa", borderRadius: 3, margin: "0 auto" }} />
                </td>
                <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #e0e8f5" }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 9, color: "#999", marginTop: 7 }}>
        Logros: ___ / {inds.length} · Porcentaje: ___% · Firma: _______________
      </div>
    </div>
  );
}

function PlanCard({ plan, idx, onPrint }) {
  const [tab, setTab] = useState("plan");
  const tabs = [
    { id: "plan", icon: "📄", label: "Planificación" },
    { id: "rub", icon: "⭐", label: "Rúbrica" },
    { id: "cot", icon: "✅", label: "Lista de cotejo" },
  ];
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #dde3f0", overflow: "hidden", marginBottom: 16 }}>
      {/* Card header */}
      <div style={{ background: NAV, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>Actividad {plan._act} — {plan.tema}</div>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: 10, marginTop: 2 }}>{plan.area} · {plan.nivel} · {plan.duracion}</div>
        </div>
        <button onClick={() => onPrint(idx)} style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, padding: "5px 11px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
          🖨 Imprimir
        </button>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e8edf5", background: "#f7f9ff" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", color: tab === t.id ? NAV : "#888", borderBottom: tab === t.id ? `2px solid ${NAV}` : "2px solid transparent", background: tab === t.id ? "#fff" : "transparent", border: "none", borderBottom: tab === t.id ? `2px solid ${NAV}` : "2px solid transparent" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ padding: 14 }}>
        {tab === "plan" && <PlanView p={plan} />}
        {tab === "rub" && <RubricaView p={plan} />}
        {tab === "cot" && <CotejoView p={plan} />}
      </div>
      <div style={{ background: NAV, padding: "8px 16px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,.8)", fontSize: 10, fontStyle: "italic" }}>"{plan.frase}"</p>
        <small style={{ color: "rgba(255,255,255,.4)", fontSize: 9 }}>ProfeRD Planificación</small>
      </div>
    </div>
  );
}

function buildPrintDoc(plans) {
  const pages = plans.map(p => {
    const ul = a => a?.length ? `<ul>${a.map(i => `<li>${i}</li>`).join("")}</ul>` : "";
    const rubRows = (p.rubrica?.criterios || []).map(c =>
      `<tr><td><b>${c.nombre}</b><br><em>${c.peso}</em></td><td>${c.avanzado}</td><td>${c.satisfactorio}</td><td>${c.en_proceso}</td><td>${c.inicio}</td></tr>`
    ).join("");
    const cotRows = (p.lista_cotejo?.indicadores || []).map((x, i) =>
      `<tr><td class="ctr">${i + 1}</td><td>${x}</td><td class="ctr">&#9633;</td><td class="ctr">&#9633;</td><td></td></tr>`
    ).join("");
    return `
<div class="pg">
<div class="ph"><b>${p.area} — PLANIFICACIÓN DE CLASE</b><span>ProfeRD 🇩🇴 · Actividad ${p._act}</span></div>
<div class="mr"><span><b>Área:</b> ${p.area}</span><span><b>Tema:</b> ${p.tema}</span><span><b>Actividad:</b> ${p._act}</span><span><b>Duración:</b> ${p.duracion}</span><span><b>Tobón:</b> ${p.nivel_tobon}</span></div>
<div class="g2"><div class="s pk"><b>INTENCIÓN PEDAGÓGICA</b><p>${p.intencion_pedagogica}</p></div><div class="s gn"><b>INDICADOR DE LOGRO</b><p>${p.indicador_logro}</p></div></div>
<div class="g3"><div class="s yw"><b>⏰ INICIO 10 min</b>${ul(p.inicio)}</div><div class="s bl"><b>📚 DESARROLLO 25 min</b>${ul(p.desarrollo)}${p.formulas ? `<div class="fm">${p.formulas}</div>` : ""}</div><div class="s or"><b>💬 CIERRE 10 min</b>${ul(p.cierre)}</div></div>
<div class="g2"><div class="s pu"><b>📋 EVALUACIÓN</b>${ul(p.evaluacion)}</div><div class="s tl"><b>🛠 RECURSOS</b>${ul(p.recursos)}</div></div>
<div class="ft">"${p.frase}"</div>
</div>
<div class="pg">
<div class="ph"><b>RÚBRICA ANALÍTICA — ${p.tema}</b><span>ProfeRD · Actividad ${p._act}</span></div>
<p class="ind"><b>Indicador:</b> ${p.indicador_logro}</p>
<table><thead><tr><th style="width:20%">Criterio/Peso</th><th>Avanzado (4)</th><th>Satisfactorio (3)</th><th>En Proceso (2)</th><th>Inicio (1)</th></tr></thead><tbody>${rubRows}</tbody></table>
<p class="note">Máx 16 pts · Avanzado 13-16 · Satisfactorio 9-12 · En proceso 5-8 · Inicio 4</p>
</div>
<div class="pg">
<div class="ph"><b>LISTA DE COTEJO — ${p.tema}</b><span>ProfeRD · Actividad ${p._act}</span></div>
<div class="fields">Estudiante: _____________________ &nbsp;&nbsp; Fecha: ______________ &nbsp;&nbsp; Docente: _____________________</div>
<table><thead><tr><th class="ctr" style="width:22px">#</th><th>Indicador observable</th><th class="ctr" style="width:55px">Logrado</th><th class="ctr" style="width:65px">No logrado</th><th>Observaciones</th></tr></thead><tbody>${cotRows}</tbody></table>
<p class="note">Logros: ___ / ${p.lista_cotejo?.indicadores?.length || 0} · Porcentaje: ___% · Firma: _______________</p>
</div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>ProfeRD Planificaciones</title>
<style>
@page{size:A4;margin:1.4cm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:9.5px;color:#111}
.pg{page-break-after:always}.pg:last-child{page-break-after:auto}
.ph{background:#002D72;color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ph b{font-size:12px}.ph span{color:#F5A623;font-size:9px;font-weight:700}
.mr{display:flex;flex-wrap:wrap;gap:8px;background:#F3F0FA;padding:5px 9px;margin-bottom:5px;font-size:8.5px}.mr b{color:#6A4C9C}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:5px}
.s{border-radius:5px;padding:7px 8px;border:1.5px solid}
.s b{display:block;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.s ul{padding-left:12px}.s li{font-size:8.5px;line-height:1.5;margin-bottom:1px}.s p{font-size:8.5px;line-height:1.5}
.fm{background:#fff;border:1px solid #90CAF9;border-radius:4px;padding:4px;margin-top:4px;font-family:monospace;font-size:10px;font-weight:700;text-align:center;color:#1A237E}
.pk{border-color:#E91E63;background:#FFF0F5}.pk b{color:#AD1457}
.gn{border-color:#43A047;background:#F1F8E9}.gn b{color:#2E7D32}
.yw{border-color:#FFB300;background:#FFFDE7}.yw b{color:#F57F17}
.bl{border-color:#1E88E5;background:#E3F2FD}.bl b{color:#1565C0}
.or{border-color:#FB8C00;background:#FFF8F0}.or b{color:#E67E00}
.pu{border-color:#8E24AA;background:#F3E5F5}.pu b{color:#6A1B9A}
.tl{border-color:#00ACC1;background:#E0F7FA}.tl b{color:#00695C}
.ft{background:#002D72;color:rgba(255,255,255,.85);text-align:center;padding:5px;font-style:italic;font-size:8.5px;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:8.5px}
th{background:#002D72;color:#fff;padding:5px 7px;text-align:left;font-weight:700;font-size:8px}
td{padding:5px 7px;border-bottom:.5px solid #dde;vertical-align:top;line-height:1.45}
tr:nth-child(even) td{background:#f7f9ff}
.ctr{text-align:center}
.ind{font-size:8.5px;margin-bottom:7px;background:#f4f7ff;padding:5px 9px;border-radius:4px}
.note{font-size:7.5px;color:#888;margin-top:5px}
.fields{font-size:8.5px;margin:5px 0 8px}
</style></head><body>${pages}</body></html>`;
}

export default function App() {
  const [b64, setB64] = useState(null);
  const [fname, setFname] = useState("");
  const [actIn, setActIn] = useState("");
  const [weekIn, setWeekIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [prog, setProg] = useState({ done: 0, total: 0, msg: "" });
  const [err, setErr] = useState("");
  const fileRef = useRef();

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { setErr("El archivo supera 20 MB."); return; }
    const r = new FileReader();
    r.onload = ev => { setB64(ev.target.result.split(",")[1]); setFname(f.name); setErr(""); };
    r.readAsDataURL(f);
  };

  const run = async () => {
    if (!b64) { setErr("Sube un PDF primero."); return; }
    const acts = actIn.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
    if (!acts.length) { setErr("Ingresa al menos un número de actividad."); return; }
    setErr(""); setPlans([]); setLoading(true);
    const results = [];
    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      setProg({ done: i, total: acts.length, msg: `Generando Actividad ${act}...` });
      try {
        const plan = await callClaude(b64, act, weekIn.trim());
        plan._act = act;
        results.push(plan);
        setPlans([...results]);
      } catch (e) {
        setErr(`Error en Actividad ${act}: ${e.message}`);
        break;
      }
      setProg({ done: i + 1, total: acts.length, msg: i + 1 < acts.length ? `Listo ${act}. Siguiente: ${acts[i + 1]}...` : "¡Completado!" });
    }
    setLoading(false);
  };

  const printOne = idx => {
    const w = window.open("", "_blank");
    w.document.write(buildPrintDoc([plans[idx]]));
    w.document.close();
    setTimeout(() => w.print(), 900);
  };

  const printAll = () => {
    if (!plans.length) return;
    const w = window.open("", "_blank");
    w.document.write(buildPrintDoc(plans));
    w.document.close();
    setTimeout(() => w.print(), 900);
  };

  const pct = prog.total > 0 ? Math.round(prog.done / prog.total * 100) : 0;
  const canGen = !loading && !!b64 && actIn.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f3f9", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: NAV, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
        <div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>
            Profe<span style={{ color: GOLD }}>RD</span> Planificación
          </div>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
            Planificación + Rúbrica analítica + Lista de cotejo
          </div>
        </div>
        <div style={{ marginLeft: "auto", background: RED, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>🇩🇴 MINERD</div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "18px 16px" }}>
        {/* Upload */}
        <Card>
          <STitle>Nueva planificación</STitle>

          {/* Drop zone */}
          <div
            onClick={() => !b64 && fileRef.current?.click()}
            style={{ border: `2px ${b64 ? "solid #43A047" : "dashed #c5cce0"}`, borderRadius: 10, padding: "22px 16px", textAlign: "center", cursor: b64 ? "default" : "pointer", background: b64 ? "#F1F8E9" : "#f7f9ff", transition: "all .2s" }}
          >
            <input ref={fileRef} type="file" accept=".pdf" onChange={onFile} style={{ display: "none" }} />
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b64 ? "✅" : "📄"}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: b64 ? "#2E7D32" : NAV, marginBottom: 3 }}>
              {b64 ? fname : "Haz clic aquí para subir la secuencia didáctica (PDF)"}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {b64 ? "PDF cargado — listo para generar" : "Secuencias didácticas del MINERD · hasta 20 MB"}
            </div>
            {b64 && (
              <button onClick={e => { e.stopPropagation(); setB64(null); setFname(""); setPlans([]); }} style={{ marginTop: 8, background: "none", border: "1px solid #43A047", borderRadius: 5, padding: "3px 10px", fontSize: 10, color: "#2E7D32", cursor: "pointer", fontWeight: 700 }}>
                Cambiar PDF
              </button>
            )}
          </div>

          {/* Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Números de actividad *</label>
              <input value={actIn} onChange={e => setActIn(e.target.value)} onKeyDown={e => e.key === "Enter" && run()} placeholder="Ej: 1   o   1, 2, 3   o   2.1, 3"
                style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${actIn ? NAV : "#d0d6e8"}`, borderRadius: 8, fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
              <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>Uno o varios separados por coma</div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Semana (opcional)</label>
              <input value={weekIn} onChange={e => setWeekIn(e.target.value)} placeholder="Ej: 1"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #d0d6e8", borderRadius: 8, fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Button */}
          <button onClick={run} disabled={!canGen}
            style={{ width: "100%", marginTop: 14, background: canGen ? NAV : "#aab", color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontSize: 14, fontWeight: 900, cursor: canGen ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: "inherit" }}>
            {loading && <div style={{ width: 18, height: 18, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
            {loading ? "Generando..." : "✨ Generar planificaciones"}
          </button>

          {err && <div style={{ background: "#FFF0F0", border: "1.5px solid #ffb3b3", borderRadius: 8, padding: "10px 13px", fontSize: 12, color: "#c00", marginTop: 12, fontWeight: 700 }}>❌ {err}</div>}
        </Card>

        {/* Progress */}
        {loading && (
          <Card>
            <div style={{ fontSize: 12, fontWeight: 800, color: NAV, marginBottom: 6 }}>Generando... {prog.done}/{prog.total}</div>
            <div style={{ background: "#e0e8f5", borderRadius: 4, height: 8 }}>
              <div style={{ background: NAV, height: 8, borderRadius: 4, width: pct + "%", transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 5 }}>{prog.msg}</div>
          </Card>
        )}

        {/* Results */}
        {plans.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: NAV }}>
                {plans.length} planificación{plans.length !== 1 ? "es" : ""} generada{plans.length !== 1 ? "s" : ""}
              </div>
              <button onClick={printAll} style={{ background: NAV, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                🖨 Imprimir / Descargar todo
              </button>
            </div>
            {plans.map((plan, i) => <PlanCard key={i} plan={plan} idx={i} onPrint={printOne} />)}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
