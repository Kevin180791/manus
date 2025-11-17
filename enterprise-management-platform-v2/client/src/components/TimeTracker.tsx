import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Square, Clock, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


export default function TimeTracker() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [selectedWorkPackage, setSelectedWorkPackage] = useState<string>("");
  const [description, setDescription] = useState("");


  const { data: projects } = trpc.projects.list.useQuery();
  const { data: activeSession, refetch: refetchSession } = trpc.timeTracking.getActiveSession.useQuery();
  const { data: workPackages } = trpc.timeTracking.getWorkPackagesByProject.useQuery(
    { projectId: activeSession?.projectId || selectedProject },
    { enabled: !!(activeSession?.projectId || selectedProject) }
  );

  const startMutation = trpc.timeTracking.startTimer.useMutation({
    onSuccess: () => {
      toast.success("Timer gestartet");
      refetchSession();
    },
    onError: (error) => toast.error(error.message),
  });

  const pauseMutation = trpc.timeTracking.pauseTimer.useMutation({
    onSuccess: () => {
      toast.success("Timer pausiert");
      refetchSession();
    },
    onError: (error) => toast.error(error.message),
  });

  const resumeMutation = trpc.timeTracking.resumeTimer.useMutation({
    onSuccess: () => {
      toast.success("Timer fortgesetzt");
      refetchSession();
    },
    onError: (error) => toast.error(error.message),
  });

  const stopMutation = trpc.timeTracking.stopTimer.useMutation({
    onSuccess: (data) => {
      toast.success(`Zeiterfassung beendet: ${Math.floor(data.duration / 60)}h ${data.duration % 60}m`);
      refetchSession();
      setShowStopDialog(false);
      setDescription("");
      setSelectedWorkPackage("");
    },
    onError: (error) => toast.error(error.message),
  });

  const generateDescriptionMutation = trpc.ai.generateDescription.useMutation({
    onSuccess: (data) => {
      setDescription(data.description);
      toast.success("Beschreibung generiert");
    },
    onError: (error) => toast.error(error.message),
  });



  // Update elapsed time and check for notifications
  useEffect(() => {
    if (!activeSession) {
      setElapsedTime(0);

      return;
    }

    const updateTime = () => {
      const start = new Date(activeSession.startTime).getTime();
      const now = Date.now();
      let elapsed = Math.floor((now - start) / 1000);

      // Subtract pause time
      if (activeSession.status === "paused" && activeSession.lastPauseStart) {
        const pauseStart = new Date(activeSession.lastPauseStart).getTime();
        elapsed -= Math.floor((now - pauseStart) / 1000);
      }

      if (activeSession.totalPauseDuration) {
        elapsed -= activeSession.totalPauseDuration * 60;
      }

      setElapsedTime(Math.max(0, elapsed));

      // Benachrichtigungen temporär deaktiviert - wird später mit Service Worker implementiert
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession, projects]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!selectedProject) {
      toast.error("Bitte Projekt auswählen");
      return;
    }
    startMutation.mutate({ projectId: selectedProject });
  };

  const handlePause = () => {
    if (activeSession?.status === "running") {
      pauseMutation.mutate();
    } else {
      resumeMutation.mutate();
    }
  };

  const handleStop = () => {
    setShowStopDialog(true);
  };

  const confirmStop = () => {
    stopMutation.mutate({
      workPackageId: selectedWorkPackage || undefined,
      description: description || undefined,
    });
  };

  const handleGenerateDescription = () => {
    const project = projects?.find((p) => p.id === (activeSession?.projectId || selectedProject));
    const workPackage = workPackages?.find((wp) => wp.id === selectedWorkPackage);
    
    generateDescriptionMutation.mutate({
      context: `Projekt: ${project?.name || "Unbekannt"}
Arbeitspaket: ${workPackage?.name || "Nicht ausgewählt"}
Dauer: ${formatTime(elapsedTime)}`,
      type: "time_entry",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Zeiterfassung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeSession ? (
            <div className="space-y-4">
              <div>
                <Label>Projekt auswählen</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Projekt wählen..." />
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
              <Button 
                onClick={handleStart} 
                disabled={!selectedProject || startMutation.isPending}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Timer starten
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">{formatTime(elapsedTime)}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {projects?.find((p) => p.id === activeSession.projectId)?.name || "Projekt"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="flex-1"
                  disabled={pauseMutation.isPending || resumeMutation.isPending}
                >
                  {activeSession.status === "running" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Fortsetzen
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stopp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zeiterfassung beenden</DialogTitle>
            <DialogDescription>
              Erfasste Zeit: {formatTime(elapsedTime)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Arbeitspaket</Label>
              <Select value={selectedWorkPackage} onValueChange={setSelectedWorkPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Arbeitspaket wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {workPackages?.map((wp) => (
                    <SelectItem key={wp.id} value={wp.id}>
                      {wp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tätigkeitsbeschreibung</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateDescription}
                  disabled={generateDescriptionMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  KI-Vorschlag
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Was haben Sie gemacht?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={confirmStop} disabled={stopMutation.isPending}>
              Zeiterfassung beenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

