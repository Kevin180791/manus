"""Regelwerk für KG474 Feuerlöschanlagen."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional

from .common import Finding, guard
from .params import PARAMS

GEWERK = "kg474_feuerloeschung"


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    params = PARAMS["kg474"]

    sprinkler: Iterable[Mapping[str, Any]] = context.get("sprinkler", [])  # type: ignore[assignment]
    hydrants: Iterable[Mapping[str, Any]] = context.get("hydranten", [])  # type: ignore[assignment]
    water_supply = context.get("wasserversorgung") or {}

    findings: List[Finding] = []

    if not sprinkler and not hydrants:
        findings.append(
            Finding(
                id="kg474_0001",
                kategorie="technisch",
                prioritaet="mittel",
                titel="Keine Feuerlöschanlagen dokumentiert",
                beschreibung="Es konnten keine Angaben zu Sprinkler- oder Hydrantenanlagen ausgewertet werden.",
                gewerk=GEWERK,
                empfehlung="Brandschutzkonzept prüfen und Löschanlagen dokumentieren.",
                konfidenz_score=0.5,
            )
        )
        return findings

    for zone in sprinkler:
        hazard = (zone.get("gefährdungsklasse") or "normal").lower()
        density_required = params["sprinkler_density"].get(hazard, params["sprinkler_density"]["normal"])
        density = _to_float(zone.get("berechnete_dichte"))
        duration = _to_float(zone.get("loescheinwirkzeit"))
        redundancy = zone.get("pumpenredundanz")
        zone_name = zone.get("name") or zone.get("bereich") or "Sprinklerzone"

        if density is not None and density < float(density_required):
            findings.append(
                Finding(
                    id=f"kg474_{zone_name}_dichte",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Sprinkler-Dichte unterschreitet VdS-Anforderung",
                    beschreibung=(
                        f"Für Zone {zone_name} sind {density:.1f} l/min·m² geplant."
                        f" Erforderlich für Klasse {hazard}: {density_required} l/min·m²."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="VdS CEA 4001",
                    empfehlung="Düsenzahl oder Pumpenleistung anpassen.",
                    konfidenz_score=0.83,
                )
            )

        if duration is not None and duration < float(params["water_supply_duration_min"]):
            findings.append(
                Finding(
                    id=f"kg474_{zone_name}_dauer",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Löschwasserbevorratung unzureichend",
                    beschreibung=(
                        f"Die vorgehaltene Löschwassermenge reicht nur für {duration:.0f} Minuten."
                        f" Vorgabe: mindestens {params['water_supply_duration_min']} Minuten."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Löschwasserbehälter oder Speisung dimensionieren.",
                    konfidenz_score=0.8,
                )
            )

        if hazard in params["pump_redundancy_required"]:
            findings.extend(
                guard(
                    bool(redundancy),
                    lambda: Finding(
                        id=f"kg474_{zone_name}_pumpe",
                        kategorie="technisch",
                        prioritaet="hoch",
                        titel="Sprinkleranlage ohne redundante Pumpe",
                        beschreibung=(
                            f"Für Zone {zone_name} ist keine redundante Sprinklerpumpe vorgesehen,"
                            " obwohl sie für die Gefährdungsklasse gefordert ist."
                        ),
                        gewerk=GEWERK,
                        empfehlung="Reservepumpe bzw. Diesel-/Elektro-Doppelpumpe vorsehen.",
                        konfidenz_score=0.82,
                    ),
                )
            )

    for hydrant in hydrants:
        flow = _to_float(hydrant.get("volumenstrom"))
        pressure = _to_float(hydrant.get("druck"))
        hydrant_name = hydrant.get("name") or hydrant.get("bereich") or "Hydrant"

        if flow is not None and flow < 200:
            findings.append(
                Finding(
                    id=f"kg474_{hydrant_name}_strom",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Hydrantenvolumenstrom zu gering",
                    beschreibung=(
                        f"Für {hydrant_name} sind nur {flow:.0f} l/min Volumenstrom vorgesehen."
                        " Richtwert für Wandhydranten Typ F: ≥200 l/min."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN 14462",
                    empfehlung="Rohrnetzdimensionierung prüfen und Hydrantenverstärker einplanen.",
                    konfidenz_score=0.75,
                )
            )

        if pressure is not None and pressure < 0.4:
            findings.append(
                Finding(
                    id=f"kg474_{hydrant_name}_druck",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Hydranten-Betriebsdruck zu gering",
                    beschreibung=(
                        f"Der Betriebsdruck beträgt {pressure:.2f} MPa und unterschreitet den geforderten Wert von 0.4 MPa."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN 14462",
                    empfehlung="Druckhaltung optimieren oder Pumpenleistung erhöhen.",
                    konfidenz_score=0.74,
                )
            )

    water_duration = _to_float(water_supply.get("dauer"))
    findings.extend(
        guard(
            water_duration is None or water_duration >= float(params["water_supply_duration_min"]),
            lambda: Finding(
                id="kg474_wasserspeicher",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Gesamte Löschwasserbevorratung unzureichend",
                beschreibung=(
                    f"Die zentrale Wasserversorgung reicht nur für {water_duration:.0f} Minuten"
                    f" und unterschreitet den Richtwert von {params['water_supply_duration_min']} Minuten."
                ),
                gewerk=GEWERK,
                empfehlung="Wasservorrat erhöhen oder externe Einspeisung sicherstellen.",
                konfidenz_score=0.81,
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
