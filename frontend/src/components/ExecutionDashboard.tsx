import React, { useState, useEffect } from 'react';
import MaterialListView from './MaterialListView';

interface ExecutionReadinessData {
  id: string;
  projekt_id: string;
  status: string;
  gesamt_score: number;
  vollstaendigkeit_score: number;
  detailgrad_score: number;
  materialspezifikation_score: number;
  schnittstellen_score: number;
  empfehlung: string;
  naechste_schritte: Array<{
    aktion: string;
    beschreibung: string;
  }>;
  anzahl_kritische_befunde: number;
  anzahl_fehlende_dokumente: number;
  erstellt_am: string;
}

interface ExecutionDashboardProps {
  projektId: string;
}

const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({ projektId }) => {
  const [readinessData, setReadinessData] = useState<ExecutionReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'readiness' | 'materials'>('readiness');
  const [selectedGewerk, setSelectedGewerk] = useState<string>('KG420_HEIZUNG');

  useEffect(() => {
    if (projektId) {
      fetchReadinessData();
    }
  }, [projektId]);

  const fetchReadinessData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/execution/readiness-check/${projektId}`);
      
      if (response.status === 404) {
        setReadinessData(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Ausführungsreife-Daten');
      }

      const data = await response.json();
      setReadinessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startReadinessCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/execution/readiness-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projekt_id: projektId })
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Ausführungsreife-Prüfung');
      }

      const result = await response.json();
      setReadinessData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ausfuehrungsreif':
        return <div className="text-4xl">✅</div>;
      case 'klaerungsbedarf':
        return <div className="text-4xl">⚠️</div>;
      case 'nicht_ausfuehrungsreif':
        return <div className="text-4xl">❌</div>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'ausfuehrungsreif': 'bg-green-100 text-green-800',
      'klaerungsbedarf': 'bg-yellow-100 text-yellow-800',
      'nicht_ausfuehrungsreif': 'bg-red-100 text-red-800'
    };

    const labels: Record<string, string> = {
      'ausfuehrungsreif': 'Ausführungsreif',
      'klaerungsbedarf': 'Klärungsbedarf',
      'nicht_ausfuehrungsreif': 'Nicht ausführungsreif'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${variants[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 0.85) return 'bg-green-500';
    if (score >= 0.60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const ScoreCard: React.FC<{ title: string; score: number }> = ({ title, score }) => (
    <div className="p-4 border rounded-lg bg-white">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {(score * 100).toFixed(0)}%
      </p>
    </div>
  );

  if (loading && !readinessData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Ausführungsdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit View-Switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ausführungs-Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('readiness')}
            className={`px-4 py-2 rounded-md ${
              activeView === 'readiness'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎯 Ausführungsreife
          </button>
          <button
            onClick={() => setActiveView('materials')}
            className={`px-4 py-2 rounded-md ${
              activeView === 'materials'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📦 Materiallisten
          </button>
        </div>
      </div>

      {/* Ausführungsreife View */}
      {activeView === 'readiness' && (
        <>
          {readinessData ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-6">
                {/* Status-Übersicht */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(readinessData.status)}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        {getStatusBadge(readinessData.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Gesamtscore:</span>
                        <span className={`text-3xl font-bold ${getScoreColor(readinessData.gesamt_score)}`}>
                          {(readinessData.gesamt_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={startReadinessCheck}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {loading ? 'Prüfe...' : 'Erneut prüfen'}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${getProgressBarColor(readinessData.gesamt_score)}`}
                    style={{ width: `${readinessData.gesamt_score * 100}%` }}
                  ></div>
                </div>

                {/* Detail-Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreCard title="Vollständigkeit" score={readinessData.vollstaendigkeit_score} />
                  <ScoreCard title="Detailgrad" score={readinessData.detailgrad_score} />
                  <ScoreCard title="Materialspez." score={readinessData.materialspezifikation_score} />
                  <ScoreCard title="Schnittstellen" score={readinessData.schnittstellen_score} />
                </div>

                {/* Kennzahlen */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Kritische Befunde</p>
                    <p className="text-3xl font-bold text-red-600">
                      {readinessData.anzahl_kritische_befunde}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fehlende Dokumente</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {readinessData.anzahl_fehlende_dokumente}
                    </p>
                  </div>
                </div>

                {/* Empfehlung */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Empfehlung</h4>
                  <p className="text-blue-800">{readinessData.empfehlung}</p>
                </div>

                {/* Nächste Schritte */}
                {readinessData.naechste_schritte && readinessData.naechste_schritte.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Nächste Schritte:</h4>
                    <div className="space-y-2">
                      {readinessData.naechste_schritte.map((schritt, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">{schritt.aktion}</p>
                            <p className="text-sm text-blue-700 mt-1">{schritt.beschreibung}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zeitstempel */}
                <div className="text-xs text-gray-500 text-right">
                  Geprüft am: {new Date(readinessData.erstellt_am).toLocaleString('de-DE')}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Noch keine Prüfung durchgeführt</h3>
              <p className="text-gray-600 mb-6">
                Starten Sie eine Ausführungsreife-Prüfung, um zu sehen, ob die Planungsunterlagen
                ausführungsreif sind.
              </p>
              <button
                onClick={startReadinessCheck}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {loading ? 'Prüfung läuft...' : 'Jetzt prüfen'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Materiallisten View */}
      {activeView === 'materials' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Gewerk auswählen</label>
            <select
              value={selectedGewerk}
              onChange={(e) => setSelectedGewerk(e.target.value)}
              className="w-full md:w-64 p-2 border rounded-md"
            >
              <option value="KG420_HEIZUNG">KG420 - Heizung</option>
              <option value="KG430_LUEFTUNG">KG430 - Lüftung</option>
              <option value="KG410_SANITAER">KG410 - Sanitär</option>
            </select>
          </div>
          
          <MaterialListView 
            projektId={projektId} 
            gewerk={selectedGewerk}
          />
        </div>
      )}
    </div>
  );
};

export default ExecutionDashboard;

