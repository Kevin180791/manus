import React, { useState, useEffect } from 'react';

interface MaterialPosition {
  id: string;
  kategorie: string;
  bezeichnung: string;
  menge: number;
  einheit: string;
  abmessungen?: string;
  material?: string;
  hersteller?: string;
  typ?: string;
  quelle_plan_referenz?: string;
  konfidenz: number;
}

interface MaterialListViewProps {
  projektId: string;
  gewerk: string;
  listeId?: string;
}

const MaterialListView: React.FC<MaterialListViewProps> = ({ projektId, gewerk, listeId }) => {
  const [positionen, setPositionen] = useState<MaterialPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterKategorie, setFilterKategorie] = useState<string>('alle');
  const [sortBy, setSortBy] = useState<'bezeichnung' | 'menge' | 'kategorie'>('kategorie');

  useEffect(() => {
    if (listeId) {
      loadMaterialListe();
    }
  }, [listeId]);

  const loadMaterialListe = async () => {
    if (!listeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/execution/material-list/${listeId}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Materialliste');
      }

      const data = await response.json();
      setPositionen(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMaterialListe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/execution/material-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projekt_id: projektId,
          gewerk: gewerk,
          use_llm: false
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Generieren der Materialliste');
      }

      const result = await response.json();
      
      // Liste laden
      const positionenResponse = await fetch(`/api/v1/execution/material-list/${result.id}`);
      const positionenData = await positionenResponse.json();
      setPositionen(positionenData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    if (!listeId) return;

    try {
      const response = await fetch(`/api/v1/execution/material-list/${listeId}/export/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materialliste_${gewerk}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Fehler beim CSV-Export:', err);
      alert('Fehler beim CSV-Export');
    }
  };

  const getFilteredAndSortedPositionen = () => {
    let filtered = positionen;

    // Filter
    if (filterKategorie !== 'alle') {
      filtered = filtered.filter(p => p.kategorie === filterKategorie);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'bezeichnung':
          return a.bezeichnung.localeCompare(b.bezeichnung);
        case 'menge':
          return b.menge - a.menge;
        case 'kategorie':
          return a.kategorie.localeCompare(b.kategorie);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getKategorien = () => {
    const kategorien = new Set(positionen.map(p => p.kategorie));
    return Array.from(kategorien);
  };

  const getKonfidenzColor = (konfidenz: number) => {
    if (konfidenz >= 0.8) return 'text-green-600';
    if (konfidenz >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Materialliste...</p>
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

  if (positionen.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Noch keine Materialliste vorhanden</h3>
        <p className="text-gray-600 mb-4">
          Generieren Sie eine Materialliste für das Gewerk {gewerk}
        </p>
        <button
          onClick={generateMaterialListe}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Materialliste generieren
        </button>
      </div>
    );
  }

  const filteredPositionen = getFilteredAndSortedPositionen();

  return (
    <div className="space-y-4">
      {/* Header mit Aktionen */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Materialliste - {gewerk} ({positionen.length} Positionen)
        </h3>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV exportieren
          </button>
          <button
            onClick={generateMaterialListe}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Neu generieren
          </button>
        </div>
      </div>

      {/* Filter und Sortierung */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Kategorie filtern</label>
            <select
              value={filterKategorie}
              onChange={(e) => setFilterKategorie(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="alle">Alle Kategorien</option>
              {getKategorien().map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Sortieren nach</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border rounded-md"
            >
              <option value="kategorie">Kategorie</option>
              <option value="bezeichnung">Bezeichnung</option>
              <option value="menge">Menge</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materialliste Tabelle */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bezeichnung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abmessungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konfidenz
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPositionen.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {position.kategorie}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{position.bezeichnung}</div>
                      {position.hersteller && (
                        <div className="text-xs text-gray-500">
                          {position.hersteller} {position.typ && `- ${position.typ}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.menge} {position.einheit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {position.abmessungen || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {position.material || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {position.quelle_plan_referenz || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${getKonfidenzColor(position.konfidenz)}`}>
                      {(position.konfidenz * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zusammenfassung */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="font-semibold mb-2">Zusammenfassung</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Gesamt Positionen:</span>
            <div className="text-lg font-bold">{positionen.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Gefilterte Positionen:</span>
            <div className="text-lg font-bold">{filteredPositionen.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Durchschn. Konfidenz:</span>
            <div className="text-lg font-bold">
              {(positionen.reduce((sum, p) => sum + p.konfidenz, 0) / positionen.length * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialListView;

