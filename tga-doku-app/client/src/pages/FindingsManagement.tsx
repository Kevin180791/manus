import { useRoute, useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KG_CATEGORIES, PRIORITY_OPTIONS, STATUS_OPTIONS } from "@shared/kg-categories";

export default function FindingsManagement() {
  const [, params] = useRoute("/projects/:id/findings");
  const [, setLocation] = useLocation();
  const projectId = params?.id || "";

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFinding, setNewFinding] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    location: "",
    recommendation: "",
    responsibility: "",
    deadline: "",
  });

  const { data: findings, isLoading, refetch } = trpc.findings.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const createFinding = trpc.findings.create.useMutation({
    onSuccess: () => {
      toast.success("Feststellung erfolgreich erstellt");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("Fehler beim Erstellen der Feststellung");
    },
  });

  const deleteFinding = trpc.findings.delete.useMutation({
    onSuccess: () => {
      toast.success("Feststellung gelöscht");
      refetch();
    },
    onError: () => {
      toast.error("Fehler beim Löschen");
    },
  });

  const resetForm = () => {
    setNewFinding({
      title: "",
      description: "",
      category: "",
      priority: "medium",
      location: "",
      recommendation: "",
      responsibility: "",
      deadline: "",
    });
  };

  const handleSubmit = () => {
    if (!newFinding.title || !newFinding.category) {
      toast.error("Bitte füllen Sie mindestens Titel und Kategorie aus");
      return;
    }

    createFinding.mutate({
      projectId,
      ...newFinding,
    });
  };

  const getPriorityColor = (priority: string) => {
    const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
    return option?.color || "text-slate-600";
  };

  const getPriorityLabel = (priority: string) => {
    const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
    return option?.label || priority;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation(`/projects/${projectId}`)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Feststellungen</h1>
                <p className="text-sm text-slate-600">Verwalten Sie alle Feststellungen</p>
              </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Neue Feststellung
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Lädt...</p>
          </div>
        ) : findings && findings.length > 0 ? (
          <div className="grid gap-4">
            {findings.map((finding) => (
              <Card key={finding.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {KG_CATEGORIES.find((c) => c.value === finding.category)?.label}
                        </Badge>
                        <Badge className={getPriorityColor(finding.priority)}>
                          {getPriorityLabel(finding.priority)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{finding.title}</CardTitle>
                      {finding.location && (
                        <CardDescription className="mt-1">
                          Ort: {finding.location}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFinding.mutate({ id: finding.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(finding.description || finding.recommendation) && (
                  <CardContent className="space-y-4">
                    {finding.description && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-1">
                          Beschreibung
                        </h4>
                        <p className="text-sm text-slate-600">{finding.description}</p>
                      </div>
                    )}
                    {finding.recommendation && (
                      <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-1">
                          Empfehlung
                        </h4>
                        <p className="text-sm text-slate-600">{finding.recommendation}</p>
                      </div>
                    )}
                    {(finding.responsibility || finding.deadline) && (
                      <div className="flex gap-4 text-sm">
                        {finding.responsibility && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              Verantwortlich:
                            </span>{" "}
                            {finding.responsibility}
                          </div>
                        )}
                        {finding.deadline && (
                          <div>
                            <span className="font-semibold text-slate-700">Frist:</span>{" "}
                            {finding.deadline}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Keine Feststellungen
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Erstellen Sie Ihre erste Feststellung
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="w-5 h-5" />
                  Feststellung hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Finding Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Feststellung</DialogTitle>
            <DialogDescription>
              Erfassen Sie eine neue Feststellung mit allen relevanten Details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="z.B. Leitungsverläufe unklar"
                value={newFinding.title}
                onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select
                  value={newFinding.category}
                  onValueChange={(value) =>
                    setNewFinding({ ...newFinding, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {KG_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={newFinding.priority}
                  onValueChange={(value: any) =>
                    setNewFinding({ ...newFinding, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                placeholder="z.B. 3.OG Sozialtrakt"
                value={newFinding.location}
                onChange={(e) => setNewFinding({ ...newFinding, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Detaillierte Beschreibung der Feststellung..."
                rows={4}
                value={newFinding.description}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation">Empfehlung</Label>
              <Textarea
                id="recommendation"
                placeholder="Empfohlene Maßnahmen..."
                rows={3}
                value={newFinding.recommendation}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, recommendation: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsibility">Verantwortlich</Label>
                <Input
                  id="responsibility"
                  placeholder="z.B. Planungsbüro"
                  value={newFinding.responsibility}
                  onChange={(e) =>
                    setNewFinding({ ...newFinding, responsibility: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Frist</Label>
                <Input
                  id="deadline"
                  placeholder="z.B. KW 45/2025"
                  value={newFinding.deadline}
                  onChange={(e) =>
                    setNewFinding({ ...newFinding, deadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createFinding.isPending}
                className="flex-1"
              >
                {createFinding.isPending ? "Wird erstellt..." : "Feststellung erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

