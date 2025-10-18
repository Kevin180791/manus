import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { LayoutDashboard } from "lucide-react";

interface Finding {
  id: string;
  title: string;
  description: string;
  measure: string;
  responsible: string;
  deadline: string;
  photos: { src: string; caption: string }[];
}

const findings: Finding[] = [
  {
    id: "1.1",
    title: "Leitungsverläufe unklar / Lüftungsanschluss an Bestand",
    description: "Der Verlauf der WF-Rohre ist nicht eindeutig. Die massive Schachtwand muss geöffnet werden, um den Anschluss an die Bestandslüftung zu ermöglichen.",
    measure: "Klärung durch Planungsbüro, ggf. Anpassung der Ausführungsplanung. Freigabe und statische Bewertung durch Planung erforderlich.",
    responsible: "Planungsbüro",
    deadline: "KW 43",
    photos: [
      { src: "/images/image1.jpg", caption: "Foto 1: Lüftungsschacht mit WF-Rohr – Verlauf muss geklärt werden, massive Schachtwand für Anschluss Lüftung an Bestand muss geöffnet werden" },
      { src: "/images/image2.jpg", caption: "Foto 2: Übersicht Raum mit Lüftungsleitungen und BSKs" }
    ]
  },
  {
    id: "1.2",
    title: "Brandschutzklappen (BSK) zu Nebenmietern",
    description: "Rückbau und Verschluss der Wände notwendig, da diverse BSKs in angrenzende Mietbereiche führen.",
    measure: "Abstimmung mit Eigentümer und Planung zur Ausführung und Dokumentation.",
    responsible: "Eigentümer / Planung",
    deadline: "KW 44",
    photos: [
      { src: "/images/image2.jpg", caption: "Foto 3: Diverse BSKs zu Nebenmieter, Rückbau sowie Verschluss der Wände notwendig" },
      { src: "/images/image3.jpg", caption: "Foto 4: BSK-Anschluss und Leitungsverlauf muss geklärt werden" }
    ]
  },
  {
    id: "1.3",
    title: "Demontage Lüftung",
    description: "Mehrere Lüftungsleitungen sind rückzubauen.",
    measure: "Koordination mit Rückbaugewerken und Aktualisierung der Bestandsunterlagen.",
    responsible: "Ausführung",
    deadline: "KW 43",
    photos: [
      { src: "/images/image4.jpg", caption: "Foto 5: Demontage Lüftung – Ansicht 1" },
      { src: "/images/image5.jpg", caption: "Foto 6: Demontage Lüftung – Ansicht 2 mit Luftauslass" },
      { src: "/images/image8.jpg", caption: "Foto 7: Demontage Lüftung – Ansicht 3" }
    ]
  },
  {
    id: "1.4",
    title: "SML-Leitungen (Regen- und Schmutzwasser)",
    description: "Leitungen verlaufen teils mittig im Raum oder auf der Treppenhauswand.",
    measure: "Prüfung auf Kollisionsfreiheit und Anpassung der Trassenführung.",
    responsible: "Planung / Ausführung",
    deadline: "KW 45",
    photos: [
      { src: "/images/image6.jpg", caption: "Foto 8: SML Regenwasserleitung und SML Leitungen sowie Bodeneinläufe" },
      { src: "/images/image9.jpg", caption: "Foto 9: SML Leitungen auf der Treppenhauswand" },
      { src: "/images/image10.jpg", caption: "Foto 10: Regenwasser mittig im Raum" },
      { src: "/images/image11.jpg", caption: "Foto 11: Regenwasser mittig im Raum sowie SML Schmutzwasser auf der Treppenhauswand" }
    ]
  },
  {
    id: "1.5",
    title: "Aufputzverlegung",
    description: "Diverse Leitungen wurden aufputz auf Wand verlegt.",
    measure: "Bewertung hinsichtlich Brandschutz und Ästhetik durch Planung.",
    responsible: "Planungsbüro",
    deadline: "KW 44",
    photos: [
      { src: "/images/image7.jpg", caption: "Foto 12: Aufputz auf Wand verlegt" },
      { src: "/images/image12.jpg", caption: "Foto 13: Lüftungsleitungen aufputz verlegt" }
    ]
  }
];

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-slate-900">
              Begehungs- und Übergabedokumentation
            </h1>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Zur App
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Projekt:</span>
              <p className="text-slate-600">PCT 3.OG Sozialtrakt Edeka</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Datum der Begehung:</span>
              <p className="text-slate-600">17.10.2025</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Zeitraum der Ausführung:</span>
              <p className="text-slate-600">17.10.2025 – 12.12.2025</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Ersteller:</span>
              <p className="text-slate-600">TGA-Projektleitung, ausführende Firma</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Floor Plan Section */}
        <section className="mb-16">
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-2xl">Grundriss-Skizze mit Fotopositionen</CardTitle>
              <CardDescription>
                Die nachfolgende handskizzierte Grundriss-Darstellung zeigt die ungefähren Positionen
                der Fotodokumentation im 3.OG Sozialtrakt. Die Nummerierung entspricht den Foto-Nummern
                in den jeweiligen Feststellungen.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <div className="flex justify-center">
                <img
                  src="/images/grundriss.png"
                  alt="Handskizzierter Grundriss 3.OG mit Kennzeichnung der Fotopositionen"
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-4 italic">
                Abbildung: Handskizzierter Grundriss 3.OG mit Kennzeichnung der Fotopositionen
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Findings Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">1. Allgemeine Feststellungen</h2>
          <p className="text-slate-700 mb-8">
            Im Rahmen der Baustellenbegehung wurden folgende Punkte dokumentiert und zur weiteren
            Bearbeitung an das Planungsbüro übergeben:
          </p>

          <div className="space-y-12">
            {findings.map((finding) => (
              <Card key={finding.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {finding.id} {finding.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        <span className="font-semibold text-slate-700">Feststellung:</span>{" "}
                        {finding.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {finding.deadline}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <p className="text-slate-700">
                      <span className="font-semibold">Maßnahme:</span> {finding.measure}
                    </p>
                    <p className="text-slate-700 mt-2">
                      <span className="font-semibold">Verantwortlich:</span> {finding.responsible}
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Fotodokumentation:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {finding.photos.map((photo, idx) => (
                        <div key={idx} className="space-y-2">
                          <img
                            src={photo.src}
                            alt={photo.caption}
                            className="w-full h-auto rounded-lg shadow-md hover:shadow-xl transition-shadow"
                          />
                          <p className="text-sm text-slate-600 italic text-center">{photo.caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Summary Table */}
        <section className="mb-16">
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-2xl">2. Zusammenfassung und Maßnahmenübersicht</CardTitle>
              <CardDescription>
                Die nachfolgende Tabelle enthält die wichtigsten Feststellungen aus der
                Begehungsdokumentation mit zugehörigen Maßnahmen und Verantwortlichkeiten:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900">
                        Nr.
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900">
                        Feststellung
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900">
                        Empfohlene Maßnahme
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900">
                        Verantwortlich
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900">
                        Frist
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((finding) => (
                      <tr key={finding.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-4 py-3 font-medium">{finding.id}</td>
                        <td className="border border-slate-300 px-4 py-3">{finding.title}</td>
                        <td className="border border-slate-300 px-4 py-3">{finding.measure}</td>
                        <td className="border border-slate-300 px-4 py-3">{finding.responsible}</td>
                        <td className="border border-slate-300 px-4 py-3">
                          <Badge variant="secondary">{finding.deadline}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section>
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-2xl">3. Weiteres Vorgehen</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Abstimmungstermin mit Planung:</h4>
                <p className="text-slate-700">Vorschlag KW 43 zur Klärung offener Punkte.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Dokumentationsergänzung:</h4>
                <p className="text-slate-700">
                  Nach Rückmeldung durch Planung erfolgt Aktualisierung der Ausführungsunterlagen.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Freigabe durch Eigentümer:</h4>
                <p className="text-slate-700">
                  Für Rückbauarbeiten in Nebenmieterbereichen erforderlich.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="container py-6 text-center text-sm text-slate-600">
          <p>© 2025 TGA-Projektleitung | Begehungsdokumentation PCT 3.OG Sozialtrakt Edeka</p>
        </div>
      </footer>
    </div>
  );
}

