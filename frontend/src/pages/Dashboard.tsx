
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">OpenManus TGA-KI-Plattform</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* TGA-Planprüfung Card */}
        <Link to="/tga-pruefung" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🔍</span>
              <h2 className="text-xl font-semibold">TGA-Planprüfung</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Automatische Prüfung von TGA-Plänen und -Dokumenten mit KI-gestützten Multi-Agent-Workflow
            </p>
            <div className="text-sm text-blue-600 font-medium">
              ✓ Alle Gewerke KG400<br/>
              ✓ Normkonformitätsprüfung<br/>
              ✓ Koordinationsprüfung<br/>
              ✓ Detaillierte Befundberichte
            </div>
          </div>
        </Link>

        {/* Raumdaten Card */}
        <Link to="/raumdaten" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">📊</span>
              <h2 className="text-xl font-semibold">Raumdaten</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Verwaltung und Analyse von Raumdaten für TGA-Planungen
            </p>
            <div className="text-sm text-green-600 font-medium">
              ✓ Raumerfassung<br/>
              ✓ Nutzungsanalyse<br/>
              ✓ Datenexport
            </div>
          </div>
        </Link>

        {/* Strömungsberechnung Card */}
        <Link to="/stroemung" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">💨</span>
              <h2 className="text-xl font-semibold">Strömungsberechnung</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Berechnungen für Luft- und Wasserströmungen in TGA-Systemen
            </p>
            <div className="text-sm text-purple-600 font-medium">
              ✓ Volumenstrom<br/>
              ✓ Geschwindigkeit<br/>
              ✓ Druckverlust
            </div>
          </div>
        </Link>
      </div>

      {/* Statistiken */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Plattform-Übersicht</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-600">TGA-Gewerke</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">9</div>
            <div className="text-sm text-gray-600">Leistungsphasen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">6</div>
            <div className="text-sm text-gray-600">Gebäudetypen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">50+</div>
            <div className="text-sm text-gray-600">Prüfkriterien</div>
          </div>
        </div>
      </div>

      {/* Unterstützte Gewerke */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Unterstützte TGA-Gewerke</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              <span className="font-medium">KG410</span>
              <span className="ml-2 text-gray-600">Sanitär, Abwasser, Wasser, Gas</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
              <span className="font-medium">KG420</span>
              <span className="ml-2 text-gray-600">Wärmeversorgungsanlagen</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span className="font-medium">KG430</span>
              <span className="ml-2 text-gray-600">Raumlufttechnische Anlagen</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              <span className="font-medium">KG440</span>
              <span className="ml-2 text-gray-600">Elektrische Anlagen</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              <span className="font-medium">KG450</span>
              <span className="ml-2 text-gray-600">Kommunikationstechnik</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
              <span className="font-medium">KG474</span>
              <span className="ml-2 text-gray-600">Feuerlöschanlagen</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
              <span className="font-medium">KG480</span>
              <span className="ml-2 text-gray-600">Gebäudeautomation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
