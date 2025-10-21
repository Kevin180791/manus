import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Package, Search, User } from "lucide-react";
import { useState } from "react";

export default function InventoryAssignments() {
  const utils = trpc.useUtils();

  const { data: assignments, isLoading } = trpc.inventory.getAssignments.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const returnMutation = trpc.inventory.returnItem.useMutation({
    onSuccess: () => {
      utils.inventory.getAssignments.invalidate();
      utils.inventory.list.invalidate();
    },
  });

  const handleReturn = (assignmentId: string) => {
    if (confirm("Möchten Sie dieses Inventar wirklich zurückgeben?")) {
      returnMutation.mutate({ assignmentId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Zuordnungen...</p>
        </div>
      </div>
    );
  }

  // Enrich assignments with inventory and employee data
  const enrichedAssignments = assignments?.map((assignment: any) => {
    const item = inventory?.find((i: any) => i.id === assignment.inventoryItemId);
    const employee = employees?.find((e: any) => e.id === assignment.employeeId);
    return {
      ...assignment,
      item,
      employee,
    };
  }) || [];

  // Filter assignments
  const filteredAssignments = enrichedAssignments.filter((assignment: any) => {
    const matchesSearch =
      assignment.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.item?.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || assignment.item?.type === filterType;
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(inventory?.map((i: any) => i.type) || []));

  // Statistics
  const stats = {
    total: assignments?.length || 0,
    active: assignments?.filter((a: any) => a.status === "active").length || 0,
    returned: assignments?.filter((a: any) => a.status === "returned").length || 0,
  };

  const getStatusBadgeClass = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      tool: "bg-blue-100 text-blue-800",
      laptop: "bg-purple-100 text-purple-800",
      phone: "bg-pink-100 text-pink-800",
      vehicle: "bg-orange-100 text-orange-800",
      equipment: "bg-teal-100 text-teal-800",
    };
    return classes[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inventarzuordnungen</h1>
          <p className="text-muted-foreground">
            Übersicht aller Inventarzuordnungen an Mitarbeiter
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Alle Zuordnungen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Derzeit zugeordnet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zurückgegeben</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.returned}</div>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>Zuordnungen filtern und durchsuchen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Name, Mitarbeiter, Seriennummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="returned">Zurückgegeben</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment: any) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeClass(assignment.item?.type || "")}`}>
                        {assignment.item?.type || "Unbekannt"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(assignment.status)}`}>
                        {assignment.status === "active" ? "Aktiv" : "Zurückgegeben"}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{assignment.item?.name || "Unbekanntes Inventar"}</CardTitle>
                    {assignment.item?.serialNumber && (
                      <CardDescription>SN: {assignment.item.serialNumber}</CardDescription>
                    )}
                  </div>

                  {assignment.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(assignment.id)}
                    >
                      Zurückgeben
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{assignment.employee?.name || "Unbekannt"}</p>
                      <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(assignment.assignedDate).toLocaleDateString("de-DE")}
                      </p>
                      <p className="text-xs text-muted-foreground">Zugewiesen am</p>
                    </div>
                  </div>

                  {assignment.returnedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(assignment.returnedDate).toLocaleDateString("de-DE")}
                        </p>
                        <p className="text-xs text-muted-foreground">Zurückgegeben am</p>
                      </div>
                    </div>
                  )}

                  {assignment.projectId && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{assignment.projectId}</p>
                        <p className="text-xs text-muted-foreground">Projekt</p>
                      </div>
                    </div>
                  )}
                </div>

                {assignment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredAssignments.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Zuordnungen gefunden</p>
                  {searchTerm || filterType !== "all" || filterStatus !== "all" ? (
                    <p className="text-sm mt-2">Versuchen Sie, die Filter anzupassen</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
