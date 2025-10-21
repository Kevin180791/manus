import { trpc } from "@/lib/trpc";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Download, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type DocumentFormData = {
  title: string;
  category: "plan" | "contract" | "rfi" | "measurement" | "progress_report" | "other";
  projectId: string;
  version: string;
  notes: string;
};

const initialFormData: DocumentFormData = {
  title: "",
  category: "other",
  projectId: "",
  version: "1.0",
  notes: "",
};

export default function Documents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DocumentFormData>(initialFormData);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      toast.success("Dokument erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      toast.success("Dokument erfolgreich gelöscht");
    },
    onError: (error: any) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.projectId) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createMutation.mutate({
      ...formData,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Dokument wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredDocuments = documents?.filter(doc => {
    if (filterProject !== "all" && doc.projectId !== filterProject) return false;
    if (filterCategory !== "all" && doc.category !== filterCategory) return false;
    return true;
  }) || [];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      plan: "Plan",
      contract: "Vertrag",
      rfi: "RFI",
      measurement: "Aufmaß",
      progress_report: "Fortschrittsbericht",
      other: "Sonstiges",
    };
    return labels[category] || category;
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Unbekannt";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dokumentenverwaltung</h1>
          <p className="text-gray-600 mt-2">Zentrale Verwaltung aller Projektdokumente</p>
        </div>
        <Button onClick={() => {
          setFormData(initialFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Dokument hinzufügen
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projekt</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Projekte</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="contract">Vertrag</SelectItem>
                  <SelectItem value="rfi">RFI</SelectItem>
                  <SelectItem value="measurement">Aufmaß</SelectItem>
                  <SelectItem value="progress_report">Fortschrittsbericht</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Dokumente ({filteredDocuments.length})
          </CardTitle>
          <CardDescription>Übersicht aller Dokumente</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{doc.title}</p>
                        {doc.notes && (
                          <p className="text-sm text-gray-600 line-clamp-1">{doc.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getProjectName(doc.projectId)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(doc.category)}
                      </span>
                    </TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      {new Date(doc.createdAt!).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {doc.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl!, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                {filterProject !== "all" || filterCategory !== "all"
                  ? "Keine Dokumente mit diesen Filtern gefunden"
                  : "Noch keine Dokumente vorhanden"}
              </p>
              <Button onClick={() => {
                setFormData(initialFormData);
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Dokument hinzufügen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dokument hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie ein neues Dokument zum Projekt hinzu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Projekt *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="contract">Vertrag</SelectItem>
                      <SelectItem value="rfi">RFI</SelectItem>
                      <SelectItem value="measurement">Aufmaß</SelectItem>
                      <SelectItem value="progress_report">Fortschrittsbericht</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Die Datei-Upload-Funktionalität kann über die S3-Storage-Integration erweitert werden.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
