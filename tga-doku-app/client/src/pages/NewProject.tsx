import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    client: "",
    startDate: "",
    endDate: "",
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projekt erfolgreich erstellt");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Projektname ist erforderlich");
      return;
    }
    createProject.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Neues Projekt erstellen</h1>
          <p className="text-slate-600 mt-1">
            Geben Sie die Projektinformationen ein, um zu beginnen
          </p>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Projektinformationen</CardTitle>
            <CardDescription>
              Füllen Sie die grundlegenden Informationen aus. Sie können diese später jederzeit ändern.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="required">
                  Projektname *
                </Label>
                <Input
                  id="name"
                  placeholder="z.B. PCT 3.OG Sozialtrakt Edeka"
                  value={formData.name}
                  onChange={handleChange("name")}
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Auftraggeber</Label>
                <Input
                  id="client"
                  placeholder="z.B. Edeka Südbayern"
                  value={formData.client}
                  onChange={handleChange("client")}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Standort</Label>
                <Input
                  id="location"
                  placeholder="z.B. München, Landsberger Straße 123"
                  value={formData.location}
                  onChange={handleChange("location")}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange("startDate")}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange("endDate")}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 gap-2"
                  disabled={createProject.isPending}
                >
                  <Save className="w-5 h-5" />
                  {createProject.isPending ? "Wird erstellt..." : "Projekt erstellen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setLocation("/dashboard")}
                  disabled={createProject.isPending}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Nächste Schritte</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Grundriss hochladen (optional)</li>
            <li>2. Fotos hinzufügen und Feststellungen dokumentieren</li>
            <li>3. Bericht oder Präsentation generieren</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

