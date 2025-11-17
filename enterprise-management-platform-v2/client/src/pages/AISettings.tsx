import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Save, RotateCcw, Key, Eye, EyeOff, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

export default function AISettings() {
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash-exp");
  const [openrouterModel, setOpenrouterModel] = useState("google/gemini-flash-1.5");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [useGemini, setUseGemini] = useState(true);
  const [useOpenRouter, setUseOpenRouter] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  const defaultSystemPrompt = "Du bist ein KI-Assistent für die Enterprise Management Platform.\n\nDeine Aufgaben:\n- Beantworte Fragen zu Projekten, Zeiterfassung und Dokumentation\n- Nutze die bereitgestellten Kontext-Daten\n- Gib faktenbasierte Antworten\n\nWichtig: Halluziniere keine Daten!";

  // Load API keys and system prompt from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('ai_api_keys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        setGeminiApiKey(keys.gemini || "");
        setOpenrouterApiKey(keys.openrouter || "");
        setKeysLoaded(true);
      } catch (e) {
        console.error("Failed to load API keys", e);
      }
    }
    
    const savedPrompt = localStorage.getItem('ai_system_prompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    } else {
      setSystemPrompt(defaultSystemPrompt);
    }
  }, []);

  const handleSave = () => {
    // Save settings
    localStorage.setItem('ai_settings', JSON.stringify({
      geminiModel,
      openrouterModel,
      temperature: temperature[0],
      maxTokens: maxTokens[0],
      useGemini,
      useOpenRouter,
    }));
    
    // Save API keys (encrypted in production)
    localStorage.setItem('ai_api_keys', JSON.stringify({
      gemini: geminiApiKey,
      openrouter: openrouterApiKey,
    }));
    
    // Save system prompt
    localStorage.setItem('ai_system_prompt', systemPrompt);
    
    toast.success("Einstellungen, API-Keys und System-Prompt gespeichert");
  };

  const handleReset = () => {
    setGeminiModel("gemini-2.0-flash-exp");
    setOpenrouterModel("google/gemini-flash-1.5");
    setTemperature([0.7]);
    setMaxTokens([2048]);
    setUseGemini(true);
    setUseOpenRouter(false);
    toast.info("Einstellungen zurückgesetzt");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              KI-Einstellungen
            </h1>
            <p className="text-muted-foreground mt-1">
              Konfigurieren Sie KI-Modelle und Parameter für optimale Ergebnisse
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>

        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="models">Modelle</TabsTrigger>
            <TabsTrigger value="parameters">Parameter</TabsTrigger>
            <TabsTrigger value="system-prompt">System-Prompt</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gemini API</CardTitle>
                <CardDescription>
                  Google's Gemini-Modelle für hochwertige Text- und Bildgenerierung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-gemini">Gemini aktivieren</Label>
                  <Switch
                    id="use-gemini"
                    checked={useGemini}
                    onCheckedChange={setUseGemini}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemini-model">Modell</Label>
                  <Select value={geminiModel} onValueChange={setGeminiModel} disabled={!useGemini}>
                    <SelectTrigger id="gemini-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Flash-Modelle sind schneller, Pro-Modelle liefern höhere Qualität
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemini-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="gemini-api-key"
                        type={showGeminiKey ? "text" : "password"}
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        disabled={!useGemini}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {geminiApiKey ? (
                      <CheckCircle2 className="h-9 w-9 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-9 w-9 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {geminiApiKey ? "API-Key hinterlegt" : "Kein API-Key - Manus Built-in LLM wird verwendet"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OpenRouter</CardTitle>
                <CardDescription>
                  Zugriff auf verschiedene Open-Source und proprietäre Modelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-openrouter">OpenRouter aktivieren</Label>
                  <Switch
                    id="use-openrouter"
                    checked={useOpenRouter}
                    onCheckedChange={setUseOpenRouter}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openrouter-model">Modell</Label>
                  <Select value={openrouterModel} onValueChange={setOpenrouterModel} disabled={!useOpenRouter}>
                    <SelectTrigger id="openrouter-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-flash-1.5">Google Gemini Flash 1.5 (Kostenlos)</SelectItem>
                      <SelectItem value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Kostenlos)</SelectItem>
                      <SelectItem value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Kostenlos)</SelectItem>
                      <SelectItem value="qwen/qwen-2-7b-instruct:free">Qwen 2 7B (Kostenlos)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Kostenlose Modelle mit guter Leistung für die meisten Aufgaben
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openrouter-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openrouter-api-key"
                        type={showOpenRouterKey ? "text" : "password"}
                        value={openrouterApiKey}
                        onChange={(e) => setOpenrouterApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        disabled={!useOpenRouter}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOpenRouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {openrouterApiKey ? (
                      <CheckCircle2 className="h-9 w-9 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-9 w-9 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {openrouterApiKey ? "API-Key hinterlegt" : "Kein API-Key - Manus Built-in LLM wird verwendet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generierungs-Parameter</CardTitle>
                <CardDescription>
                  Feinabstimmung der KI-Ausgabe für verschiedene Anwendungsfälle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">Temperature</Label>
                    <span className="text-sm font-medium">{temperature[0].toFixed(2)}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onValueChange={setTemperature}
                  />
                  <p className="text-sm text-muted-foreground">
                    Niedrigere Werte (0.0-0.5): Präzise, konsistente Antworten<br />
                    Mittlere Werte (0.6-1.0): Ausgewogene Kreativität<br />
                    Höhere Werte (1.1-2.0): Kreative, variierende Ausgaben
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <span className="text-sm font-medium">{maxTokens[0]}</span>
                  </div>
                  <Slider
                    id="max-tokens"
                    min={256}
                    max={8192}
                    step={256}
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximale Länge der generierten Antwort. Höhere Werte ermöglichen längere Texte.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-prompt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  System-Prompt
                </CardTitle>
                <CardDescription>
                  Definieren Sie das Verhalten des KI-Assistenten. Der Prompt wird bei jeder Chat-Anfrage verwendet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System-Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Geben Sie hier Ihren System-Prompt ein..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Der System-Prompt definiert die Rolle und Aufgaben des KI-Assistenten.
                    Kontext-Daten werden automatisch hinzugefügt.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSystemPrompt(defaultSystemPrompt);
                      toast.info("Standard-Prompt wiederhergestellt");
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Standard wiederherstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vordefinierte Presets</CardTitle>
                <CardDescription>
                  Schnellzugriff auf optimierte Einstellungen für verschiedene Aufgaben
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setTemperature([0.3]);
                    setMaxTokens([1024]);
                    toast.info("Preset 'Präzise Dokumentation' geladen");
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">Präzise Dokumentation</div>
                    <div className="text-sm text-muted-foreground">
                      Temperature: 0.3, Max Tokens: 1024 - Für Bautagebuch und Berichte
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setTemperature([0.7]);
                    setMaxTokens([2048]);
                    toast.info("Preset 'Kreative Beschreibungen' geladen");
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">Kreative Beschreibungen</div>
                    <div className="text-sm text-muted-foreground">
                      Temperature: 0.7, Max Tokens: 2048 - Für Präsentationen und Marketing
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setTemperature([0.5]);
                    setMaxTokens([1536]);
                    toast.info("Preset 'Mängel-Analyse' geladen");
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">Mängel-Analyse</div>
                    <div className="text-sm text-muted-foreground">
                      Temperature: 0.5, Max Tokens: 1536 - Für technische Analysen
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setTemperature([1.0]);
                    setMaxTokens([3072]);
                    toast.info("Preset 'Brainstorming' geladen");
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">Brainstorming</div>
                    <div className="text-sm text-muted-foreground">
                      Temperature: 1.0, Max Tokens: 3072 - Für kreative Ideen
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

