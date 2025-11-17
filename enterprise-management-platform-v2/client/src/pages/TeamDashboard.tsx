import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Clock, TrendingUp, FileSpreadsheet, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { de } from "date-fns/locale";

type TimeRange = "today" | "week" | "month";

export default function TeamDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case "week":
        return { startDate: startOfWeek(now, { locale: de }), endDate: endOfWeek(now, { locale: de }) };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();
  const { data: teamStats } = trpc.timeTracking.getTeamStats.useQuery({
    ...dateRange,
    projectId: selectedProject !== "all" ? selectedProject : undefined,
  });
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = teamStats?.employeeStats.map((stat) => ({
        Mitarbeiter: stat.employeeName,
        "Gesamtzeit (h)": (stat.totalMinutes / 60).toFixed(2),
        "Einträge": stat.entryCount,
        "Durchschnitt/Tag (h)": stat.entryCount > 0 ? ((stat.totalMinutes / stat.entryCount) / 60).toFixed(2) : "0",
        "Projekte": stat.projectCount,
      })) || [];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Team-Übersicht");
      XLSX.writeFile(wb, `team_zeiterfassung_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exportiert");
    } catch (error) {
      toast.error("Fehler beim Excel-Export");
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalHours = teamStats ? Math.floor(teamStats.totalMinutes / 60) : 0;
  const totalMinutes = teamStats ? teamStats.totalMinutes % 60 : 0;
  const avgHoursPerEmployee = teamStats && teamStats.employeeStats.length > 0
    ? Math.floor((teamStats.totalMinutes / teamStats.employeeStats.length) / 60)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team-Dashboard
          </h1>
          <p className="text-muted-foreground">
            Übersicht aller Mitarbeiter-Zeiten und Auslastung
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
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
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="week">Diese Woche</SelectItem>
              <SelectItem value="month">Dieser Monat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.employeeStats.length || 0}</div>
            <p className="text-xs text-muted-foreground">Mit Zeiteinträgen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø pro Mitarbeiter</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHoursPerEmployee}h</div>
            <p className="text-xs text-muted-foreground">Durchschnittliche Arbeitszeit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.projectCount || 0}</div>
            <p className="text-xs text-muted-foreground">Aktive Projekte</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter-Übersicht</CardTitle>
          <CardDescription>
            Detaillierte Aufschlüsselung der Arbeitszeiten pro Mitarbeiter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!teamStats || teamStats.employeeStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Zeiteinträge im ausgewählten Zeitraum
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Gesamtzeit</TableHead>
                  <TableHead>Einträge</TableHead>
                  <TableHead>Ø pro Eintrag</TableHead>
                  <TableHead>Projekte</TableHead>
                  <TableHead className="text-right">Auslastung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStats.employeeStats
                  .sort((a, b) => b.totalMinutes - a.totalMinutes)
                  .map((stat) => {
                    const avgPerEntry = stat.entryCount > 0
                      ? Math.floor(stat.totalMinutes / stat.entryCount)
                      : 0;
                    const utilizationPercent = teamStats.totalMinutes > 0
                      ? Math.round((stat.totalMinutes / teamStats.totalMinutes) * 100)
                      : 0;

                    return (
                      <TableRow key={stat.employeeId}>
                        <TableCell className="font-medium">
                          {stat.employeeName}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDuration(stat.totalMinutes)}
                        </TableCell>
                        <TableCell>{stat.entryCount}</TableCell>
                        <TableCell>{formatDuration(avgPerEntry)}</TableCell>
                        <TableCell>{stat.projectCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${utilizationPercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {utilizationPercent}%
                            </span>
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

      {/* Project Distribution */}
      {selectedProject === "all" && teamStats && teamStats.projectStats && (
        <Card>
          <CardHeader>
            <CardTitle>Projekt-Verteilung</CardTitle>
            <CardDescription>
              Zeitaufwand pro Projekt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Gesamtzeit</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead className="text-right">Anteil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStats.projectStats
                  .sort((a, b) => b.totalMinutes - a.totalMinutes)
                  .map((stat) => {
                    const project = projects?.find((p) => p.id === stat.projectId);
                    const sharePercent = teamStats.totalMinutes > 0
                      ? Math.round((stat.totalMinutes / teamStats.totalMinutes) * 100)
                      : 0;

                    return (
                      <TableRow key={stat.projectId}>
                        <TableCell className="font-medium">
                          {project?.name || "Unbekannt"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDuration(stat.totalMinutes)}
                        </TableCell>
                        <TableCell>{stat.employeeCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${sharePercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {sharePercent}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

