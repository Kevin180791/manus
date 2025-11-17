import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, Calendar, CheckCircle, Clock, XCircle, Pencil, Trash2, FileDown } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function InspectionProtocols() {
  const params = useParams();
  const projectId = params.projectId as string | undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionType: "regular" as "regular" | "special" | "final" | "acceptance",
    participants: "",
    areas: "",
    findings: "",
    generalNotes: "",
    nextSteps: "",
  });

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: protocols, isLoading } = trpc.inspectionProtocols.list.useQuery(
    projectId || selectedProjectId ? { projectId: projectId || selectedProjectId } : undefined
  );
  const utils = trpc.useUtils();
  const createMutation = trpc.inspectionProtocols.create.useMutation({
    onSuccess: () => {
      toast.success("Begehungsprotokoll erstellt");
      setIsDialogOpen(false);
      setFormData({
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectionType: "regular" as "regular" | "special" | "final" | "acceptance",
        participants: "",
        areas: "",
        findings: "",
        generalNotes: "",
        nextSteps: "",
      });
      setPhotos([]);
      utils.inspectionProtocols.list.invalidate();
    },
  });

  const updateMutation = trpc.inspectionProtocols.update.useMutation({
    onSuccess: () => {
      toast.success("Begehungsprotokoll aktualisiert");
      setIsDialogOpen(false);
      setFormData({
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectionType: "regular" as "regular" | "special" | "final" | "acceptance",
        participants: "",
        areas: "",
        findings: "",
        generalNotes: "",
        nextSteps: "",
      });
      setEditingProtocol(null);
      setPhotos([]);
      utils.inspectionProtocols.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.inspectionProtocols.delete.useMutation({
    onSuccess: () => {
      toast.success("Begehungsprotokoll gelöscht");
      utils.inspectionProtocols.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const exportMutation = trpc.exports.exportInspectionProtocol.useMutation({
    onSuccess: (data) => {
      toast.success(`PDF erstellt: ${data.fileName}`);
      toast.info("Das PDF wurde als Projektdokument gespeichert");
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen des PDFs: " + error.message);
    },
  });

  const handleExportPDF = (protocolId: string) => {
    toast.info("PDF wird generiert...");
    exportMutation.mutate({ protocolId });
  };

  const statusIcons = {
    draft: <Clock className="h-4 w-4 text-yellow-600" />,
    completed: <CheckCircle className="h-4 w-4 text-blue-600" />,
    approved: <CheckCircle className="h-4 w-4 text-green-600" />,
  };

  const typeLabels = {
    regular: "Regelbegehung",
    special: "Sonderbegehung",
    final: "Endabnahme",
    acceptance: "Abnahme",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      projectId: projectId || selectedProjectId,
      ...formData,
      inspectionDate: new Date(formData.inspectionDate),
      photos: JSON.stringify(photos),
    };
    
    if (editingProtocol) {
      updateMutation.mutate({ id: editingProtocol.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (protocol: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProtocol(protocol);
    setFormData({
      inspectionDate: protocol.inspectionDate ? new Date(protocol.inspectionDate).toISOString().split('T')[0] : '',
      inspectionType: protocol.inspectionType || 'regular',
      participants: protocol.participants || '',
      areas: protocol.areas || '',
      findings: protocol.findings || '',
      generalNotes: protocol.generalNotes || '',
      nextSteps: protocol.nextSteps || '',
    });
    try {
      setPhotos(protocol.photos ? JSON.parse(protocol.photos) : []);
    } catch {
      setPhotos([]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Begehungsprotokoll wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Begehungsprotokolle</h1>
          <p className="text-muted-foreground mt-2">Fotodokumentation und Inspektionsprotokolle</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Begehung
        </Button>
      </div>

      <div className="grid gap-4">
        {protocols && protocols.length > 0 ? (
          protocols.map((protocol) => (
            <Card key={protocol.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      {typeLabels[protocol.inspectionType]}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {protocol.inspectionDate ? format(new Date(protocol.inspectionDate), "dd. MMMM yyyy", { locale: de }) : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        {statusIcons[protocol.status]}
                        {protocol.status === "draft" ? "Entwurf" : protocol.status === "completed" ? "Abgeschlossen" : "Genehmigt"}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(protocol.id);
                      }}
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(protocol, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(protocol.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {protocol.participants && (
                  <div>
                    <h4 className="font-semibold mb-1">Teilnehmer</h4>
                    <p className="text-sm text-muted-foreground">{protocol.participants}</p>
                  </div>
                )}
                {protocol.generalNotes && (
                  <div>
                    <h4 className="font-semibold mb-1">Allgemeine Anmerkungen</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{protocol.generalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Begehungsprotokolle vorhanden</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Begehungsprotokoll</DialogTitle>
            <DialogDescription>Dokumentieren Sie die Baustellenbegehung</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inspectionDate">Datum *</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inspectionType">Art der Begehung *</Label>
                <Select value={formData.inspectionType} onValueChange={(value: any) => setFormData({ ...formData, inspectionType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regelbegehung</SelectItem>
                    <SelectItem value="special">Sonderbegehung</SelectItem>
                    <SelectItem value="final">Endabnahme</SelectItem>
                    <SelectItem value="acceptance">Abnahme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="participants">Teilnehmer</Label>
              <Textarea
                id="participants"
                placeholder="Namen der Teilnehmer"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="areas">Begangene Bereiche</Label>
              <Textarea
                id="areas"
                placeholder="Liste der inspizierten Bereiche"
                value={formData.areas}
                onChange={(e) => setFormData({ ...formData, areas: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="findings">Feststellungen</Label>
              <Textarea
                id="findings"
                placeholder="Feststellungen und Beobachtungen"
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="generalNotes">Allgemeine Anmerkungen</Label>
              <Textarea
                id="generalNotes"
                placeholder="Weitere Anmerkungen"
                value={formData.generalNotes}
                onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="nextSteps">Nächste Schritte</Label>
              <Textarea
                id="nextSteps"
                placeholder="Geplante Maßnahmen und Folgetermine"
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fotos</Label>
            <PhotoUpload
              existingPhotos={photos}
              onUploadComplete={setPhotos}
              maxPhotos={20}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit}>
              {editingProtocol ? "Aktualisieren" : "Protokoll erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
