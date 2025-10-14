import React, { useState, useEffect } from 'react';
import ExecutionDashboard from '../components/ExecutionDashboard';

interface ProjektData {
  projekt_name: string;
  projekt_typ: string;
  leistungsphase: string;
  beschreibung?: string;
}

interface DokumentInfo {
  filename: string;
  document_type: string;
  gewerk: string;
  plan_nummer?: string;
  revision?: string;
}

interface PruefungStatus {
  auftrag_id: string;
  projekt_id?: string;
  projekt_name: string;
  status: string;
  anzahl_dokumente: number;
  anzahl_befunde: number;
  befunde_nach_prioritaet: {
    hoch: number;
    mittel: number;
    niedrig: number;
  };
}

interface Befund {
  id: string;
  gewerk: string;
  kategorie: string;
  prioritaet: string;
  titel: string;
  beschreibung: string;
  norm_referenz?: string;
  plan_referenz?: string;
  empfehlung?: string;
  konfidenz_score: number;
}

const TGAPruefung: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pruefung' | 'execution'>('pruefung');
  const [projektData, setProjektData] = useState<ProjektData>({
    projekt_name: '',
    projekt_typ: 'buerogebaeude',
    leistungsphase: 'LP3',
    beschreibung: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dokumentInfos, setDokumentInfos] = useState<DokumentInfo[]>([]);
  const [projektTypen, setProjektTypen] = useState<any[]>([]);
  const [gewerke, setGewerke] = useState<any[]>([]);
  const [leistungsphasen, setLeistungsphasen] = useState<any[]>([]);
  const [pruefungStatus, setPruefungStatus] = useState<PruefungStatus | null>(null);
  const [befunde, setBefunde] = useState<Befund[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [projektTypenRes, gewerkeRes, leistungsphasenRes] = await Promise.all([
        fetch('/api/v1/tga/projekt-typen'),
        fetch('/api/v1/tga/gewerke'),
        fetch('/api/v1/tga/leistungsphasen')
      ]);

      setProjektTypen((await projektTypenRes.json()).projekt_typen || []);
      setGewerke((await gewerkeRes.json()).gewerke || []);
      setLeistungsphasen((await leistungsphasenRes.json()).leistungsphasen || []);
    } catch (error) {
      console.error('Fehler beim Laden der Metadaten:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    const newDokumentInfos = files.map(file => ({
      filename: file.name,
      document_type: 'plan',
      gewerk: 'kg410_sanitaer',
      plan_nummer: '',
      revision: ''
    }));
    
    setDokumentInfos(prev => [...prev, ...newDokumentInfos]);
  };

  const updateDokumentInfo = (index: number, field: keyof DokumentInfo, value: string) => {
    setDokumentInfos(prev => prev.map((info, i) => 
      i === index ? { ...info, [field]: value } : info
    ));
  };

  const removeDokument = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setDokumentInfos(prev => prev.filter((_, i) => i !== index));
  };

  const startePruefung = async () => {
    if (!projektData.projekt_name || uploadedFiles.length === 0) {
      alert('Bitte Projektname eingeben und mindestens ein Dokument hochladen');
      return;
    }

    setLoading(true);
    try {
      const projektResponse = await fetch('/api/v1/tga/projekte/erstellen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projekt_name: projektData.projekt_name,
          projekt_typ: projektData.projekt_typ,
          leistungsphase: projektData.leistungsphase,
          beschreibung: projektData.beschreibung
        })
      });

      const projekt = await projektResponse.json();
      const projektId = projekt.projekt_id;

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const info = dokumentInfos[i];
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', info.document_type);
        formData.append('gewerk', info.gewerk);
        if (info.plan_nummer) formData.append('plan_nummer', info.plan_nummer);
        if (info.revision) formData.append('revision', info.revision);

        await fetch(`/api/v1/tga/dokumente/upload/${projektId}`, {
          method: 'POST',
          body: formData
        });
      }

      const pruefungResponse = await fetch(`/api/v1/tga/pruefung/starten/${projektId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projekt: {
            projekt_name: projektData.projekt_name,
            projekt_typ: projektData.projekt_typ,
            leistungsphase: projektData.leistungsphase,
            beschreibung: projektData.beschreibung
          },
          dokumente: dokumentInfos
        })
      });

      const pruefungResult = await pruefungResponse.json();
      const auftragId = pruefungResult.auftrag_id;

      setCurrentStep(3);
      await monitorePruefung(auftragId, projektId);

    } catch (error) {
      console.error('Fehler beim Starten der Prüfung:', error);
      alert('Fehler beim Starten der Prüfung');
    } finally {
      setLoading(false);
    }
  };

  const monitorePruefung = async (auftragId: string, projektId: string) => {
    const checkStatus = async () => {
      try {
        const statusResponse = await fetch(`/api/v1/tga/pruefung/status/${auftragId}`);
        const status = await statusResponse.json();
        status.projekt_id = projektId;
        setPruefungStatus(status);

        if (status.status === 'abgeschlossen') {
          const ergebnisseResponse = await fetch(`/api/v1/tga/pruefung/ergebnisse/${auftragId}`);
          const ergebnisse = await ergebnisseResponse.json();
          setBefunde(ergebnisse.befunde || []);
          setCurrentStep(4);
          return;
        }

        if (status.status === 'fehler') {
          alert('Fehler bei der Prüfung aufgetreten');
          return;
        }

        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error('Fehler beim Status-Check:', error);
      }
    };

    checkStatus();
  };

  const getPrioritaetColor = (prioritaet: string) => {
    switch (prioritaet) {
      case 'hoch': return 'text-red-600 bg-red-100';
      case 'mittel': return 'text-yellow-600 bg-yellow-100';
      case 'niedrig': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getKategorieIcon = (kategorie: string) => {
    switch (kategorie) {
      case 'formal': return '📋';
      case 'technisch': return '⚙️';
      case 'koordination': return '🔗';
      default: return '📄';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">TGA-Planprüfung</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pruefung')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pruefung'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 Planprüfung
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'execution'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏗️ Ausführung
          </button>
        </nav>
      </div>

      {/* Planprüfung Tab */}
      {activeTab === 'pruefung' && (
        <>
          {/* Fortschrittsanzeige */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    currentStep >= step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    {step}
                  </div>
                  <span className="ml-2 text-sm">
                    {step === 1 && 'Projekt anlegen'}
                    {step === 2 && 'Dokumente hochladen'}
                    {step === 3 && 'Prüfung läuft'}
                    {step === 4 && 'Ergebnisse'}
                  </span>
                  {step < 4 && <div className={`flex-1 h-1 mx-4 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">1. Projekt anlegen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Projektname *</label>
                  <input
                    type="text"
                    value={projektData.projekt_name}
                    onChange={(e) => setProjektData(prev => ({ ...prev, projekt_name: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    placeholder="z.B. Bürogebäude Musterstraße 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gebäudetyp *</label>
                  <select
                    value={projektData.projekt_typ}
                    onChange={(e) => setProjektData(prev => ({ ...prev, projekt_typ: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {projektTypen.map(typ => (
                      <option key={typ.code} value={typ.code}>
                        {typ.beschreibung}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Leistungsphase *</label>
                  <select
                    value={projektData.leistungsphase}
                    onChange={(e) => setProjektData(prev => ({ ...prev, leistungsphase: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {leistungsphasen.map(phase => (
                      <option key={phase.code} value={phase.code}>
                        {phase.beschreibung}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Beschreibung</label>
                  <textarea
                    value={projektData.beschreibung}
                    onChange={(e) => setProjektData(prev => ({ ...prev, beschreibung: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Optionale Projektbeschreibung..."
                  />
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!projektData.projekt_name}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Weiter zu Schritt 2
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">2. Dokumente hochladen</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Dateien auswählen</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Unterstützte Formate: PDF, DWG, DOC, DOCX, XLS, XLSX
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Hochgeladene Dokumente ({uploadedFiles.length})</h3>
                  
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{file.name}</h4>
                        <button
                          onClick={() => removeDokument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Dokumenttyp</label>
                          <select
                            value={dokumentInfos[index]?.document_type || 'plan'}
                            onChange={(e) => updateDokumentInfo(index, 'document_type', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                          >
                            <option value="plan">Plan</option>
                            <option value="berechnung">Berechnung</option>
                            <option value="schema">Schema</option>
                            <option value="bericht">Bericht</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Gewerk</label>
                          <select
                            value={dokumentInfos[index]?.gewerk || 'kg410_sanitaer'}
                            onChange={(e) => updateDokumentInfo(index, 'gewerk', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                          >
                            {gewerke.map(gewerk => (
                              <option key={gewerk.code} value={gewerk.code}>
                                {gewerk.beschreibung}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">Plan-Nr.</label>
                          <input
                            type="text"
                            value={dokumentInfos[index]?.plan_nummer || ''}
                            onChange={(e) => updateDokumentInfo(index, 'plan_nummer', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="z.B. TGA-001"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Zurück
                </button>
                <button
                  onClick={startePruefung}
                  disabled={uploadedFiles.length === 0 || loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300"
                >
                  {loading ? 'Prüfung wird gestartet...' : 'Prüfung starten'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">3. Prüfung läuft</h2>
              
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-lg">Dokumente werden geprüft...</span>
              </div>

              {pruefungStatus && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p><strong>Projekt:</strong> {pruefungStatus.projekt_name}</p>
                  <p><strong>Status:</strong> {pruefungStatus.status}</p>
                  <p><strong>Dokumente:</strong> {pruefungStatus.anzahl_dokumente}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">4. Prüfergebnisse</h2>

              {pruefungStatus && (
                <>
                  <div className="mb-6 p-4 bg-green-50 rounded-md">
                    <h3 className="font-semibold text-green-800 mb-2">Prüfung abgeschlossen</h3>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Dokumente:</span>
                        <div className="text-lg font-bold">{pruefungStatus.anzahl_dokumente}</div>
                      </div>
                      <div>
                        <span className="font-medium">Befunde gesamt:</span>
                        <div className="text-lg font-bold">{pruefungStatus.anzahl_befunde}</div>
                      </div>
                      <div>
                        <span className="font-medium text-red-600">Hoch:</span>
                        <div className="text-lg font-bold text-red-600">{pruefungStatus.befunde_nach_prioritaet.hoch}</div>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-600">Mittel:</span>
                        <div className="text-lg font-bold text-yellow-600">{pruefungStatus.befunde_nach_prioritaet.mittel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-4">
                    <button
                      onClick={() => setActiveTab('execution')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      🏗️ Zur Ausführungsreife-Prüfung
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setUploadedFiles([]);
                        setDokumentInfos([]);
                        setPruefungStatus(null);
                        setBefunde([]);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      Neue Prüfung starten
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-4">
                {befunde.map((befund) => (
                  <div key={befund.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getKategorieIcon(befund.kategorie)}</span>
                        <h3 className="font-semibold text-lg">{befund.titel}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioritaetColor(befund.prioritaet)}`}>
                        {befund.prioritaet.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{befund.beschreibung}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Gewerk:</span> {befund.gewerk}
                      </div>
                      <div>
                        <span className="font-medium">Kategorie:</span> {befund.kategorie}
                      </div>
                      {befund.norm_referenz && (
                        <div>
                          <span className="font-medium">Norm:</span> {befund.norm_referenz}
                        </div>
                      )}
                      {befund.plan_referenz && (
                        <div>
                          <span className="font-medium">Plan:</span> {befund.plan_referenz}
                        </div>
                      )}
                    </div>

                    {befund.empfehlung && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <span className="font-medium text-blue-800">💡 Empfehlung:</span>
                        <p className="text-blue-700 text-sm mt-1">{befund.empfehlung}</p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Konfidenz: {(befund.konfidenz_score * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Execution Tab */}
      {activeTab === 'execution' && (
        <div>
          {pruefungStatus?.projekt_id ? (
            <ExecutionDashboard projektId={pruefungStatus.projekt_id} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 mb-4">
                Bitte führen Sie zuerst eine Planprüfung durch, um die Ausführungsreife zu prüfen.
              </p>
              <button
                onClick={() => setActiveTab('pruefung')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Zur Planprüfung
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TGAPruefung;

