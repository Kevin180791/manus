import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Cloud, Download, Thermometer, Users } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

export default function DailyReportDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const reportId = params.id as string;

  const { data: report, isLoading } = trpc.dailyReports.get.useQuery(
    { id: reportId },
    { enabled: !!reportId }
  );

  const handleExportPDF = async () => {
    if (!report) return;
    try {
      const { exportDailyReportToPDF } = await import("@/lib/pdfExport");
      exportDailyReportToPDF({
        id: report.id,
        date: new Date(report.reportDate),
        workHours: report.workHours || 0,
        weather: report.weather || undefined,
        temperature: report.temperature || undefined,
        workDescription: report.workDescription || "",
        specialOccurrences: report.specialOccurrences || undefined,
        photos: photos,
      });
      toast.success("PDF wurde heruntergeladen");
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Erstellen des PDFs");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Bautagebuch-Eintrag...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Bautagebuch-Eintrag nicht gefunden</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const photos = report.photos ? JSON.parse(report.photos) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/daily-reports")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bautagebuch</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(report.reportDate), "EEEE, dd. MMMM yyyy", { locale: de })}
            </p>
          </div>
        </div>
        <Button onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Als PDF exportieren
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Weather & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Wetter und Rahmenbedingungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.weather && (
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wetterlage</p>
                    <p className="font-medium">{report.weather}</p>
                  </div>
                </div>
              )}
              {report.temperature && (
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Temperatur</p>
                    <p className="font-medium">{report.temperature}</p>
                  </div>
                </div>
              )}
              {report.workHours && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Arbeitsstunden</p>
                    <p className="font-medium">{report.workHours} Stunden</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Description */}
        {report.workDescription && (
          <Card>
            <CardHeader>
              <CardTitle>Ausgeführte Arbeiten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{report.workDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Attendees */}
        {report.attendees && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anwesende Personen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{report.attendees}</p>
            </CardContent>
          </Card>
        )}

        {/* Equipment & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.equipmentUsed && (
            <Card>
              <CardHeader>
                <CardTitle>Eingesetzte Geräte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.equipmentUsed}</p>
              </CardContent>
            </Card>
          )}
          {report.materialsDelivered && (
            <Card>
              <CardHeader>
                <CardTitle>Materiallieferungen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.materialsDelivered}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Special Occurrences */}
        {report.specialOccurrences && (
          <Card>
            <CardHeader>
              <CardTitle>Besondere Vorkommnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{report.specialOccurrences}</p>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos ({photos.length})</CardTitle>
              <CardDescription>Dokumentation der ausgeführten Arbeiten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo: string, index: number) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(photo, "_blank")}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">
              <p>Erstellt am: {report.createdAt ? format(new Date(report.createdAt), "dd.MM.yyyy HH:mm", { locale: de }) : "Unbekannt"}</p>
              {report.createdBy && <p>Erstellt von: {report.createdBy}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

