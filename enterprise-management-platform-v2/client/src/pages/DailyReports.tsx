import { trpc } from "@/lib/trpc";
import { PhotoUpload } from "@/components/PhotoUpload";
import { AIAssistantDialog } from "@/components/AIAssistantDialog";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Calendar, Cloud, Thermometer, Users, Package, AlertTriangle, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type DailyReportFormData = {
  reportDate: string;
  weather: string;
  temperature: string;
  workDescription: string;
  specialOccurrences: string;
  attendees: string;
  workHours: string;
  equipmentUsed: string;
  materialsDelivered: string;
  visitorsContractors: string;
  safetyIncidents: string;
};

const initialFormData: DailyReportFormData = {
  reportDate: new Date().toISOString().split('T')[0],
  weather: "",
  temperature: "",
  workDescription: "",
  specialOccurrences: "",
  attendees: "",
  workHours: "8",
  equipmentUsed: "",
  materialsDelivered: "",
  visitorsContractors: "",
  safetyIncidents: "",
};

export default function DailyReports() {
  const params = useParams();
  const projectId = params.projectId as string | undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DailyReportFormData>(initialFormData);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: reports, isLoading } = trpc.dailyReports.list.useQuery(
    projectId || selectedProjectId ? { projectId: projectId || selectedProjectId } : undefined
  );
  const utils = trpc.useUtils();
  const createMutation = trpc.dailyReports.create.useMutation({
    onSuccess: () => {
      toast.success("Bautagebuch-Eintrag erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingReport(null);
      setPhotos([]);
      utils.dailyReports.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.dailyReports.update.useMutation({
    onSuccess: () => {
      toast.success("Bautagebuch-Eintrag aktualisiert");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingReport(null);
      setPhotos([]);
      utils.dailyReports.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.dailyReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Bautagebuch-Eintrag gelöscht");
      utils.dailyReports.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    const data = {
      projectId: projectId || selectedProjectId,
      reportDate: new Date(formData.reportDate),
      weather: formData.weather,
      temperature: formData.temperature,
      workDescription: formData.workDescription,
      specialOccurrences: formData.specialOccurrences,
      attendees: formData.attendees,
      workHours: formData.workHours ? parseInt(formData.workHours) : undefined,
      equipmentUsed: formData.equipmentUsed,
      materialsDelivered: formData.materialsDelivered,
      visitorsContractors: formData.visitorsContractors,
      safetyIncidents: formData.safetyIncidents,
      photos: JSON.stringify(photos),
    };

    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (report: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingReport(report);
    setFormData({
      reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : '',
      weather: report.weather || '',
      temperature: report.temperature || '',
      workDescription: report.workDescription || '',
      specialOccurrences: report.specialOccurrences || '',
      attendees: report.attendees || '',
      workHours: report.workHours?.toString() || '',
      equipmentUsed: report.equipmentUsed || '',
      materialsDelivered: report.materialsDelivered || '',
      visitorsContractors: report.visitorsContractors || '',
      safetyIncidents: report.safetyIncidents || '',
    });
    try {
      setPhotos(report.photos ? JSON.parse(report.photos) : []);
    } catch {
      setPhotos([]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Öchten Sie diesen Eintrag wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bautagebuch</h1>
          <p className="text-muted-foreground mt-2">
            Tägliche Dokumentation der Baustellenaktivitäten
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Eintrag
        </Button>
      </div>

      <div className="grid gap-6">
        {reports && reports.length > 0 ? (
            reports.map((report: any) => (
              <Link key={report.id} href={`/daily-reports/${report.id}`}>
                <div className="cursor-pointer hover:shadow-lg transition-shadow">
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {report.reportDate ? format(new Date(report.reportDate), "EEEE, dd. MMMM yyyy", { locale: de }) : "Kein Datum"}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      {report.weather && (
                        <span className="flex items-center gap-1">
                          <Cloud className="h-4 w-4" />
                          {report.weather}
                        </span>
                      )}
                      {report.temperature && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-4 w-4" />
                          {report.temperature}
                        </span>
                      )}
                      {report.workHours && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {report.workHours}h Arbeitsstunden
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(report, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(report.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.workDescription && (
                  <div>
                    <h4 className="font-semibold mb-1">Ausgeführte Arbeiten</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.workDescription}</p>
                  </div>
                )}
                {report.specialOccurrences && (
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Besondere Vorkommnisse
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.specialOccurrences}</p>
                  </div>
                )}
                {report.materialsDelivered && (
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Materiallieferungen
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.materialsDelivered}</p>
                  </div>
                )}
              </CardContent>
            </Card>
                </div>
              </Link>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Bautagebuch-Einträge vorhanden</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Bautagebuch-Eintrag</DialogTitle>
            <DialogDescription>
              Dokumentieren Sie die täglichen Aktivitäten auf der Baustelle
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reportDate">Datum *</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weather">Wetter</Label>
                <Input
                  id="weather"
                  placeholder="z.B. Sonnig, Bewölkt, Regen"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperatur</Label>
                <Input
                  id="temperature"
                  placeholder="z.B. 15°C"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="workDescription">Ausgeführte Arbeiten *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAiDialogOpen(true)}
                  className="h-8"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  KI-Assistent
                </Button>
              </div>
              <Textarea
                id="workDescription"
                placeholder="Beschreiben Sie die heute ausgeführten Arbeiten..."
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendees">Anwesende Mitarbeiter</Label>
                <Textarea
                  id="attendees"
                  placeholder="Namen der anwesenden Mitarbeiter"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="workHours">Arbeitsstunden</Label>
                <Input
                  id="workHours"
                  type="number"
                  placeholder="8"
                  value={formData.workHours}
                  onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="equipmentUsed">Eingesetzte Geräte/Maschinen</Label>
              <Textarea
                id="equipmentUsed"
                placeholder="Liste der verwendeten Geräte und Maschinen"
                value={formData.equipmentUsed}
                onChange={(e) => setFormData({ ...formData, equipmentUsed: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="materialsDelivered">Materiallieferungen</Label>
              <Textarea
                id="materialsDelivered"
                placeholder="Heute gelieferte Materialien"
                value={formData.materialsDelivered}
                onChange={(e) => setFormData({ ...formData, materialsDelivered: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="visitorsContractors">Besucher/Nachunternehmer</Label>
              <Textarea
                id="visitorsContractors"
                placeholder="Besucher und Nachunternehmer auf der Baustelle"
                value={formData.visitorsContractors}
                onChange={(e) => setFormData({ ...formData, visitorsContractors: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="specialOccurrences">Besondere Vorkommnisse</Label>
              <Textarea
                id="specialOccurrences"
                placeholder="Besondere Ereignisse, Probleme oder Verzögerungen"
                value={formData.specialOccurrences}
                onChange={(e) => setFormData({ ...formData, specialOccurrences: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="safetyIncidents">Sicherheitsvorfälle</Label>
              <Textarea
                id="safetyIncidents"
                placeholder="Sicherheitsrelevante Vorfälle oder Beobachtungen"
                value={formData.safetyIncidents}
                onChange={(e) => setFormData({ ...formData, safetyIncidents: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>Fotos</Label>
              <PhotoUpload
                onUploadComplete={(urls) => setPhotos(urls)}
                existingPhotos={photos}
                maxPhotos={20}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.reportDate || !formData.workDescription}>
              Eintrag erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIAssistantDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        type="daily-report"
        context={{
          workDetails: formData.workDescription,
          weather: formData.weather,
          hours: formData.workHours ? parseFloat(formData.workHours) : undefined,
        }}
        onApply={(generatedText) => {
          setFormData({ ...formData, workDescription: generatedText });
        }}
      />
    </div>
  );
}
