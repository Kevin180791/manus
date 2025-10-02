"""Regelwerk für KG440 Elektrische Anlagen."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional

from .common import Finding, guard
from .params import PARAMS

GEWERK = "kg440_elektro"


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    params = PARAMS["kg440"]
    projekt_typ = context.get("projekt_typ") or "buerogebaeude"

    circuits: Iterable[Mapping[str, Any]] = context.get("stromkreise", [])  # type: ignore[assignment]
    lighting: Iterable[Mapping[str, Any]] = context.get("beleuchtung", [])  # type: ignore[assignment]
    consumers: Iterable[Mapping[str, Any]] = context.get("verbraucher", [])  # type: ignore[assignment]

    findings: List[Finding] = []

    findings.extend(
        guard(
            bool(list(circuits)),
            lambda: Finding(
                id="kg440_0001",
                kategorie="technisch",
                prioritaet="mittel",
                titel="Keine Stromkreise dokumentiert",
                beschreibung="Es liegen keine auswertbaren Daten zu Stromkreisen oder Lastbereichen vor.",
                gewerk=GEWERK,
                empfehlung="Lastberechnung und Stromkreislisten ergänzen.",
                konfidenz_score=0.5,
            ),
        )
    )

    voltage_drop_limit = float(params["voltage_drop_max_percent"])
    diversity_min, diversity_max = params["diversity_factor_range"]

    for circuit in circuits:
        name = circuit.get("name") or circuit.get("id") or "Stromkreis"
        drop = _to_float(circuit.get("voltage_drop_percent"))
        diversity = _to_float(circuit.get("diversity_factor"))
        reserve = _to_float(circuit.get("reserve_percent"))

        if drop is not None and drop > voltage_drop_limit:
            findings.append(
                Finding(
                    id=f"kg440_{name}_spannung",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Spannungsfall überschreitet Grenzwert",
                    beschreibung=(
                        f"Der berechnete Spannungsfall von {drop:.1f}% im Stromkreis {name} überschreitet den Grenzwert"
                        f" von {voltage_drop_limit}% gemäß DIN VDE 0100-520."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN VDE 0100-520",
                    empfehlung="Leiterquerschnitt erhöhen oder Leitungslänge reduzieren.",
                    konfidenz_score=0.82,
                )
            )

        if diversity is not None and not (float(diversity_min) <= diversity <= float(diversity_max)):
            findings.append(
                Finding(
                    id=f"kg440_{name}_diversity",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Gleichzeitigkeitsfaktor außerhalb Erfahrungswert",
                    beschreibung=(
                        f"Für {name} ist ein Gleichzeitigkeitsfaktor von {diversity:.2f} angesetzt."
                        f" Erwarteter Bereich: {diversity_min:.2f}–{diversity_max:.2f}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN 18015",
                    empfehlung="Lastannahmen überprüfen und dokumentieren.",
                    konfidenz_score=0.7,
                )
            )

        if reserve is not None and reserve < 10:
            findings.append(
                Finding(
                    id=f"kg440_{name}_reserve",
                    kategorie="technisch",
                    prioritaet="niedrig",
                    titel="Geringe Leistungsreserve",
                    beschreibung=(
                        f"Im Stromkreis {name} verbleibt nur eine Reserve von {reserve:.1f}%."
                        " Empfehlung: mindestens 10% für Erweiterungen vorsehen."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Stromkreise bündeln oder Trafoleistung erhöhen.",
                    konfidenz_score=0.65,
                )
            )

    if lighting:
        for zone in lighting:
            area = _to_float(zone.get("flaeche"))
            power = _to_float(zone.get("leistung"))
            nutzung = zone.get("nutzung") or projekt_typ
            limit = params["lighting_power_density"].get(nutzung)
            if area and power and limit and area > 0:
                density = power / area
                if density > float(limit):
                    findings.append(
                        Finding(
                            id=f"kg440_beleuchtung_{zone.get('id', 'zone')}",
                            kategorie="technisch",
                            prioritaet="mittel",
                            titel="Lichtleistungsdichte über Richtwert",
                            beschreibung=(
                                f"Für Bereich {zone.get('name', 'unbekannt')} beträgt die Lichtleistungsdichte {density:.1f} W/m²"
                                f" und überschreitet den Richtwert {limit} W/m² gemäß DIN EN 12464-1."
                            ),
                            gewerk=GEWERK,
                            norm_referenz="DIN EN 12464-1",
                            empfehlung="Leuchtenauswahl optimieren oder Tageslichtnutzung berücksichtigen.",
                            konfidenz_score=0.73,
                        )
                    )

    emergency_required = projekt_typ in params["emergency_lighting_required"]
    emergency_available = context.get("notbeleuchtung")
    findings.extend(
        guard(
            not emergency_required or bool(emergency_available),
            lambda: Finding(
                id="kg440_notbeleuchtung",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Notbeleuchtung nicht nachgewiesen",
                beschreibung=(
                    "Für den Gebäudetyp ist eine Sicherheitsbeleuchtung nach DIN EN 1838 erforderlich,"
                    " sie wird jedoch nicht dokumentiert."
                ),
                gewerk=GEWERK,
                norm_referenz="DIN EN 1838",
                empfehlung="Notbeleuchtungsanlage planen und Fluchtwegkennzeichnung ergänzen.",
                konfidenz_score=0.84,
            ),
        )
    )

    ups_zonen = {str(item.get("bereich")) for item in consumers if item.get("usv_erforderlich")}
    for sensitive in params["ups_required_for"]:
        findings.extend(
            guard(
                sensitive in ups_zonen,
                lambda sensitive=sensitive: Finding(
                    id=f"kg440_usv_{sensitive}",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="USV-Versorgung fehlt",
                    beschreibung=(
                        f"Für den Bereich {sensitive} ist eine unterbrechungsfreie Stromversorgung erforderlich,"
                        " jedoch nicht nachgewiesen."
                    ),
                    gewerk=GEWERK,
                    empfehlung="USV-Anlage dimensionieren und Schaltplan ergänzen.",
                    konfidenz_score=0.8,
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
