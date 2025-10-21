import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, CheckCircle2, FileText, ListTodo, MapPin, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ProjectDetail() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Get project ID from URL
  const projectId = window.location.pathname.split("/").pop() || "";

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: tasks } = trpc.projects.getByType.useQuery({ projectId, taskType: undefined });
  const { data: teamMembers } = trpc.projects.getTeamMembers.useQuery({ projectId });
  const { data: documents } = trpc.documents.list.useQuery();
  const { data: measurements } = trpc.measurements.list.useQuery();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    taskType: "task" as "task" | "rfi" | "defect" | "question",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    assignedTo: "",
    dueDate: "",
  });

  const createTaskMutation = trpc.projects.createTask.useMutation({
    onSuccess: () => {
      utils.projects.getByType.invalidate();
      setTaskDialogOpen(false);
      setTaskFormData({
        taskType: "task",
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        dueDate: "",
      });
    },
  });

  const handleCreateTask = () => {
    createTaskMutation.mutate({
      projectId,
      ...taskFormData,
      dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
    });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Projektdetails...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Projekt nicht gefunden</p>
      </div>
    );
  }

  const tasksByType = {
    task: tasks?.filter((t: any) => t.taskType === "task") || [],
    rfi: tasks?.filter((t: any) => t.taskType === "rfi") || [],
    defect: tasks?.filter((t: any) => t.taskType === "defect") || [],
    question: tasks?.filter((t: any) => t.taskType === "question") || [],
  };

  const projectDocuments = documents?.filter((d: any) => d.projectId === projectId) || [];
  const projectMeasurements = measurements?.filter((m: any) => m.projectId === projectId) || [];

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      planning: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      on_hold: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return classes[priority as keyof typeof classes] || "bg-gray-100 text-gray-800";
  };

  const getTaskTypeLabel = (type: string) => {
    const labels = {
      task: "Aufgabe",
      rfi: "RFI",
      defect: "Mangel",
      question: "Frage",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-6">
          <Button variant="ghost" onClick={() => setLocation("/projects")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Projekten
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {project.projectNumber && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {project.projectNumber}
                  </span>
                )}
                {project.client && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {project.client}
                  </span>
                )}
                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>

          {project.description && (
            <p className="mt-4 text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="tasks">
              Aufgaben ({tasksByType.task.length + tasksByType.rfi.length + tasksByType.defect.length + tasksByType.question.length})
            </TabsTrigger>
            <TabsTrigger value="team">Team ({teamMembers?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">Dokumente ({projectDocuments.length})</TabsTrigger>
            <TabsTrigger value="measurements">Aufmaße ({projectMeasurements.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Zeitraum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Start: {new Date(project.startDate).toLocaleDateString("de-DE")}</span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Ende: {new Date(project.endDate).toLocaleDateString("de-DE")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.budget ? (
                    <p className="text-2xl font-bold">{project.budget.toLocaleString("de-DE")} €</p>
                  ) : (
                    <p className="text-muted-foreground">Nicht festgelegt</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Fortschritt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Aufgaben</span>
                      <span className="font-medium">
                        {tasks?.filter((t: any) => t.status === "completed").length || 0} / {tasks?.length || 0}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${tasks?.length ? ((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Schnellübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold text-primary">{tasksByType.task.length}</p>
                    <p className="text-sm text-muted-foreground">Aufgaben</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{tasksByType.rfi.length}</p>
                    <p className="text-sm text-muted-foreground">RFIs</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{tasksByType.defect.length}</p>
                    <p className="text-sm text-muted-foreground">Mängel</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{tasksByType.question.length}</p>
                    <p className="text-sm text-muted-foreground">Fragen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Aufgaben & RFIs</h2>
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Aufgabe
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie eine Aufgabe, RFI, Mangel oder Frage für dieses Projekt
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Typ</Label>
                      <Select
                        value={taskFormData.taskType}
                        onValueChange={(value: any) => setTaskFormData({ ...taskFormData, taskType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Aufgabe</SelectItem>
                          <SelectItem value="rfi">RFI (Request for Information)</SelectItem>
                          <SelectItem value="defect">Mangel</SelectItem>
                          <SelectItem value="question">Frage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Titel</Label>
                      <Input
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                        placeholder="Kurze Beschreibung"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Beschreibung</Label>
                      <Textarea
                        value={taskFormData.description}
                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                        placeholder="Detaillierte Beschreibung"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Priorität</Label>
                        <Select
                          value={taskFormData.priority}
                          onValueChange={(value: any) => setTaskFormData({ ...taskFormData, priority: value })}
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

                      <div className="grid gap-2">
                        <Label>Fälligkeitsdatum</Label>
                        <Input
                          type="date"
                          value={taskFormData.dueDate}
                          onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Zugewiesen an</Label>
                      <Select
                        value={taskFormData.assignedTo}
                        onValueChange={(value) => setTaskFormData({ ...taskFormData, assignedTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mitarbeiter auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers?.map((member: any) => (
                            <SelectItem key={member.employeeId} value={member.employeeId}>
                              {member.employeeId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateTask} disabled={!taskFormData.title}>
                      Erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  Alle ({tasks?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="task">
                  Aufgaben ({tasksByType.task.length})
                </TabsTrigger>
                <TabsTrigger value="rfi">
                  RFIs ({tasksByType.rfi.length})
                </TabsTrigger>
                <TabsTrigger value="defect">
                  Mängel ({tasksByType.defect.length})
                </TabsTrigger>
                <TabsTrigger value="question">
                  Fragen ({tasksByType.question.length})
                </TabsTrigger>
              </TabsList>

              {["all", "task", "rfi", "defect", "question"].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="space-y-4">
                  {(tabValue === "all" ? tasks : tasksByType[tabValue as keyof typeof tasksByType])?.map((task: any) => (
                    <Card key={task.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-muted-foreground">{task.taskNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary">
                                {getTaskTypeLabel(task.taskType)}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            {task.description && (
                              <CardDescription className="mt-2">{task.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.status === "completed" && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Fällig: {new Date(task.dueDate).toLocaleDateString("de-DE")}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Zugewiesen an: {task.assignedTo}
                            </span>
                          )}
                          <span className="ml-auto">Status: {task.status}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(tabValue === "all" ? tasks?.length === 0 : tasksByType[tabValue as keyof typeof tasksByType]?.length === 0) && (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                          <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Keine {tabValue === "all" ? "Aufgaben" : getTaskTypeLabel(tabValue)} vorhanden</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Projektteam</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Mitglied hinzufügen
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers?.map((member: any) => (
                <Card key={member.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{member.employeeId}</CardTitle>
                    {member.role && <CardDescription>{member.role}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Seit: {new Date(member.joinedAt).toLocaleDateString("de-DE")}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {teamMembers?.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Noch keine Teammitglieder zugewiesen</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Dokumente</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dokument hochladen
              </Button>
            </div>

            <div className="space-y-4">
              {projectDocuments.map((doc: any) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    {doc.description && <CardDescription>{doc.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary">
                        {doc.category}
                      </span>
                      {doc.version && <span>Version: {doc.version}</span>}
                      <span className="ml-auto">
                        {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {projectDocuments.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Dokumente vorhanden</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Aufmaße</h2>
              <Button onClick={() => setLocation("/measurements")}>
                <Plus className="h-4 w-4 mr-2" />
                Aufmaß erstellen
              </Button>
            </div>

            <div className="space-y-4">
              {projectMeasurements.map((measurement: any) => (
                <Card key={measurement.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{measurement.title}</CardTitle>
                    {measurement.description && <CardDescription>{measurement.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      {measurement.quantity && measurement.unit && (
                        <span className="font-medium">
                          {measurement.quantity} {measurement.unit}
                        </span>
                      )}
                      {measurement.location && (
                        <span className="text-muted-foreground">{measurement.location}</span>
                      )}
                      <span className="ml-auto text-muted-foreground">
                        {new Date(measurement.measurementDate).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {projectMeasurements.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Aufmaße vorhanden</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
