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
import { Plus, Building2, Calendar, DollarSign, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Textarea } from "@/components/ui/textarea";

type ProjectFormData = {
  name: string;
  description: string;
  projectNumber: string;
  client: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  endDate: string;
  budget: string;
  location: string;
  projectManagerId: string;
};

const initialFormData: ProjectFormData = {
  name: "",
  description: "",
  projectNumber: "",
  client: "",
  status: "planning",
  priority: "medium",
  startDate: "",
  endDate: "",
  budget: "",
  location: "",
  projectManagerId: "",
};

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projekt erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen des Projekts: " + error.message);
    },
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projekt erfolgreich aktualisiert");
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren des Projekts: " + error.message);
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Projekt erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen des Projekts: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Bitte geben Sie einen Projektnamen ein");
      return;
    }

    const data = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      budget: formData.budget ? Math.round(parseFloat(formData.budget) * 100) : undefined,
      description: formData.description || undefined,
      projectNumber: formData.projectNumber || undefined,
      client: formData.client || undefined,
      location: formData.location || undefined,
      projectManagerId: formData.projectManagerId || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (project: any) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description || "",
      projectNumber: project.projectNumber || "",
      client: project.client || "",
      status: project.status,
      priority: project.priority,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      budget: project.budget ? (project.budget / 100).toString() : "",
      location: project.location || "",
      projectManagerId: project.projectManagerId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Projekt wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const filteredProjects = projects?.filter(project => 
    filterStatus === "all" || project.status === filterStatus
  ) || [];

  const projectStats = {
    total: projects?.length || 0,
    active: projects?.filter(p => p.status === "active").length || 0,
    planning: projects?.filter(p => p.status === "planning").length || 0,
    completed: projects?.filter(p => p.status === "completed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projektmanagement</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie alle Bauprojekte</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Projekt
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Aktiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{projectStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Planung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{projectStats.planning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{projectStats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Label>Status filtern:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="planning">Planung</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="on_hold">Pausiert</SelectItem>
            <SelectItem value="completed">Abgeschlossen</SelectItem>
            <SelectItem value="cancelled">Abgebrochen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "Keine Beschreibung"}
                    </CardDescription>
                  </div>
                  <Building2 className="h-5 w-5 text-gray-400 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.client && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {project.client}
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {project.location}
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {(project.budget / 100).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(project.startDate).toLocaleDateString("de-DE")}
                    {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString("de-DE")}`}
                  </div>
                )}
                
                <div className="flex items-center space-x-2 pt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === "active" ? "bg-green-100 text-green-800" :
                    project.status === "planning" ? "bg-blue-100 text-blue-800" :
                    project.status === "completed" ? "bg-gray-100 text-gray-800" :
                    project.status === "on_hold" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {project.status === "active" ? "Aktiv" :
                     project.status === "planning" ? "Planung" :
                     project.status === "completed" ? "Abgeschlossen" :
                     project.status === "on_hold" ? "Pausiert" : "Abgebrochen"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.priority === "critical" ? "bg-red-100 text-red-800" :
                    project.priority === "high" ? "bg-orange-100 text-orange-800" :
                    project.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {project.priority === "critical" ? "Kritisch" :
                     project.priority === "high" ? "Hoch" :
                     project.priority === "medium" ? "Mittel" : "Niedrig"}
                  </span>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    Bearbeiten
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">
              {filterStatus === "all" 
                ? "Noch keine Projekte vorhanden" 
                : "Keine Projekte mit diesem Status gefunden"}
            </p>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Projekt erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Projekt bearbeiten" : "Neues Projekt erstellen"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Projektinformationen ein
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Projektname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectNumber">Projektnummer</Label>
                  <Input
                    id="projectNumber"
                    value={formData.projectNumber}
                    onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Kunde</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  />
                </div>
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
                      <SelectItem value="planning">Planung</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="on_hold">Pausiert</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="cancelled">Abgebrochen</SelectItem>
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
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectManagerId">Projektleiter</Label>
                  <Select
                    value={formData.projectManagerId}
                    onValueChange={(value) => setFormData({ ...formData, projectManagerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projektleiter auswählen" />
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
                <Label htmlFor="location">Standort</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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

