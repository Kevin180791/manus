
import { useState } from "react";

interface Room {
  name: string;
  area: string;
  usage: string;
  heatLoad: string;
}

function RoomData() {
  const [rooms, setRooms] = useState<Room[]>([{ name: "", area: "", usage: "", heatLoad: "" }]);
  const [aiResponse, setAiResponse] = useState("");

  const handleChange = (index: number, field: keyof Room, value: string) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, { name: "", area: "", usage: "", heatLoad: "" }]);
  };

  const sendToAgent = async () => {
    const roomText = rooms.map(
      (r, i) => `Raum ${i + 1}: ${r.name}, Nutzung: ${r.usage}, Fläche: ${r.area} m², Heizlast: ${r.heatLoad} kW.`
    ).join("\n");
    const res = await fetch("/api/agent/tasks/normcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: roomText })
    });
    const data = await res.json();
    setAiResponse(data.result || "Keine Antwort.");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Raumdatenblatt</h1>
      {rooms.map((room, index) => (
        <div key={index} className="mb-2 flex gap-2">
          <input placeholder="Name" value={room.name} onChange={(e) => handleChange(index, "name", e.target.value)} />
          <input placeholder="Fläche (m²)" value={room.area} onChange={(e) => handleChange(index, "area", e.target.value)} />
          <input placeholder="Nutzung" value={room.usage} onChange={(e) => handleChange(index, "usage", e.target.value)} />
          <input placeholder="Heizlast (kW)" value={room.heatLoad} onChange={(e) => handleChange(index, "heatLoad", e.target.value)} />
        </div>
      ))}
      <button onClick={addRoom} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">+ Raum</button>
      <button onClick={sendToAgent} className="bg-green-600 text-white px-3 py-1 rounded">Raum analysieren</button>
      {aiResponse && <div className="mt-4 p-2 border border-gray-300 bg-gray-50">{aiResponse}</div>}
    </div>
  );
}

export default RoomData;
