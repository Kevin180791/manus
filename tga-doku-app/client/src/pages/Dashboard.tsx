import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  Plus,
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.projects.getStats.useQuery();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
                TGA Dokumentations-App
              </h1>
              <p className="text-slate-600 mt-1">
                {isAuthenticated ? `Willkommen, ${user?.name || "Benutzer"}` : "Begehungsdokumentation und Projektmanagement"}
              </p>
            </div>
            <Link href="/projects/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Neues Projekt
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Übersicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statsLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Projekte gesamt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats?.totalProjects || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Aktive Projekte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stats?.activeProjects || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Begehungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats?.totalInspections || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Feststellungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats?.totalFindings || 0}</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      Kritisch
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats?.criticalFindings || 0}</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* Projects List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Projekte</h2>
            <Link href="/projects">
              <Button variant="outline">Alle anzeigen</Button>
            </Link>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                        <Badge className={getStatusColor(project.status)} variant="secondary">
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      {project.client && (
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Building2 className="w-4 h-4" />
                          {project.client}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {project.location}
                        </div>
                      )}
                      {project.startDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.startDate).toLocaleDateString("de-DE")}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-600 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <ClipboardList className="w-4 h-4" />
                          <span>{project.inspectionCount || 0} Begehungen</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{project.findingCount || 0} Feststellungen</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Projekte vorhanden</h3>
                <p className="text-slate-600 mb-4">Erstellen Sie Ihr erstes Projekt, um zu beginnen.</p>
                <Link href="/projects/new">
                  <Button className="gap-2">
                    <Plus className="w-5 h-5" />
                    Neues Projekt erstellen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

