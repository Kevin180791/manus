// Kostengruppen (KG) 410-490 für TGA
export const KG_CATEGORIES = [
  { value: "kg400", label: "KG 400 - TGA Allgemein" },
  { value: "kg410", label: "KG 410 - Abwasser-, Wasser- und Gasanlagen" },
  { value: "kg420", label: "KG 420 - Wärmeversorgungsanlagen" },
  { value: "kg430", label: "KG 430 - Lufttechnische Anlagen" },
  { value: "kg440", label: "KG 440 - Starkstromanlagen" },
  { value: "kg450", label: "KG 450 - Fernmelde- und informationstechnische Anlagen" },
  { value: "kg460", label: "KG 460 - Förderanlagen" },
  { value: "kg470", label: "KG 470 - Nutzungsspezifische Anlagen" },
  { value: "kg474", label: "KG 474 - Feuerlöschanlagen" },
  { value: "kg480", label: "KG 480 - Gebäudeautomation" },
  { value: "kg490", label: "KG 490 - Sonstige Maßnahmen für TGA" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Niedrig", color: "text-blue-600" },
  { value: "medium", label: "Mittel", color: "text-yellow-600" },
  { value: "high", label: "Hoch", color: "text-orange-600" },
  { value: "critical", label: "Kritisch", color: "text-red-600" },
] as const;

export const STATUS_OPTIONS = [
  { value: "open", label: "Offen", color: "text-slate-600" },
  { value: "in_progress", label: "In Bearbeitung", color: "text-blue-600" },
  { value: "resolved", label: "Gelöst", color: "text-green-600" },
  { value: "closed", label: "Geschlossen", color: "text-slate-400" },
] as const;

