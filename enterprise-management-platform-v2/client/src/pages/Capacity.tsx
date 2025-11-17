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
import { Plus, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CapacityFormData = {
  employeeId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  allocatedHours: string;
};

const initialFormData: CapacityFormData = {
  employeeId: "",
  projectId: "",
  startDate: "",
  endDate: "",
  allocatedHours: "",
};

export default function Capacity() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CapacityFormData>(initialFormData);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: capacityPlanning, isLoading } = trpc.capacity.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const createMutation = trpc.capacity.create.useMutation({
    onSuccess: () => {
      utils.capacity.list.invalidate();
      toast.success("Kapazitätsplanung erfolgreich erstellt");
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const deleteMutation = trpc.capacity.delete.useMutation({
    onSuccess: () => {
      utils.capacity.list.invalidate();
      toast.success("Kapazitätsplanung erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.projectId || !formData.startDate || !formData.endDate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createMutation.mutate({
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      allocatedHours: formData.allocatedHours ? parseInt(formData.allocatedHours) : 40,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese Kapazitätsplanung wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredCapacity = capacityPlanning?.filter(c => 
    filterEmployee === "all" || c.employeeId === filterEmployee
  ) || [];

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unbekannt";
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Unbekannt";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kapazitätenplanung</h1>
          <p className="text-gray-600 mt-2">Planen Sie Mitarbeiterkapazitäten und Ressourcen</p>
        </div>
        <Button onClick={() => {
          setFormData(initialFormData);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Planung
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Label>Mitarbeiter filtern:</Label>
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mitarbeiter</SelectItem>
            {employees?.filter(e => e.status === "active").map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capacity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Kapazitätsübersicht ({filteredCapacity.length})
          </CardTitle>
          <CardDescription>Übersicht aller Kapazitätsplanungen</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredCapacity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Startdatum</TableHead>
                  <TableHead>Enddatum</TableHead>
                  <TableHead>Zugewiesene Stunden</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapacity.map((capacity: any) => (
                  <TableRow key={capacity.id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(capacity.employeeId)}
                    </TableCell>
                    <TableCell>{getProjectName(capacity.projectId)}</TableCell>
                    <TableCell>
                      {new Date(capacity.startDate).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      {new Date(capacity.endDate).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      {capacity.allocatedHours ? `${capacity.allocatedHours} h` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(capacity.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                {filterEmployee !== "all"
                  ? "Keine Kapazitätsplanungen für diesen Mitarbeiter gefunden"
                  : "Noch keine Kapazitätsplanungen vorhanden"}
              </p>
              <Button onClick={() => {
                setFormData(initialFormData);
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Planung erstellen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Kapazitätsplanung erstellen</DialogTitle>
            <DialogDescription>
              Weisen Sie einem Mitarbeiter Kapazitäten für ein Projekt zu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Mitarbeiter *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocatedHours">Zugewiesene Stunden</Label>
                <Input
                  id="allocatedHours"
                  type="number"
                  value={formData.allocatedHours}
                  onChange={(e) => setFormData({ ...formData, allocatedHours: e.target.value })}
                  placeholder="z.B. 40"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
