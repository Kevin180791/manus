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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Pencil, Trash2, Calendar, TrendingUp, FileDown, FileSpreadsheet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { de } from "date-fns/locale";

type TimeRange = "today" | "week" | "month" | "all";

export default function TimeTracking() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case "week":
        return { startDate: startOfWeek(now, { locale: de }), endDate: endOfWeek(now, { locale: de }) };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();
  const { data: timeEntries, refetch } = trpc.timeTracking.getMyTimeEntries.useQuery(dateRange);
  const { data: stats } = trpc.timeTracking.getStats.useQuery(
    { startDate: dateRange.startDate!, endDate: dateRange.endDate! },
    { enabled: !!dateRange.startDate }
  );
  const { data: projects } = trpc.projects.list.useQuery();

  const deleteMutation = trpc.timeTracking.deleteTimeEntry.useMutation({
    onSuccess: () => {
      toast.success("Zeiteintrag gelöscht");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.timeTracking.updateTimeEntry.useMutation({
    onSuccess: () => {
      toast.success("Zeiteintrag aktualisiert");
      refetch();
      setShowEditDialog(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diesen Zeiteintrag wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    updateMutation.mutate({
      id: editingEntry.id,
      description: editingEntry.description,
      startTime: new Date(editingEntry.startTime),
      endTime: new Date(editingEntry.endTime),
      pauseDuration: parseInt(editingEntry.pauseDuration) || 0,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalHours = stats ? Math.floor(stats.totalMinutes / 60) : 0;
  const totalMinutes = stats ? stats.totalMinutes % 60 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meine Zeiterfassung</h1>
          <p className="text-muted-foreground">
            Übersicht und Verwaltung Ihrer erfassten Arbeitszeiten
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const XLSX = await import("xlsx");
                const data = timeEntries?.map((entry) => ({
                  Datum: format(new Date(entry.startTime), "dd.MM.yyyy"),
                  Projekt: projects?.find((p) => p.id === entry.projectId)?.name || "-",
                  Start: format(new Date(entry.startTime), "HH:mm"),
                  Ende: format(new Date(entry.endTime), "HH:mm"),
                  Pause: `${entry.pauseDuration}min`,
                  Dauer: `${Math.floor(entry.totalDuration / 60)}:${(entry.totalDuration % 60).toString().padStart(2, "0")}`,
                  Beschreibung: entry.description || "-",
                })) || [];
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Zeiterfassung");
                XLSX.writeFile(wb, `zeiterfassung_${new Date().toISOString().split("T")[0]}.xlsx`);
                toast.success("Excel exportiert");
              } catch (error) {
                toast.error("Fehler beim Excel-Export");
              }
            }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="week">Diese Woche</SelectItem>
              <SelectItem value="month">Dieser Monat</SelectItem>
              <SelectItem value="all">Alle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtzeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours}h {totalMinutes}m
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange === "today" && "Heute"}
              {timeRange === "week" && "Diese Woche"}
              {timeRange === "month" && "Dieser Monat"}
              {timeRange === "all" && "Gesamt"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einträge</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.entryCount || 0}</div>
            <p className="text-xs text-muted-foreground">Zeiteinträge erfasst</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt/Tag</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && stats.entryCount > 0
                ? formatDuration(Math.floor(stats.totalMinutes / stats.entryCount))
                : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground">Pro Eintrag</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zeiteinträge</CardTitle>
          <CardDescription>
            Alle erfassten Arbeitszeiten mit Details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!timeEntries || timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Zeiteinträge gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Startzeit</TableHead>
                  <TableHead>Endzeit</TableHead>
                  <TableHead>Pause</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => {
                  const project = projects?.find((p) => p.id === entry.projectId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.startTime), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>{project?.name || "Unbekannt"}</TableCell>
                      <TableCell>
                        {format(new Date(entry.startTime), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.endTime), "HH:mm")}
                      </TableCell>
                      <TableCell>{entry.pauseDuration}min</TableCell>
                      <TableCell className="font-medium">
                        {formatDuration(entry.totalDuration)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Details des Zeiteintrags
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startzeit</Label>
                  <Input
                    type="datetime-local"
                    value={format(new Date(editingEntry.startTime), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        startTime: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Endzeit</Label>
                  <Input
                    type="datetime-local"
                    value={format(new Date(editingEntry.endTime), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        endTime: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Pause (Minuten)</Label>
                <Input
                  type="number"
                  value={editingEntry.pauseDuration}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      pauseDuration: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={editingEntry.description || ""}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

