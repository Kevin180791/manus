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
import { Plus, FileQuestion, Pencil, Trash2 } from "lucide-react";
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

type RFIFormData = {
  projectId: string;
  title: string;
  description: string;
  status: "open" | "in_review" | "answered" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  raisedBy: string;
  assignedTo: string;
  dueDate: string;
};

const initialFormData: RFIFormData = {
  projectId: "",
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  raisedBy: "",
  assignedTo: "",
  dueDate: "",
};

export default function RFIs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RFIFormData>(initialFormData);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: rfis, isLoading } = trpc.rfis.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMutation = trpc.rfis.create.useMutation({
    onSuccess: () => {
      utils.rfis.list.invalidate();
      toast.success("RFI erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const updateMutation = trpc.rfis.update.useMutation({
    onSuccess: () => {
      utils.rfis.list.invalidate();
      toast.success("RFI erfolgreich aktualisiert");
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deleteMutation = trpc.rfis.delete.useMutation({
    onSuccess: () => {
      utils.rfis.list.invalidate();
      toast.success("RFI erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.projectId) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    const data = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      description: formData.description || undefined,
      raisedBy: formData.raisedBy || undefined,
      assignedTo: formData.assignedTo || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (rfi: any) => {
    setEditingId(rfi.id);
    setFormData({
      projectId: rfi.projectId,
      title: rfi.title,
      description: rfi.description || "",
      status: rfi.status,
      priority: rfi.priority,
      raisedBy: rfi.raisedBy || "",
      assignedTo: rfi.assignedTo || "",
      dueDate: rfi.dueDate ? new Date(rfi.dueDate).toISOString().split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese RFI wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredRFIs = rfis?.filter(rfi => {
    if (filterProject !== "all" && rfi.projectId !== filterProject) return false;
    if (filterStatus !== "all" && rfi.status !== filterStatus) return false;
    return true;
  }) || [];

  const getProjectName = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Unbekannt";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unbekannt";
  };

  const rfiStats = {
    total: rfis?.length || 0,
    open: rfis?.filter((r: any) => r.status === "open").length || 0,
    inReview: rfis?.filter((r: any) => r.status === "in_review").length || 0,
    answered: rfis?.filter((r: any) => r.status === "answered").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFI - Request for Information</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Anfragen und Klärungen</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData(initialFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Neue RFI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rfiStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rfiStats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Prüfung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{rfiStats.inReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Beantwortet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rfiStats.answered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Label>Projekt:</Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
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
        <Label>Status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="in_review">In Prüfung</SelectItem>
            <SelectItem value="answered">Beantwortet</SelectItem>
            <SelectItem value="closed">Geschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RFIs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileQuestion className="h-5 w-5 mr-2" />
            RFI Übersicht ({filteredRFIs.length})
          </CardTitle>
          <CardDescription>Alle Anfragen und Klärungen</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredRFIs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Zugewiesen an</TableHead>
                  <TableHead>Fällig am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRFIs.map((rfi: any) => (
                  <TableRow key={rfi.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rfi.subject || rfi.title}</p>
                        {rfi.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">{rfi.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getProjectName(rfi.projectId)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rfi.status === "open" ? "bg-red-100 text-red-800" :
                        rfi.status === "in_review" ? "bg-yellow-100 text-yellow-800" :
                        rfi.status === "answered" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {rfi.status === "open" ? "Offen" :
                         rfi.status === "in_review" ? "In Prüfung" :
                         rfi.status === "answered" ? "Beantwortet" : "Geschlossen"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rfi.priority === "critical" ? "bg-red-100 text-red-800" :
                        rfi.priority === "high" ? "bg-orange-100 text-orange-800" :
                        rfi.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {rfi.priority === "critical" ? "Kritisch" :
                         rfi.priority === "high" ? "Hoch" :
                         rfi.priority === "medium" ? "Mittel" : "Niedrig"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rfi.assignedTo ? getEmployeeName(rfi.assignedTo) : "Nicht zugewiesen"}
                    </TableCell>
                    <TableCell>
                      {rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString("de-DE") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rfi)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rfi.id)}
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
              <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                {filterProject !== "all" || filterStatus !== "all"
                  ? "Keine RFIs mit diesen Filtern gefunden"
                  : "Noch keine RFIs vorhanden"}
              </p>
              <Button onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Erste RFI erstellen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "RFI bearbeiten" : "Neue RFI erstellen"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die RFI-Informationen ein
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_review">In Prüfung</SelectItem>
                      <SelectItem value="answered">Beantwortet</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="critical">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raisedBy">Erstellt von</Label>
                  <Select
                    value={formData.raisedBy}
                    onValueChange={(value) => setFormData({ ...formData, raisedBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.filter(e => e.status === "active").map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Zugewiesen an</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.filter(e => e.status === "active").map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Aktualisieren" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
