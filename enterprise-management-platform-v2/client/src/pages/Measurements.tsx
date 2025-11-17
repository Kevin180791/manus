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
import { Plus, BarChart3, Pencil, Trash2, X } from "lucide-react";
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
  measurementDate: string;
};

type PositionFormData = {
  position: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  notes: string;
};

const initialFormData: MeasurementFormData = {
  projectId: "",
  title: "",
  description: "",
  measurementDate: new Date().toISOString().split("T")[0],
};

const initialPositionData: PositionFormData = {
  position: 1,
  description: "",
  quantity: "",
  unit: "m",
  unitPrice: "",
  notes: "",
};

export default function Measurements() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeasurementFormData>(initialFormData);
  const [positions, setPositions] = useState<PositionFormData[]>([]);
  const [filterProject, setFilterProject] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: measurements, isLoading } = trpc.measurements.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const createMutation = trpc.measurements.create.useMutation({
    onSuccess: () => {
      utils.measurements.list.invalidate();
      toast.success("Aufmaß erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setPositions([]);
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

  const createPositionMutation = trpc.measurementPositions.create.useMutation({
    onSuccess: () => {
      utils.measurementPositions.list.invalidate();
      toast.success("Position hinzugefügt");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deletePositionMutation = trpc.measurementPositions.delete.useMutation({
    onSuccess: () => {
      utils.measurementPositions.list.invalidate();
      toast.success("Position gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.title) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    if (positions.length === 0) {
      toast.error("Bitte fügen Sie mindestens eine Position hinzu");
      return;
    }

    // Create measurement first
    const measurementData = {
      ...formData,
      measurementDate: new Date(formData.measurementDate),
    };

    try {
      const measurement = await createMutation.mutateAsync(measurementData);

      // Then create all positions
      for (const pos of positions) {
        await createPositionMutation.mutateAsync({
          measurementId: measurement.id,
          position: pos.position,
          description: pos.description,
          quantity: parseFloat(pos.quantity),
          unit: pos.unit,
          unitPrice: pos.unitPrice ? parseFloat(pos.unitPrice) : undefined,
          notes: pos.notes || undefined,
        });
      }

      toast.success("Aufmaß mit allen Positionen erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setPositions([]);
    } catch (error) {
      console.error("Error creating measurement:", error);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Aufmaß wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddPosition = () => {
    const newPosition = {
      ...initialPositionData,
      position: positions.length + 1,
    };
    setPositions([...positions, newPosition]);
  };

  const handleRemovePosition = (index: number) => {
    const newPositions = positions.filter((_, i) => i !== index);
    // Renumber positions
    const renumbered = newPositions.map((pos, i) => ({ ...pos, position: i + 1 }));
    setPositions(renumbered);
  };

  const handlePositionChange = (index: number, field: keyof PositionFormData, value: string) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    setPositions(newPositions);
  };

  const calculateTotal = () => {
    return positions.reduce((sum, pos) => {
      const qty = parseFloat(pos.quantity) || 0;
      const price = parseFloat(pos.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setPositions([]);
    setIsDialogOpen(true);
  };

  const handleViewPositions = (measurementId: string) => {
    setSelectedMeasurementId(measurementId);
    setIsPositionDialogOpen(true);
  };

  const filteredMeasurements = measurements?.filter((m) =>
    filterProject === "all" ? true : m.projectId === filterProject
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aufmaße</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Aufmaße mit mehreren Positionen</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Aufmaß erstellen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Aufmaße ({filteredMeasurements?.length || 0})
              </CardTitle>
              <CardDescription>Übersicht aller Aufmaße</CardDescription>
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Projekt filtern" />
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredMeasurements && filteredMeasurements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeasurements.map((measurement) => {
                    const project = projects?.find((p) => p.id === measurement.projectId);
                    return (
                      <TableRow key={measurement.id}>
                        <TableCell className="font-medium">{measurement.title}</TableCell>
                        <TableCell>{project?.name || "-"}</TableCell>
                        <TableCell>
                          {new Date(measurement.measurementDate).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell>{measurement.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPositions(measurement.id)}
                            >
                              Positionen
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
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">Noch keine Aufmaße vorhanden</p>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Aufmaß erstellen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Measurement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Aufmaß erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein Aufmaß mit mehreren Positionen
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Projekt *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt wählen" />
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
                  <Label htmlFor="measurementDate">Datum *</Label>
                  <Input
                    id="measurementDate"
                    type="date"
                    value={formData.measurementDate}
                    onChange={(e) =>
                      setFormData({ ...formData, measurementDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Erdarbeiten Baugrube"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Positionen</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPosition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Position hinzufügen
                  </Button>
                </div>

                {positions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Noch keine Positionen hinzugefügt</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Fügen Sie mindestens eine Position hinzu
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {positions.map((pos, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium">Position {pos.position}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePosition(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-4 space-y-2">
                              <Label>Beschreibung *</Label>
                              <Input
                                value={pos.description}
                                onChange={(e) =>
                                  handlePositionChange(index, "description", e.target.value)
                                }
                                placeholder="z.B. Aushub Baugrube"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Menge *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={pos.quantity}
                                onChange={(e) =>
                                  handlePositionChange(index, "quantity", e.target.value)
                                }
                                placeholder="0.00"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Einheit *</Label>
                              <Select
                                value={pos.unit}
                                onValueChange={(value) =>
                                  handlePositionChange(index, "unit", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="m">m (Meter)</SelectItem>
                                  <SelectItem value="m²">m² (Quadratmeter)</SelectItem>
                                  <SelectItem value="m³">m³ (Kubikmeter)</SelectItem>
                                  <SelectItem value="Stk">Stk (Stück)</SelectItem>
                                  <SelectItem value="kg">kg (Kilogramm)</SelectItem>
                                  <SelectItem value="t">t (Tonne)</SelectItem>
                                  <SelectItem value="Std">Std (Stunden)</SelectItem>
                                  <SelectItem value="Psch">Psch (Pauschale)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Einheitspreis (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={pos.unitPrice}
                                onChange={(e) =>
                                  handlePositionChange(index, "unitPrice", e.target.value)
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Gesamt (€)</Label>
                              <Input
                                type="text"
                                value={
                                  pos.quantity && pos.unitPrice
                                    ? (
                                        parseFloat(pos.quantity) * parseFloat(pos.unitPrice)
                                      ).toFixed(2)
                                    : "0.00"
                                }
                                disabled
                                className="bg-gray-50"
                              />
                            </div>
                            <div className="col-span-4 space-y-2">
                              <Label>Notizen</Label>
                              <Textarea
                                value={pos.notes}
                                onChange={(e) =>
                                  handlePositionChange(index, "notes", e.target.value)
                                }
                                placeholder="Zusätzliche Informationen..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-end items-center pt-4 border-t">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Gesamtsumme</p>
                        <p className="text-2xl font-bold text-primary">
                          {calculateTotal().toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData(initialFormData);
                  setPositions([]);
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={!formData.projectId || !formData.title || positions.length === 0}>
                Aufmaß erstellen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Positions Dialog */}
      <MeasurementPositionsDialog
        measurementId={selectedMeasurementId}
        isOpen={isPositionDialogOpen}
        onClose={() => {
          setIsPositionDialogOpen(false);
          setSelectedMeasurementId(null);
        }}
      />
    </div>
  );
}

// Separate component for viewing positions
function MeasurementPositionsDialog({
  measurementId,
  isOpen,
  onClose,
}: {
  measurementId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: positions, isLoading } = trpc.measurementPositions.list.useQuery(
    { measurementId: measurementId || "" },
    { enabled: !!measurementId && isOpen }
  );

  const { data: total } = trpc.measurementPositions.getTotal.useQuery(
    { measurementId: measurementId || "" },
    { enabled: !!measurementId && isOpen }
  );

  const deleteMutation = trpc.measurementPositions.delete.useMutation({
    onSuccess: () => {
      toast.success("Position gelöscht");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Positionen</DialogTitle>
          <DialogDescription>Übersicht aller Positionen dieses Aufmaßes</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : positions && positions.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pos.</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead className="text-right">EP (€)</TableHead>
                  <TableHead className="text-right">GP (€)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>{pos.position}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pos.description}</p>
                        {pos.notes && <p className="text-sm text-gray-600">{pos.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{parseFloat(pos.quantity).toFixed(2)}</TableCell>
                    <TableCell>{pos.unit}</TableCell>
                    <TableCell className="text-right">
                      {pos.unitPrice ? parseFloat(pos.unitPrice).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pos.totalPrice ? parseFloat(pos.totalPrice).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Position wirklich löschen?")) {
                            deleteMutation.mutate({ id: pos.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-600">Gesamtsumme</p>
                <p className="text-2xl font-bold text-primary">
                  {total?.total.toFixed(2) || "0.00"} €
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Keine Positionen vorhanden</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

