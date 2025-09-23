
import { useState } from "react";

function FlowCalc() {
  const [fluid, setFluid] = useState("luft");
  const [querschnitt, setQuerschnitt] = useState("");
  const [geschwindigkeit, setGeschwindigkeit] = useState("");
  const [volumenstrom, setVolumenstrom] = useState("");
  const [dichte, setDichte] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    const body = {
      fluid,
      querschnitt: querschnitt ? parseFloat(querschnitt) : null,
      geschwindigkeit: geschwindigkeit ? parseFloat(geschwindigkeit) : null,
      volumenstrom: volumenstrom ? parseFloat(volumenstrom) : null,
      dichte: dichte ? parseFloat(dichte) : null,
    };

    const res = await fetch("/api/agent/tasks/flowcalc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Strömungsrechner (Luft/Wasser)</h1>
      <div className="space-y-2">
        <div>
          <label>Fluid: </label>
          <select value={fluid} onChange={(e) => setFluid(e.target.value)}>
            <option value="luft">Luft</option>
            <option value="wasser">Wasser</option>
          </select>
        </div>
        <input placeholder="Querschnitt (m²)" value={querschnitt} onChange={(e) => setQuerschnitt(e.target.value)} />
        <input placeholder="Geschwindigkeit (m/s)" value={geschwindigkeit} onChange={(e) => setGeschwindigkeit(e.target.value)} />
        <input placeholder="Volumenstrom (m³/s)" value={volumenstrom} onChange={(e) => setVolumenstrom(e.target.value)} />
        <input placeholder="Dichte (optional, kg/m³)" value={dichte} onChange={(e) => setDichte(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSubmit}>Berechnen</button>
      </div>
      {result && (
        <div className="mt-4 p-3 border bg-gray-100 rounded">
          <h2 className="font-semibold">Ergebnisse</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FlowCalc;
