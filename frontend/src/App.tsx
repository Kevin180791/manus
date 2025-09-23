
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RoomData from './pages/RoomData';
import FlowCalc from './pages/FlowCalc';
import TGAPruefung from './pages/TGAPruefung';

function App() {
  return (
    <Router>
      <div className="flex">
        <nav className="w-64 bg-gray-800 text-white p-4 min-h-screen">
          <h1 className="text-xl font-bold mb-4">OpenManus TGA</h1>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="block p-2 rounded hover:bg-gray-700 transition-colors">
                🏠 Dashboard
              </Link>
            </li>
            <li>
              <Link to="/tga-pruefung" className="block p-2 rounded hover:bg-gray-700 transition-colors">
                🔍 TGA-Planprüfung
              </Link>
            </li>
            <li>
              <Link to="/raumdaten" className="block p-2 rounded hover:bg-gray-700 transition-colors">
                📊 Raumdaten
              </Link>
            </li>
            <li>
              <Link to="/stroemung" className="block p-2 rounded hover:bg-gray-700 transition-colors">
                💨 Strömungsberechnung
              </Link>
            </li>
          </ul>
          
          <div className="mt-8 pt-4 border-t border-gray-600">
            <p className="text-xs text-gray-400">Version 2.0</p>
            <p className="text-xs text-gray-400">Multi-Agent TGA-KI</p>
          </div>
        </nav>
        <main className="flex-1 p-4 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tga-pruefung" element={<TGAPruefung />} />
            <Route path="/raumdaten" element={<RoomData />} />
            <Route path="/stroemung" element={<FlowCalc />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
