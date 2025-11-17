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
import { Plus, Pencil, Trash2, Package, UserPlus } from "lucide-react";
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

type InventoryFormData = {
  name: string;
  category: "tool" | "it_equipment" | "vehicle" | "other";
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  purchasePrice: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  condition: "excellent" | "good" | "fair" | "poor";
  location: string;
  notes: string;
};

const initialFormData: InventoryFormData = {
  name: "",
  category: "tool",
  serialNumber: "",
  manufacturer: "",
  model: "",
  purchaseDate: "",
  purchasePrice: "",
  status: "available",
  condition: "good",
  location: "",
  notes: "",
};

export default function Inventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: inventory, isLoading } = trpc.inventory.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Inventar erfolgreich hinzugefügt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Inventar erfolgreich aktualisiert");
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Inventar erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const assignMutation = trpc.inventory.assign.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Inventar erfolgreich zugewiesen");
      setIsAssignDialogOpen(false);
      setAssigningItemId(null);
      setAssignEmployeeId("");
      setAssignNotes("");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    const data = {
      ...formData,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
      purchasePrice: formData.purchasePrice ? Math.round(parseFloat(formData.purchasePrice) * 100) : undefined,
      serialNumber: formData.serialNumber || undefined,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      serialNumber: item.serialNumber || "",
      manufacturer: item.manufacturer || "",
      model: item.model || "",
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split("T")[0] : "",
      purchasePrice: item.purchasePrice ? (item.purchasePrice / 100).toString() : "",
      status: item.status,
      condition: item.condition,
      location: item.location || "",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Inventar wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAssign = (itemId: string) => {
    setAssigningItemId(itemId);
    setAssignEmployeeId("");
    setAssignNotes("");
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId || !assigningItemId) {
      toast.error("Bitte wählen Sie einen Mitarbeiter aus");
      return;
    }
    assignMutation.mutate({
      itemId: assigningItemId,
      employeeId: assignEmployeeId,
      notes: assignNotes || undefined,
    });
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventarverwaltung</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Werkzeuge, IT-Geräte und Fahrzeuge</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Inventar hinzufügen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Inventar ({inventory?.length || 0})
          </CardTitle>
          <CardDescription>Übersicht aller Inventargegenstände</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : inventory && inventory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Seriennummer</TableHead>
                    <TableHead>Hersteller</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zustand</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.category === "tool" ? "Werkzeug" :
                         item.category === "it_equipment" ? "IT-Gerät" :
                         item.category === "vehicle" ? "Fahrzeug" : "Sonstiges"}
                      </TableCell>
                      <TableCell>{item.serialNumber || "-"}</TableCell>
                      <TableCell>{item.manufacturer || "-"}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "available" ? "bg-green-100 text-green-800" :
                          item.status === "assigned" ? "bg-blue-100 text-blue-800" :
                          item.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {item.status === "available" ? "Verfügbar" :
                           item.status === "assigned" ? "Zugewiesen" :
                           item.status === "maintenance" ? "Wartung" : "Ausgemustert"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.condition === "excellent" ? "bg-green-100 text-green-800" :
                          item.condition === "good" ? "bg-blue-100 text-blue-800" :
                          item.condition === "fair" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {item.condition === "excellent" ? "Ausgezeichnet" :
                           item.condition === "good" ? "Gut" :
                           item.condition === "fair" ? "Akzeptabel" : "Schlecht"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {item.status === "available" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssign(item.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">Noch kein Inventar vorhanden</p>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Inventar hinzufügen
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
              {editingId ? "Inventar bearbeiten" : "Neues Inventar hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Informationen des Inventargegenstands ein
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="tool">Werkzeug</SelectItem>
                      <SelectItem value="it_equipment">IT-Gerät</SelectItem>
                      <SelectItem value="vehicle">Fahrzeug</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Seriennummer</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Hersteller</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modell</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Kaufdatum</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Kaufpreis (€)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
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
                      <SelectItem value="available">Verfügbar</SelectItem>
                      <SelectItem value="assigned">Zugewiesen</SelectItem>
                      <SelectItem value="maintenance">Wartung</SelectItem>
                      <SelectItem value="retired">Ausgemustert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Zustand</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Ausgezeichnet</SelectItem>
                      <SelectItem value="good">Gut</SelectItem>
                      <SelectItem value="fair">Akzeptabel</SelectItem>
                      <SelectItem value="poor">Schlecht</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Aktualisieren" : "Hinzufügen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventar zuweisen</DialogTitle>
            <DialogDescription>
              Weisen Sie dieses Inventar einem Mitarbeiter zu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Mitarbeiter *</Label>
                <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
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
                <Label htmlFor="assignNotes">Notizen</Label>
                <Textarea
                  id="assignNotes"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={assignMutation.isPending}>
                Zuweisen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
