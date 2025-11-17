import { useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours, differenceInMinutes } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const locales = {
  de: de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function TimeCalendar() {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: timeEntries, refetch } = trpc.timeTracking.getMyTimeEntries.useQuery({});
  const { data: projects } = trpc.projects.list.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.timeTracking.updateTimeEntry.useMutation({
    onSuccess: () => {
      toast.success("Zeiteintrag aktualisiert");
      refetch();
      utils.timeTracking.getMyTimeEntries.invalidate();
      setShowEditDialog(false);
    },
    onError: (error) => toast.error(error.message),
  });

  // Transform time entries to calendar events
  const events = useMemo(() => {
    if (!timeEntries) return [];
    
    return timeEntries.map((entry) => {
      const project = projects?.find((p) => p.id === entry.projectId);
      return {
        id: entry.id,
        title: project?.name || "Projekt",
        start: new Date(entry.startTime),
        end: new Date(entry.endTime),
        resource: entry,
      };
    });
  }, [timeEntries, projects]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource);
    setShowEditDialog(true);
  }, []);

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      const timeDiff = differenceInMinutes(start, event.start);
      const newStart = new Date(event.resource.startTime);
      const newEnd = new Date(event.resource.endTime);
      
      newStart.setMinutes(newStart.getMinutes() + timeDiff);
      newEnd.setMinutes(newEnd.getMinutes() + timeDiff);

      updateMutation.mutate({
        id: event.resource.id,
        startTime: newStart,
        endTime: newEnd,
        description: event.resource.description,
        pauseDuration: event.resource.pauseDuration,
      });
    },
    [updateMutation]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    ({ event, start, end }: any) => {
      updateMutation.mutate({
        id: event.resource.id,
        startTime: start,
        endTime: end,
        description: event.resource.description,
        pauseDuration: event.resource.pauseDuration,
      });
    },
    [updateMutation]
  );

  const handleSaveEdit = () => {
    if (!selectedEvent) return;

    updateMutation.mutate({
      id: selectedEvent.id,
      description: selectedEvent.description,
      startTime: new Date(selectedEvent.startTime),
      endTime: new Date(selectedEvent.endTime),
      pauseDuration: parseInt(selectedEvent.pauseDuration) || 0,
    });
  };

  // Custom event style getter
  const eventStyleGetter = useCallback((event: any) => {
    const project = projects?.find((p) => p.id === event.resource.projectId);
    const colors = [
      { bg: "#3b82f6", border: "#2563eb" },
      { bg: "#10b981", border: "#059669" },
      { bg: "#f59e0b", border: "#d97706" },
      { bg: "#ef4444", border: "#dc2626" },
      { bg: "#8b5cf6", border: "#7c3aed" },
    ];
    
    const colorIndex = project ? project.name.charCodeAt(0) % colors.length : 0;
    const color = colors[colorIndex];

    return {
      style: {
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        fontSize: "0.875rem",
        padding: "2px 5px",
      },
    };
  }, [projects]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Zeiterfassungs-Kalender
          </h1>
          <p className="text-muted-foreground">
            Drag & Drop zum Verschieben von Einträgen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === Views.DAY ? "default" : "outline"}
            onClick={() => setView(Views.DAY)}
          >
            Tag
          </Button>
          <Button
            variant={view === Views.WEEK ? "default" : "outline"}
            onClick={() => setView(Views.WEEK)}
          >
            Woche
          </Button>
          <Button
            variant={view === Views.MONTH ? "default" : "outline"}
            onClick={() => setView(Views.MONTH)}
          >
            Monat
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div style={{ height: "700px" }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              eventPropGetter={eventStyleGetter}
              draggableAccessor={() => true}
              resizable
              selectable
              culture="de"
              messages={{
                next: "Weiter",
                previous: "Zurück",
                today: "Heute",
                month: "Monat",
                week: "Woche",
                day: "Tag",
                agenda: "Agenda",
                date: "Datum",
                time: "Zeit",
                event: "Ereignis",
                noEventsInRange: "Keine Einträge in diesem Zeitraum",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedEvent.startTime), "dd.MM.yyyy HH:mm")} -{" "}
                    {format(new Date(selectedEvent.endTime), "HH:mm")}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startzeit</Label>
                  <Input
                    type="datetime-local"
                    value={format(new Date(selectedEvent.startTime), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setSelectedEvent({
                        ...selectedEvent,
                        startTime: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Endzeit</Label>
                  <Input
                    type="datetime-local"
                    value={format(new Date(selectedEvent.endTime), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setSelectedEvent({
                        ...selectedEvent,
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
                  value={selectedEvent.pauseDuration}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      pauseDuration: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={selectedEvent.description || ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Dauer:</strong> {formatDuration(selectedEvent.totalDuration)}
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

