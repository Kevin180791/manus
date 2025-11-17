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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface WorkPackagesManagerProps {
  projectId: string;
}

export default function WorkPackagesManager({ projectId }: WorkPackagesManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { data: workPackages, refetch } = trpc.timeTracking.getWorkPackages.useQuery({ projectId });

  const createMutation = trpc.timeTracking.createWorkPackage.useMutation({
    onSuccess: () => {
      toast.success("Arbeitspaket erstellt");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.timeTracking.updateWorkPackage.useMutation({
    onSuccess: () => {
      toast.success("Arbeitspaket aktualisiert");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.timeTracking.deleteWorkPackage.useMutation({
    onSuccess: () => {
      toast.success("Arbeitspaket gelöscht");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingPackage(null);
    setShowDialog(false);
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie dieses Arbeitspaket wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    if (editingPackage) {
      updateMutation.mutate({
        id: editingPackage.id,
        name: formData.name,
        description: formData.description,
      });
    } else {
      createMutation.mutate({
        projectId,
        name: formData.name,
        description: formData.description,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Arbeitspakete
          </CardTitle>
          <CardDescription>
            Verwalten Sie die Arbeitspakete für dieses Projekt
          </CardDescription>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Paket
        </Button>
      </CardHeader>
      <CardContent>
        {!workPackages || workPackages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Arbeitspakete vorhanden. Standard-Pakete werden automatisch erstellt.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {pkg.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Arbeitspaket bearbeiten" : "Neues Arbeitspaket"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Ändern Sie die Details des Arbeitspakets"
                : "Erstellen Sie ein neues Arbeitspaket für dieses Projekt"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Heizung, Demontage, Lüftung"
              />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optionale Beschreibung des Arbeitspakets"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingPackage ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

