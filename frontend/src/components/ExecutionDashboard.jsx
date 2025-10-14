import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download,
  FileText,
  Package
} from 'lucide-react';

/**
 * ExecutionDashboard - Dashboard für ausführende Firmen
 * 
 * Zeigt Ausführungsreife-Status und Materiallisten für ein Projekt
 */
const ExecutionDashboard = ({ projektId }) => {
  const [readinessData, setReadinessData] = useState(null);
  const [materialLists, setMaterialLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projektId) {
      fetchExecutionData();
    }
  }, [projektId]);

  const fetchExecutionData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Ausführungsreife-Daten laden
      const readinessResponse = await fetch(
        `/api/v1/execution/readiness-check/${projektId}`
      );
      
      if (readinessResponse.ok) {
        const readiness = await readinessResponse.json();
        setReadinessData(readiness);
      } else if (readinessResponse.status === 404) {
        // Noch keine Prüfung durchgeführt
        setReadinessData(null);
      } else {
        throw new Error('Fehler beim Laden der Ausführungsreife-Daten');
      }

      // TODO: Materiallisten laden (wenn API erweitert wird)
      // const materialResponse = await fetch(`/api/v1/execution/material-lists/${projektId}`);
      // const materials = await materialResponse.json();
      // setMaterialLists(materials);

    } catch (err) {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ausfuehrungsreif':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'klaerungsbedarf':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'nicht_ausfuehrungsreif':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'ausfuehrungsreif': 'success',
      'klaerungsbedarf': 'warning',
      'nicht_ausfuehrungsreif': 'destructive'
    };

    const labels = {
      'ausfuehrungsreif': 'Ausführungsreif',
      'klaerungsbedarf': 'Klärungsbedarf',
      'nicht_ausfuehrungsreif': 'Nicht ausführungsreif'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
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
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ausführungs-Dashboard</h2>
        {!readinessData && (
          <Button onClick={startReadinessCheck}>
            Ausführungsreife prüfen
          </Button>
        )}
      </div>

      {/* Ausführungsreife-Status */}
      {readinessData ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ausführungsreife-Status</span>
                {getStatusBadge(readinessData.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status-Übersicht */}
                <div className="flex items-center space-x-4">
                  {getStatusIcon(readinessData.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Gesamtscore</span>
                      <span className={`text-2xl font-bold ${getScoreColor(readinessData.gesamt_score)}`}>
                        {(readinessData.gesamt_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          readinessData.gesamt_score >= 0.85 ? 'bg-green-500' :
                          readinessData.gesamt_score >= 0.60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${readinessData.gesamt_score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Detail-Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreCard
                    title="Vollständigkeit"
                    score={readinessData.vollstaendigkeit_score}
                  />
                  <ScoreCard
                    title="Detailgrad"
                    score={readinessData.detailgrad_score}
                  />
                  <ScoreCard
                    title="Materialspez."
                    score={readinessData.materialspezifikation_score}
                  />
                  <ScoreCard
                    title="Schnittstellen"
                    score={readinessData.schnittstellen_score}
                  />
                </div>

                {/* Kennzahlen */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Kritische Befunde</p>
                    <p className="text-2xl font-bold text-red-600">
                      {readinessData.anzahl_kritische_befunde}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fehlende Dokumente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {readinessData.anzahl_fehlende_dokumente}
                    </p>
                  </div>
                </div>

                {/* Empfehlung */}
                <Alert>
                  <AlertDescription>
                    <strong>Empfehlung:</strong> {readinessData.empfehlung}
                  </AlertDescription>
                </Alert>

                {/* Nächste Schritte */}
                {readinessData.naechste_schritte && readinessData.naechste_schritte.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Nächste Schritte:</h4>
                    <div className="space-y-2">
                      {readinessData.naechste_schritte.map((schritt, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{schritt.aktion}</p>
                            <p className="text-sm text-gray-600">{schritt.beschreibung}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aktionen */}
                <div className="flex space-x-3">
                  <Button onClick={startReadinessCheck} variant="outline">
                    Erneut prüfen
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Bericht exportieren
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materiallisten-Sektion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Materiallisten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialLists.length > 0 ? (
                <div className="space-y-3">
                  {materialLists.map((liste) => (
                    <div key={liste.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{liste.gewerk}</p>
                        <p className="text-sm text-gray-600">
                          {liste.anzahl_positionen} Positionen
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Noch keine Materiallisten generiert</p>
                  <Button className="mt-4" variant="outline">
                    Materialliste erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Prüfung durchgeführt</h3>
            <p className="text-gray-600 mb-6">
              Starten Sie eine Ausführungsreife-Prüfung, um zu sehen, ob die Planungsunterlagen
              ausführungsreif sind.
            </p>
            <Button onClick={startReadinessCheck}>
              Jetzt prüfen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Hilfskomponente für Score-Karten
const ScoreCard = ({ title, score }) => {
  const getColor = (score) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-xl font-bold ${getColor(score)}`}>
        {(score * 100).toFixed(0)}%
      </p>
    </div>
  );
};

export default ExecutionDashboard;

