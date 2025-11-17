import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (generatedText: string) => void;
  type: "daily-report" | "defect-analysis" | "photo-analysis" | "project-summary";
  context?: {
    workDetails?: string;
    weather?: string;
    hours?: number;
    defectDescription?: string;
    severity?: string;
    location?: string;
    imageUrl?: string;
    projectName?: string;
    projectDescription?: string;
    status?: string;
    recentActivities?: string[];
  };
}

export function AIAssistantDialog({
  open,
  onOpenChange,
  onApply,
  type,
  context = {},
}: AIAssistantDialogProps) {
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  const dailyReportMutation = trpc.ai.generateDailyReportDescription.useMutation({
    onSuccess: (data) => {
      setGeneratedText(data.description);
      toast.success("Beschreibung generiert!");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const defectAnalysisMutation = trpc.ai.analyzeDefect.useMutation({
    onSuccess: (data) => {
      const text = `**Analyse:**\n${data.analysis}\n\n**Lösungsvorschläge:**\n${data.solutions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
      setGeneratedText(text);
      toast.success("Analyse abgeschlossen!");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const photoAnalysisMutation = trpc.ai.analyzePhoto.useMutation({
    onSuccess: (data) => {
      setGeneratedText(data.analysis);
      toast.success("Foto analysiert!");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const projectSummaryMutation = trpc.ai.generateProjectSummary.useMutation({
    onSuccess: (data) => {
      setGeneratedText(data.summary);
      toast.success("Zusammenfassung erstellt!");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleGenerate = () => {
    setGeneratedText("");
    
    if (type === "daily-report") {
      dailyReportMutation.mutate({
        workDetails: context.workDetails || "",
        weather: context.weather,
        hours: context.hours,
      });
    } else if (type === "defect-analysis") {
      defectAnalysisMutation.mutate({
        defectDescription: context.defectDescription || "",
        severity: context.severity || "medium",
        location: context.location,
      });
    } else if (type === "photo-analysis") {
      photoAnalysisMutation.mutate({
        imageUrl: context.imageUrl || "",
      });
    } else if (type === "project-summary") {
      projectSummaryMutation.mutate({
        projectName: context.projectName || "",
        description: context.projectDescription || "",
        status: context.status || "",
        recentActivities: context.recentActivities || [],
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success("In Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(generatedText);
    onOpenChange(false);
    setGeneratedText("");
  };

  const isLoading =
    dailyReportMutation.isPending ||
    defectAnalysisMutation.isPending ||
    photoAnalysisMutation.isPending ||
    projectSummaryMutation.isPending;

  const getTitle = () => {
    switch (type) {
      case "daily-report":
        return "KI-Assistent: Beschreibung generieren";
      case "defect-analysis":
        return "KI-Assistent: Mangel analysieren";
      case "photo-analysis":
        return "KI-Assistent: Foto analysieren";
      case "project-summary":
        return "KI-Assistent: Projektzusammenfassung";
      default:
        return "KI-Assistent";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "daily-report":
        return "Lassen Sie die KI eine professionelle Beschreibung der ausgeführten Arbeiten erstellen.";
      case "defect-analysis":
        return "Erhalten Sie eine detaillierte Analyse des Mangels mit Lösungsvorschlägen.";
      case "photo-analysis":
        return "Lassen Sie die KI das Baustellenfoto analysieren und Erkenntnisse liefern.";
      case "project-summary":
        return "Erstellen Sie eine prägnante Zusammenfassung des Projektstands.";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedText && !isLoading && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Klicken Sie auf "Generieren" um die KI zu starten
              </p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">KI arbeitet...</p>
            </div>
          )}

          {generatedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Generierter Text:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Kopiert!" : "Kopieren"}
                </Button>
              </div>
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Sie können den Text vor dem Übernehmen noch anpassen
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {!generatedText && (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generieren
                </>
              )}
            </Button>
          )}
          {generatedText && (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
                Neu generieren
              </Button>
              <Button onClick={handleApply}>Übernehmen</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

