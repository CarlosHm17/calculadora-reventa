import { useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import "./App.css";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const COLORS = {
  rentable: { bg: "#d1fae5", text: "#065f46", label: "✅ RENTABLE" },
  perdida:  { bg: "#fee2e2", text: "#991b1b", label: "❌ PÉRDIDA" },
  neutral:  { bg: "#f3f4f6", text: "#374151", label: "➖ SIN GANANCIA" },
};

export default function App() {
  const [modelo, setModelo]       = useState("");
  const [costoEquipo, setCostoEquipo] = useState("");
  const [manoObra, setManoObra]   = useState("");
  const [partes, setPartes]       = useState([{ id: 1, nombre: "", costo: "" }]);
  const [precioVenta, setPrecioVenta] = useState("");
  const [historial, setHistorial] = useState([]);
  const [tab, setTab]             = useState("calc");
  const [exportando, setExportando] = useState(false);
  const resultRef = useRef(null);

  const addParte = () =>
    setPartes((p) => [...p, { id: Date.now(), nombre: "", costo: "" }]);

  const removeParte = (id) =>
    setPartes((p) => p.filter((x) => x.id !== id));

  const updateParte = (id, field, val) =>
    setPartes((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const totalPartes = useMemo(
    () => partes.reduce((s, p) => s + Number(p.costo || 0), 0),
    [partes]
  );

  const costoNum     = Number(costoEquipo || 0);
  const manoObraNum  = Number(manoObra || 0);
  const ventaNum     = Number(precioVenta || 0);
  const totalInvertido = costoNum + manoObraNum + totalPartes;
  const ganancia     = ventaNum - totalInvertido;
  const margen       = totalInvertido > 0 ? ((ganancia / totalInvertido) * 100).toFixed(1) : 0;
  const status       = ganancia > 0 ? "rentable" : ganancia < 0 ? "perdida" : "neutral";
  const c            = COLORS[status];

  const limpiar = () => {
    setModelo("");
    setCostoEquipo("");
    setManoObra("");
    setPartes([{ id: Date.now(), nombre: "", costo: "" }]);
    setPrecioVenta("");
  };

  const guardar = () => {
    if (!costoEquipo && !precioVenta) return;
    const entrada = {
      id: Date.now(),
      fecha: new Date().toLocaleString("es-MX", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
      modelo: modelo || "Sin nombre",
      costoEquipo: costoNum,
      manoObra: manoObraNum,
      totalPartes,
      totalInvertido,
      precioVenta: ventaNum,
      ganancia,
      margen,
      status,
    };
    setHistorial((h) => [entrada, ...h]);
  };

  const exportarImagen = async () => {
    if (!resultRef.current) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(resultRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement("a");
      link.download = `${modelo || "equipo"}-reventa.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="app-container">
      <h2 className="app-title">📱 Calculadora de Reventa</h2>
      <p className="app-subtitle">Evalúa si un equipo te deja ganancia antes de comprarlo</p>

      <div className="tabs">
        <button
          onClick={() => setTab("calc")}
          style={{ ...tabBtn, ...(tab === "calc" ? tabActive : {}) }}
        >
          Calcular
        </button>
        <button
          onClick={() => setTab("historial")}
          style={{ ...tabBtn, ...(tab === "historial" ? tabActive : {}) }}
        >
          Historial
          {historial.length > 0 && (
            <span style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", fontSize: 11, padding: "1px 6px", marginLeft: 6 }}>
              {historial.length}
            </span>
          )}
        </button>
      </div>

      {tab === "historial" ? (
        <HistorialTab
          historial={historial}
          onEliminar={(id) => setHistorial((h) => h.filter((x) => x.id !== id))}
        />
      ) : (
        <>
          <div className="form-field">
            <label style={labelS}>Modelo del equipo</label>
            <input style={inputS} placeholder="Ej: iPhone 13 Pro 128GB" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>

          <div className="form-field">
            <label style={labelS}>💵 Precio de compra del equipo</label>
            <input style={inputS} type="number" placeholder="0.00" value={costoEquipo} onChange={(e) => setCostoEquipo(e.target.value)} />
          </div>

          <div className="form-field">
            <label style={labelS}>👷 Mano de obra</label>
            <input style={inputS} type="number" placeholder="0.00" value={manoObra} onChange={(e) => setManoObra(e.target.value)} />
          </div>

          <div className="form-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={labelS}>🔧 Partes / Reparaciones</label>
              <button onClick={addParte} style={addBtn}>+ Agregar parte</button>
            </div>
            {partes.map((p, i) => (
              <div key={p.id} className="partes-row">
                <input
                  className="partes-nombre"
                  style={{ ...inputS, marginBottom: 0 }}
                  placeholder={`Parte ${i + 1} (ej: pantalla)`}
                  value={p.nombre}
                  onChange={(e) => updateParte(p.id, "nombre", e.target.value)}
                />
                <input
                  className="partes-costo"
                  style={{ ...inputS, marginBottom: 0 }}
                  type="number"
                  placeholder="$0"
                  value={p.costo}
                  onChange={(e) => updateParte(p.id, "costo", e.target.value)}
                />
                {partes.length > 1 && (
                  <button onClick={() => removeParte(p.id)} style={removeBtn}>✕</button>
                )}
              </div>
            ))}
            {totalPartes > 0 && (
              <div style={{ textAlign: "right", fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                Total partes: <strong>{fmt(totalPartes)}</strong>
              </div>
            )}
          </div>

          <div className="form-field" style={{ marginBottom: 20 }}>
            <label style={labelS}>🏷️ Precio de venta estimado</label>
            <input style={inputS} type="number" placeholder="0.00" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
          </div>

          {/* Tarjeta de resultado — capturada para exportar */}
          <div ref={resultRef} style={{ background: c.bg, borderRadius: 12, padding: 20, color: c.text }}>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>
              {modelo || "Equipo"} — {c.label}
            </div>
            <div className="result-grid">
              <ResultBox label="Costo equipo"   value={fmt(costoEquipo)} />
              <ResultBox label="Mano de obra"   value={fmt(manoObra)} />
              <ResultBox label="Total partes"   value={fmt(totalPartes)} />
              <ResultBox label="Total invertido" value={fmt(totalInvertido)} />
              <ResultBox label="Precio de venta" value={fmt(precioVenta)} />
              <ResultBox label="Margen"          value={`${margen}%`} />
            </div>
            <div style={{ marginTop: 14, background: "rgba(0,0,0,0.07)", borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>Ganancia neta</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(ganancia)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, opacity: 0.65 }}>Margen</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{margen}%</div>
              </div>
            </div>
          </div>

          <div className="action-btns">
            <button onClick={limpiar}       style={clearBtn}>🗑️ Limpiar</button>
            <button onClick={guardar}       style={saveBtn}>💾 Guardar</button>
            <button onClick={exportarImagen} disabled={exportando} style={exportBtn}>
              {exportando ? "Generando…" : "📷 Exportar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function HistorialTab({ historial, onEliminar }) {
  if (historial.length === 0) {
    return (
      <div className="historial-empty">
        No hay equipos guardados aún.<br />
        Calcula un equipo y presiona <strong>Guardar</strong> para verlo aquí.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {historial.map((h) => {
        const c = COLORS[h.status];
        return (
          <div key={h.id} style={{ background: c.bg, borderRadius: 10, padding: "14px 16px", color: c.text }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{h.modelo}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{h.fecha}</div>
              </div>
              <button onClick={() => onEliminar(h.id)} style={{ ...removeBtn, padding: "4px 8px", fontSize: 11 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <MiniBox label="Invertido"  value={fmt(h.totalInvertido)} />
              <MiniBox label="Venta"      value={fmt(h.precioVenta)} />
              <MiniBox label="Ganancia"   value={fmt(h.ganancia)} bold />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, opacity: 0.75 }}>
              {c.label} · Margen {h.margen}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultBox({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function MiniBox({ label, value, bold }) {
  return (
    <div>
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <div style={{ fontWeight: bold ? 700 : 600, fontSize: 14 }}>{value}</div>
    </div>
  );
}

/* ---- Estilos estáticos ---- */
const inputS    = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff", color: "#1f2937" };
const labelS    = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" };
const addBtn    = { fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #3b82f6", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" };
const removeBtn = { padding: "8px 10px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 };
const clearBtn  = { flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const saveBtn   = { flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const exportBtn = { flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const tabBtn    = { flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const tabActive = { background: "#1f2937", color: "#fff", border: "1px solid #1f2937" };
