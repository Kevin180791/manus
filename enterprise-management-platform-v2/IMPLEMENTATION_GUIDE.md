# Implementierungsanleitung für verbleibende Features

## ✅ Bereits implementiert

1. **Bautagebuch (DailyReports)**
   - ✅ Edit/Delete Buttons
   - ✅ Foto-Upload (bis zu 20 Bilder)
   - ✅ Liste zeigt alle Einträge
   
2. **Zuordnungen (InventoryAssignments)**
   - ✅ Korrekte Anzeige mit firstName/lastName
   - ✅ Status-Ableitung aus returnedDate
   - ✅ Filterung funktioniert

3. **Mängel (DefectProtocols)**
   - ✅ Liste zeigt alle Einträge

## 🔄 Noch zu implementieren

### 1. InspectionProtocols - Edit/Delete + Foto-Upload

**Datei:** `client/src/pages/InspectionProtocols.tsx`

**Schritt 1: Imports erweitern**
```typescript
import { Pencil, Trash2 } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
```

**Schritt 2: States hinzufügen** (nach bestehenden useState)
```typescript
const [editingProtocol, setEditingProtocol] = useState<any>(null);
const [photos, setPhotos] = useState<string[]>([]);
```

**Schritt 3: Mutations hinzufügen** (nach createMutation)
```typescript
const updateMutation = trpc.inspectionProtocols.update.useMutation({
  onSuccess: () => {
    toast.success("Begehungsprotokoll aktualisiert");
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingProtocol(null);
    setPhotos([]);
    utils.inspectionProtocols.list.invalidate();
  },
  onError: (error) => {
    toast.error(`Fehler: ${error.message}`);
  },
});

const deleteMutation = trpc.inspectionProtocols.delete.useMutation({
  onSuccess: () => {
    toast.success("Begehungsprotokoll gelöscht");
    utils.inspectionProtocols.list.invalidate();
  },
  onError: (error) => {
    toast.error(`Fehler: ${error.message}`);
  },
});
```

**Schritt 4: Handler-Funktionen** (nach handleSubmit)
```typescript
const handleEdit = (protocol: any, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setEditingProtocol(protocol);
  setFormData({
    inspectionDate: protocol.inspectionDate ? new Date(protocol.inspectionDate).toISOString().split('T')[0] : '',
    location: protocol.location || '',
    participants: protocol.participants || '',
    findings: protocol.findings || '',
    recommendations: protocol.recommendations || '',
    nextSteps: protocol.nextSteps || '',
  });
  try {
    setPhotos(protocol.photos ? JSON.parse(protocol.photos) : []);
  } catch {
    setPhotos([]);
  }
  setIsDialogOpen(true);
};

const handleDelete = (id: string, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (confirm("Begehungsprotokoll wirklich löschen?")) {
    deleteMutation.mutate({ id });
  }
};
```

**Schritt 5: handleSubmit anpassen**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const data = {
    projectId: projectId || selectedProjectId,
    ...formData,
    photos: JSON.stringify(photos),
  };
  
  if (editingProtocol) {
    updateMutation.mutate({ id: editingProtocol.id, ...data });
  } else {
    createMutation.mutate(data);
  }
};
```

**Schritt 6: Buttons in Card Header** (in der map-Funktion)
```typescript
<CardHeader>
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <CardTitle>...</CardTitle>
    </div>
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleEdit(protocol, e)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleDelete(protocol.id, e)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
</CardHeader>
```

**Schritt 7: PhotoUpload in Dialog** (vor DialogFooter)
```typescript
<PhotoUpload
  photos={photos}
  onPhotosChange={setPhotos}
  maxPhotos={20}
/>
```

### 2. DefectProtocols - Edit/Delete + Foto-Upload

**Gleiche Implementierung wie InspectionProtocols**, nur Variablennamen anpassen:
- `editingProtocol` → `editingDefect`
- `protocol` → `defect`
- `inspectionProtocols` → `defectProtocols`

### 3. Employees - Edit/Delete

**Datei:** `client/src/pages/Employees.tsx`

**Besonderheit:** Employees hat firstName/lastName statt einzelne Felder

```typescript
const handleEdit = (employee: any, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setEditingEmployee(employee);
  setFormData({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    position: employee.position || '',
    department: employee.department || '',
    employeeNumber: employee.employeeNumber || '',
    status: employee.status || 'active',
    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
  });
  setIsDialogOpen(true);
};
```

### 4. Inventory - Edit/Delete

**Datei:** `client/src/pages/Inventory.tsx`

**Standard-Implementierung** wie bei DailyReports

### 5. Projects - Edit/Delete

**Datei:** `client/src/pages/Projects.tsx`

**Standard-Implementierung** wie bei DailyReports

### 6. Aufmaß - Mehrere Positionen

**Aktuell:** Ein Aufmaß = Eine Position  
**Ziel:** Ein Aufmaß = Mehrere Positionen

**Neue Tabelle erstellen:**
```typescript
// In drizzle/schema.ts
export const measurementItems = mysqlTable("measurementItems", {
  id: varchar("id", { length: 64 }).primaryKey(),
  measurementId: varchar("measurementId", { length: 64 }).notNull(),
  position: int("position").notNull(), // Positionsnummer
  description: text("description"),
  quantity: varchar("quantity", { length: 50 }),
  unit: varchar("unit", { length: 50 }),
  length: varchar("length", { length: 50 }),
  width: varchar("width", { length: 50 }),
  height: varchar("height", { length: 50 }),
  unitPrice: varchar("unitPrice", { length: 50 }),
  totalPrice: varchar("totalPrice", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow(),
});
```

**DB-Funktionen:**
```typescript
// In server/db.ts
export async function getMeasurementItems(measurementId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(measurementItems)
    .where(eq(measurementItems.measurementId, measurementId))
    .orderBy(measurementItems.position);
}

export async function createMeasurementItem(item: InsertMeasurementItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(measurementItems).values(item);
}
```

**Router erweitern:**
```typescript
// In server/routers.ts - measurements Router
getItems: protectedProcedure
  .input(z.object({ measurementId: z.string() }))
  .query(async ({ input }) => {
    return await db.getMeasurementItems(input.measurementId);
  }),

createItem: protectedProcedure
  .input(z.object({
    measurementId: z.string(),
    position: z.number(),
    description: z.string().optional(),
    // ... weitere Felder
  }))
  .mutation(async ({ input }) => {
    await db.createMeasurementItem({ id: generateId(), ...input });
    return { success: true };
  }),
```

**UI anpassen:**
- Measurements-Seite: Zeige Aufmaß-Liste
- Measurement-Detail-Seite: Zeige Positionen-Tabelle mit Add/Edit/Delete
- Summenberechnung über alle Positionen

## Zeitschätzung

- InspectionProtocols Edit/Delete + Foto: ~30 Min
- DefectProtocols Edit/Delete + Foto: ~30 Min
- Employees Edit/Delete: ~20 Min
- Inventory Edit/Delete: ~20 Min
- Projects Edit/Delete: ~20 Min
- Aufmaß Positionen: ~60 Min

**Gesamt: ~3 Stunden**

## Tipps

1. **Immer das DailyReports.tsx als Referenz verwenden**
2. **Nach jeder Implementierung testen**
3. **Checkpoints nach jedem Feature speichern**
4. **TODO.md aktualisieren wenn Features fertig sind**

