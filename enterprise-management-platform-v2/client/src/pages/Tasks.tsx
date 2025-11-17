import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
        <p className="text-gray-600 mt-2">Übersicht aller Aufgaben</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Aufgaben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Aufgaben werden projektspezifisch in den Projektdetails angezeigt</p>
        </CardContent>
      </Card>
    </div>
  );
}
