import { useRoute, useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Upload,
  Camera,
  FileText,
  Presentation,
  Edit,
} from "lucide-react";
import FloorPlanUpload from "@/components/FloorPlanUpload";
import PhotoUpload from "@/components/PhotoUpload";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id || "";
  const [showFloorPlanDialog, setShowFloorPlanDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

  const { data: project, isLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  const generateReport = trpc.reports.generateReport.useMutation({
    onSuccess: () => {
      toast.success("Bericht wird erstellt...");
      setIsGeneratingReport(false);
      // TODO: Download or display the generated report
    },
    onError: () => {
      toast.error("Fehler beim Erstellen des Berichts");
      setIsGeneratingReport(false);
    },
  });

  const generatePresentation = trpc.reports.generatePresentation.useMutation({
    onSuccess: () => {
      toast.success("Präsentation wird erstellt...");
      setIsGeneratingPresentation(false);
      // TODO: Download or display the generated presentation
    },
    onError: () => {
      toast.error("Fehler beim Erstellen der Präsentation");
      setIsGeneratingPresentation(false);
    },
  });

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    generateReport.mutate({ projectId });
  };

  const handleGeneratePresentation = () => {
    setIsGeneratingPresentation(true);
    generatePresentation.mutate({ projectId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparation":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "preparation":
        return "Vorbereitung";
      case "in_progress":
        return "In Bearbeitung";
      case "review":
        return "Prüfung";
      case "completed":
        return "Abgeschlossen";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container py-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-10 w-96" />
          </div>
        </header>
        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Projekt nicht gefunden</CardTitle>
            <CardDescription>
              Das angeforderte Projekt existiert nicht oder wurde gelöscht.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
                <Badge className={getStatusColor(project.status)} variant="secondary">
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {project.client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {project.client}
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.startDate).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" />
              Bearbeiten
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
                <CardDescription>
                  Wählen Sie eine Aktion, um mit der Dokumentation fortzufahren
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2" 
                  size="lg"
                  onClick={() => setShowFloorPlanDialog(true)}
                >
                  <Upload className="w-8 h-8 text-blue-600" />
                  <span className="font-semibold">Grundriss hochladen</span>
                  <span className="text-xs text-slate-600">PDF oder Bild</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2" 
                  size="lg"
                  onClick={() => setShowPhotoDialog(true)}
                >
                  <Camera className="w-8 h-8 text-green-600" />
                  <span className="font-semibold">Fotos hinzufügen</span>
                  <span className="text-xs text-slate-600">Dokumentation starten</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2" 
                  size="lg"
                  onClick={() => setLocation(`/projects/${projectId}/findings`)}
                >
                  <FileText className="w-8 h-8 text-purple-600" />
                  <span className="font-semibold">Feststellungen</span>
                  <span className="text-xs text-slate-600">Verwalten & Dokumentieren</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2" 
                  size="lg"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <span className="font-semibold">
                    {isGeneratingReport ? "Wird erstellt..." : "Bericht"}
                  </span>
                  <span className="text-xs text-slate-600">Word-Dokument</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2" 
                  size="lg"
                  onClick={handleGeneratePresentation}
                  disabled={isGeneratingPresentation}
                >
                  <Presentation className="w-8 h-8 text-orange-600" />
                  <span className="font-semibold">
                    {isGeneratingPresentation ? "Wird erstellt..." : "Präsentation"}
                  </span>
                  <span className="text-xs text-slate-600">Automatisch generieren</span>
                </Button>
              </CardContent>
            </Card>

            {/* Inspections */}
            <Card>
              <CardHeader>
                <CardTitle>Begehungen</CardTitle>
                <CardDescription>
                  {project.inspections?.length || 0} Begehung(en) dokumentiert
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.inspections && project.inspections.length > 0 ? (
                  <div className="space-y-3">
                    {project.inspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {inspection.inspectionDate
                                ? new Date(inspection.inspectionDate).toLocaleDateString("de-DE")
                                : "Kein Datum"}
                            </div>
                            <div className="text-sm text-slate-600">
                              Status: {getStatusLabel(inspection.status)}
                            </div>
                          </div>
                          <Badge variant="secondary">{inspection.mode === "guided" ? "Geführt" : "Quick Capture"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Noch keine Begehungen dokumentiert</p>
                    <Button className="mt-4 gap-2">
                      <Camera className="w-4 h-4" />
                      Erste Begehung starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projektdetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">Status</div>
                  <Badge className={getStatusColor(project.status)} variant="secondary">
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                {project.client && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Auftraggeber</div>
                    <div className="text-slate-900">{project.client}</div>
                  </div>
                )}
                {project.location && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Standort</div>
                    <div className="text-slate-900">{project.location}</div>
                  </div>
                )}
                {project.startDate && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Startdatum</div>
                    <div className="text-slate-900">
                      {new Date(project.startDate).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Enddatum</div>
                    <div className="text-slate-900">
                      {new Date(project.endDate).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">Erstellt am</div>
                  <div className="text-slate-900">
                    {new Date(project.createdAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Begehungen</span>
                  <span className="font-semibold">{project.inspections?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Feststellungen</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fotos</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Berichte</span>
                  <span className="font-semibold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floor Plan Upload Dialog */}
      <Dialog open={showFloorPlanDialog} onOpenChange={setShowFloorPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grundriss hochladen</DialogTitle>
            <DialogDescription>
              Laden Sie einen Grundriss als PDF oder Bild hoch
            </DialogDescription>
          </DialogHeader>
          <FloorPlanUpload 
            projectId={projectId} 
            onUploadComplete={() => setShowFloorPlanDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos hinzufügen</DialogTitle>
            <DialogDescription>
              Laden Sie Fotos hoch und fügen Sie Beschreibungen hinzu
            </DialogDescription>
          </DialogHeader>
          <PhotoUpload 
            projectId={projectId} 
            onUploadComplete={() => setShowPhotoDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

