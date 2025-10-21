import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Building2, ClipboardList, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: notifications } = trpc.notifications.unread.useQuery();

  const activeEmployees = employees?.filter(e => e.status === "active").length || 0;
  const availableInventory = inventory?.filter(i => i.status === "available").length || 0;
  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const unreadNotifications = notifications?.length || 0;

  const stats = [
    {
      title: "Aktive Mitarbeiter",
      value: activeEmployees,
      total: employees?.length || 0,
      icon: Users,
      href: "/employees",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Verfügbares Inventar",
      value: availableInventory,
      total: inventory?.length || 0,
      icon: Package,
      href: "/inventory",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Aktive Projekte",
      value: activeProjects,
      total: projects?.length || 0,
      icon: Building2,
      href: "/projects",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Benachrichtigungen",
      value: unreadNotifications,
      total: unreadNotifications,
      icon: AlertCircle,
      href: "/notifications",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Willkommen zur Enterprise Management Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  {stat.total !== stat.value && (
                    <p className="text-sm text-gray-500 mt-1">von {stat.total} gesamt</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aktuelle Projekte</CardTitle>
              <CardDescription>Übersicht der neuesten Projekte</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Alle anzeigen
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Noch keine Projekte vorhanden</p>
              <Link href="/projects">
                <Button className="mt-4" size="sm">
                  Erstes Projekt erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.client && `Kunde: ${project.client}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === "active"
                            ? "bg-green-100 text-green-800"
                            : project.status === "planning"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {project.status === "active"
                          ? "Aktiv"
                          : project.status === "planning"
                          ? "Planung"
                          : project.status === "completed"
                          ? "Abgeschlossen"
                          : project.status === "on_hold"
                          ? "Pausiert"
                          : "Abgebrochen"}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.priority === "critical"
                            ? "bg-red-100 text-red-800"
                            : project.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : project.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.priority === "critical"
                          ? "Kritisch"
                          : project.priority === "high"
                          ? "Hoch"
                          : project.priority === "medium"
                          ? "Mittel"
                          : "Niedrig"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
          <CardDescription>Häufig verwendete Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/employees">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="h-5 w-5 mr-3" />
                Mitarbeiter hinzufügen
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Package className="h-5 w-5 mr-3" />
                Inventar erfassen
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Building2 className="h-5 w-5 mr-3" />
                Neues Projekt
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

