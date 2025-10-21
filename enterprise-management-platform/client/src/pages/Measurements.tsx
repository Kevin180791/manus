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
import { Plus, BarChart3, Pencil, Trash2 } from "lucide-react";
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

type MeasurementFormData = {
  projectId: string;
  title: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  measuredBy: string;
  measurementDate: string;
};

const initialFormData: MeasurementFormData = {
  projectId: "",
  title: "",
  description: "",
  unit: "m",
  quantity: "",
  unitPrice: "",
  measuredBy: "",
  measurementDate: "",
};

export default function Measurements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeasurementFormData>(initialFormData);
  const [filterProject, setFilterProject] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: measurements, isLoading } = trpc.measurements.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMutation = trpc.measurements.create.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      toast.success("Aufmaß erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const updateMutation = trpc.measurements.update.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      toast.success("Aufmaß erfolgreich aktualisiert");
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deleteMutation = trpc.measurements.delete.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      toast.success("Aufmaß erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.projectId || !formData.quantity) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    const data = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unitPrice: formData.unitPrice ? Math.round(parseFloat(formData.unitPrice) * 100) : undefined,
      measurementDate: formData.measurementDate ? new Date(formData.measurementDate) : undefined,
      description: formData.description || undefined,
      measuredBy: formData.measuredBy || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (measurement: any) => {
    setEditingId(measurement.id);
    setFormData({
      projectId: measurement.projectId,
      title: measurement.title,
      description: measurement.description || "",
      unit: measurement.unit,
      quantity: measurement.quantity.toString(),
      unitPrice: measurement.unitPrice ? (measurement.unitPrice / 100).toString() : "",
      measuredBy: measurement.measuredBy || "",
      measurementDate: measurement.measurementDate 
        ? new Date(measurement.measurementDate).toISOString().split("T")[0] 
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Aufmaß wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredMeasurements = measurements?.filter(m => 
    filterProject === "all" || m.projectId === filterProject
  ) || [];

  const getProjectName = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Unbekannt";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unbekannt";
  };

  const calculateTotal = (quantity: number, unitPrice: number | null) => {
    if (!unitPrice) return null;
    return (quantity * unitPrice) / 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aufmaße</h1>
          <p className="text-gray-600 mt-2">Erfassen und verwalten Sie Bauaufmaße</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData(initialFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Aufmaß
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Label>Projekt filtern:</Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-64">
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

      {/* Measurements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Aufmaße ({filteredMeasurements.length})
          </CardTitle>
          <CardDescription>Übersicht aller erfassten Aufmaße</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredMeasurements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Menge</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Einheitspreis</TableHead>
                  <TableHead>Gesamt</TableHead>
                  <TableHead>Erfasst von</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeasurements.map((measurement) => {
                  const total = measurement.quantity && measurement.unitPrice ? calculateTotal(measurement.quantity, measurement.unitPrice) : null;
                  return (
                    <TableRow key={measurement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{measurement.title}</p>
                          {measurement.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">{measurement.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getProjectName(measurement.projectId)}</TableCell>
                      <TableCell>{(measurement.quantity || 0).toLocaleString("de-DE")}</TableCell>
                      <TableCell>{measurement.unit}</TableCell>
                      <TableCell>
                        {measurement.unitPrice 
                          ? (measurement.unitPrice / 100).toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {total !== null
                          ? total.toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {measurement.measuredBy ? getEmployeeName(measurement.measuredBy) : "-"}
                      </TableCell>
                      <TableCell>
                        {measurement.measurementDate
                          ? new Date(measurement.measurementDate).toLocaleDateString("de-DE")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(measurement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(measurement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                {filterProject !== "all"
                  ? "Keine Aufmaße für dieses Projekt gefunden"
                  : "Noch keine Aufmaße vorhanden"}
              </p>
              <Button onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Aufmaß erstellen
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
              {editingId ? "Aufmaß bearbeiten" : "Neues Aufmaß erstellen"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Aufmaßinformationen ein
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
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Menge *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Einheit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter (m)</SelectItem>
                      <SelectItem value="m2">Quadratmeter (m²)</SelectItem>
                      <SelectItem value="m3">Kubikmeter (m³)</SelectItem>
                      <SelectItem value="kg">Kilogramm (kg)</SelectItem>
                      <SelectItem value="t">Tonne (t)</SelectItem>
                      <SelectItem value="stk">Stück (Stk)</SelectItem>
                      <SelectItem value="h">Stunden (h)</SelectItem>
                      <SelectItem value="psch">Pauschale (Psch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Einheitspreis (€)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="measuredBy">Erfasst von</Label>
                  <Select
                    value={formData.measuredBy}
                    onValueChange={(value) => setFormData({ ...formData, measuredBy: value })}
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
                  <Label htmlFor="measurementDate">Erfassungsdatum</Label>
                  <Input
                    id="measurementDate"
                    type="date"
                    value={formData.measurementDate}
                    onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
                  />
                </div>
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
