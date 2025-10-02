"""Regelwerk für KG430 Raumlufttechnische Anlagen."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional

from .common import Finding, guard, pct
from .params import PARAMS

GEWERK = "kg430_lueftung"


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    """Bewertet Luftmengen und Anlagenkonfigurationen."""

    params = PARAMS["kg430"]
    projekt_typ = context.get("projekt_typ") or "buerogebaeude"
    rooms: Iterable[Mapping[str, Any]] = context.get("rooms", [])  # type: ignore[assignment]
    systems: Iterable[Mapping[str, Any]] = context.get("anlagen", [])  # type: ignore[assignment]

    findings: List[Finding] = []

    findings.extend(
        guard(
            bool(list(rooms)),
            lambda: Finding(
                id="kg430_0001",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Keine Luftmengenberechnung gefunden",
                beschreibung="Für die RLT-Bewertung konnten keine Raumdaten extrahiert werden.",
                gewerk=GEWERK,
                empfehlung="Luftmengenberechnung nach DIN EN 16798 bereitstellen.",
                konfidenz_score=0.55,
            ),
        )
    )

    air_change_range = params["air_change"].get(projekt_typ) or params["air_change"].get("buerogebaeude")
    outdoor_air = params["outdoor_air_per_person"].get(projekt_typ, 30.0)

    total_supply = 0.0
    total_exhaust = 0.0

    for room in rooms:
        zuluft = _to_float(room.get("zuluft"))
        abluft = _to_float(room.get("abluft"))
        persons = _to_float(room.get("persons")) or 0.0
        air_change = _to_float(room.get("air_change"))
        co2 = _to_float(room.get("co2"))
        name = room.get("name", "unbekannt")

        if zuluft:
            total_supply += zuluft
        if abluft:
            total_exhaust += abluft

        if persons > 0 and zuluft is not None and zuluft / persons < outdoor_air:
            findings.append(
                Finding(
                    id=f"kg430_{name}_luftmenge",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Außenluftvolumenstrom je Person zu gering",
                    beschreibung=(
                        f"Für {name} stehen nur {zuluft:.0f} m³/h Außenluft zur Verfügung."
                        f" Vorgabe für {projekt_typ}: {outdoor_air:.0f} m³/h pro Person (aktuell {persons:.0f} Personen)."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="ASR A3.6 / DIN EN 16798",
                    empfehlung="Volumenströme anpassen oder Personenbelegung reduzieren.",
                    konfidenz_score=0.83,
                )
            )

        if air_change_range and air_change is not None:
            if air_change < float(air_change_range["min"]):
                findings.append(
                    Finding(
                        id=f"kg430_{name}_wechsel_min",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Luftwechselrate zu gering",
                        beschreibung=(
                            f"Der Luftwechsel in {name} beträgt {air_change:.1f} 1/h und liegt unter dem Mindestwert"
                            f" von {air_change_range['min']} 1/h."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="DIN EN 16798-1",
                        empfehlung="Luftmengenberechnung aktualisieren und Geräteauswahl prüfen.",
                        konfidenz_score=0.79,
                    )
                )
            elif air_change > float(air_change_range["max"]):
                findings.append(
                    Finding(
                        id=f"kg430_{name}_wechsel_max",
                        kategorie="technisch",
                        prioritaet="niedrig",
                        titel="Luftwechselrate auffällig hoch",
                        beschreibung=(
                            f"Der Luftwechsel in {name} beträgt {air_change:.1f} 1/h und überschreitet den Richtwert"
                            f" von {air_change_range['max']} 1/h."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="DIN EN 16798-1",
                        empfehlung="Plausibilität der Lastannahmen prüfen.",
                        konfidenz_score=0.68,
                    )
                )

        if co2 is not None and co2 > float(params["co2_limit"]):
            findings.append(
                Finding(
                    id=f"kg430_{name}_co2",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="CO₂-Konzentration über Grenzwert",
                    beschreibung=(
                        f"Für {name} werden {co2:.0f} ppm CO₂ ausgewiesen. Grenzwert nach DIN EN 16798:"
                        f" {params['co2_limit']} ppm."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 16798-1",
                    empfehlung="Außenluftanteil erhöhen oder CO₂-Regelung vorsehen.",
                    konfidenz_score=0.8,
                )
            )

    if total_supply and total_exhaust:
        balance_ratio = abs(total_supply - total_exhaust) / max(total_supply, total_exhaust)
        if balance_ratio > float(params["balance_tolerance"]):
            findings.append(
                Finding(
                    id="kg430_balance_001",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Zu- und Abluft nicht im Gleichgewicht",
                    beschreibung=(
                        f"Die Volumenströme differieren um {pct(balance_ratio)}. Zulässig sind maximal"
                        f" {pct(params['balance_tolerance'])}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="VDI 6022",
                    empfehlung="Volumenstromabgleich in der Inbetriebnahmeplanung ergänzen.",
                    konfidenz_score=0.75,
                )
            )

    for system in systems:
        vol = _to_float(system.get("volumenstrom"))
        wrg = system.get("waermerueckgewinnung")
        eta = _to_float(system.get("wrg_wirkungsgrad"))
        system_id = system.get("id") or system.get("nummer") or "anlage"

        if params["wrg_required"] and vol and vol > 1500:
            findings.extend(
                guard(
                    bool(wrg),
                    lambda: Finding(
                        id=f"kg430_{system_id}_wrg",
                        kategorie="technisch",
                        prioritaet="hoch",
                        titel="Wärmerückgewinnung fehlt",
                        beschreibung=(
                            f"Die Anlage {system_id} verfügt über {vol:.0f} m³/h Volumenstrom."
                            " Für Anlagen >1500 m³/h ist eine Wärmerückgewinnung vorzusehen."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="GEG §70, DIN EN 13053",
                        empfehlung="WRG-System (z.B. Rotationswärmetauscher) nachrüsten.",
                        konfidenz_score=0.85,
                    ),
                )
            )

        if wrg and eta is not None and eta < float(params["wrg_eta_min"]):
            findings.append(
                Finding(
                    id=f"kg430_{system_id}_eta",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Wirkungsgrad der Wärmerückgewinnung zu gering",
                    beschreibung=(
                        f"Für Anlage {system_id} ist ein WRG-Wirkungsgrad von {pct(eta)} dokumentiert."
                        f" Gefordert sind mindestens {pct(params['wrg_eta_min'])}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 13053",
                    empfehlung="Geräteauswahl überprüfen oder Leistungsdaten aktualisieren.",
                    konfidenz_score=0.78,
                )
            )

        filterklassen = system.get("filterklassen") or []
        if isinstance(filterklassen, Iterable):
            if not any(str(f).upper().startswith("F7") or str(f).upper().startswith("EPM1") for f in filterklassen):
                findings.append(
                    Finding(
                        id=f"kg430_{system_id}_filter",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Filterklasse für Zuluft unzureichend",
                        beschreibung=(
                            f"Für Anlage {system_id} ist keine Filterklasse ≥F7 dokumentiert."
                            " Gemäß DIN EN ISO 16890 sind mindestens F7/ePM1 50% erforderlich."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="DIN EN ISO 16890",
                        empfehlung="Filterstufen festlegen und Kennzeichnung im Schema ergänzen.",
                        konfidenz_score=0.76,
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
