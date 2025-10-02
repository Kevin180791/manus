"""Regelwerk für KG480 Gebäudeautomation (BACS)."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional

from .common import Finding, guard
from .params import PARAMS

GEWERK = "kg480_automation"


BACS_CLASS_ORDER = ["D", "C", "B", "A"]  # D niedrig, A hoch


def _class_rank(bacs_class: str) -> int:
    try:
        return BACS_CLASS_ORDER.index(bacs_class.upper())
    except ValueError:
        return -1


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    params = PARAMS["kg480"]

    systems: Iterable[Mapping[str, Any]] = context.get("systeme", [])  # type: ignore[assignment]
    points: Iterable[Mapping[str, Any]] = context.get("messstellen", [])  # type: ignore[assignment]
    trend_storage = _to_float(context.get("trendaufzeichnung_tage"))
    alarm_response = _to_float(context.get("alarmreaktionszeit"))

    findings: List[Finding] = []

    required_classes = params["bacs_classes"]

    for system in systems:
        gewerk_ref = str(system.get("gewerk") or "").lower()
        bacs_class = str(system.get("klasse") or "D")
        requirement = required_classes.get(gewerk_ref)
        if requirement and _class_rank(bacs_class) > _class_rank(requirement):
            findings.append(
                Finding(
                    id=f"kg480_{gewerk_ref}_klasse",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Gebäudeautomationsklasse unterschreitet Vorgabe",
                    beschreibung=(
                        f"Für das Gewerk {gewerk_ref} ist Klasse {bacs_class} geplant."
                        f" Vorgabe gemäß DIN EN ISO 52120-1: mindestens Klasse {requirement}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN ISO 52120-1",
                    empfehlung="Funktionsumfang (z.B. Einzelraumregelung, Energiemonitoring) erweitern.",
                    konfidenz_score=0.78,
                )
            )

    point_thresholds = params["point_density_min"]
    for entry in points:
        area = _to_float(entry.get("flaeche"))
        count = _to_float(entry.get("anzahl"))
        category = str(entry.get("kategorie") or "hvac").lower()
        requirement = point_thresholds.get(category)
        if area and count is not None and requirement:
            density = (count / area) * 100  # pro 100 m²
            if density < float(requirement):
                findings.append(
                    Finding(
                        id=f"kg480_{category}_punkte",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Mess- und Stellpunktdichte zu gering",
                        beschreibung=(
                            f"Für Kategorie {category} sind nur {density:.2f} Punkte pro 100 m² vorgesehen."
                            f" Vorgabe: mindestens {requirement} Punkte/100 m²."
                        ),
                        gewerk=GEWERK,
                        empfehlung="Sensorik/Actuatorik ergänzen und GA-Funktionsliste überarbeiten.",
                        konfidenz_score=0.72,
                    )
                )

    findings.extend(
        guard(
            trend_storage is None or trend_storage >= float(params["trend_storage_days_min"]),
            lambda: Finding(
                id="kg480_trendaufzeichnung",
                kategorie="technisch",
                prioritaet="mittel",
                titel="Trenddatenspeicherung zu kurz",
                beschreibung=(
                    f"Trenddaten werden nur {trend_storage:.0f} Tage gespeichert."
                    f" Vorgabe: mindestens {params['trend_storage_days_min']} Tage für Energieauswertung."
                ),
                gewerk=GEWERK,
                empfehlung="Speicherkapazität erweitern oder Export-Schnittstelle vorsehen.",
                konfidenz_score=0.7,
            ),
        )
    )

    findings.extend(
        guard(
            alarm_response is None or alarm_response <= float(params["alarm_response_time_max"]),
            lambda: Finding(
                id="kg480_alarmzeit",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Alarmweiterleitung zu träge",
                beschreibung=(
                    f"Die geplante Alarmreaktionszeit beträgt {alarm_response:.0f} Sekunden"
                    f" und überschreitet den Richtwert von {params['alarm_response_time_max']} Sekunden."
                ),
                gewerk=GEWERK,
                empfehlung="Alarmmanagement (z.B. Push/SMS) beschleunigen und Eskalation definieren.",
                konfidenz_score=0.82,
            ),
        )
    )

    return findings


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        if isinstance(value, str):
            normalized = value.replace(",", ".")
            try:
                return float(normalized)
            except ValueError:
                return None
        return None


__all__ = ["evaluate", "GEWERK"]
