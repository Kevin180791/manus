"""Regelwerk für KG420 Wärmeversorgungsanlagen."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional, Sequence, Set

from .common import Finding, guard, pct
from .params import PARAMS

GEWERK = "kg420_heizung"

_REQUIRED_COMPONENTS: Set[str] = {
    "wärmeerzeuger",
    "umwälzpumpe",
    "ausdehnungsgefäß",
    "sicherheitsventil",
    "manometer",
}


def _load_context(context: Mapping[str, Any]) -> Mapping[str, Any]:
    return context.get("heating_load") or {}


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    """Bewertet die Heizungsplanung anhand technischer Leitplanken."""

    params = PARAMS["kg420"]
    projekt_typ = context.get("projekt_typ") or "buerogebaeude"
    load_section = _load_context(context)
    rooms: Iterable[Mapping[str, Any]] = load_section.get("rooms", [])  # type: ignore[assignment]
    system = context.get("system") or {}
    generator = context.get("generator") or {}

    findings: List[Finding] = []

    findings.extend(
        guard(
            bool(list(rooms)),
            lambda: Finding(
                id="kg420_0001",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Keine Heizlastdaten gefunden",
                beschreibung="Für die Heizungsbewertung konnten keine Raumheizlasten identifiziert werden.",
                gewerk=GEWERK,
                empfehlung="Heizlastberechnung nach DIN EN 12831 bereitstellen.",
                konfidenz_score=0.55,
            ),
        )
    )

    range_data = params["specific_load"].get(projekt_typ) or params["specific_load"].get("buerogebaeude")

    total_load = _to_float(load_section.get("total"))
    if total_load is None:
        total_load = 0.0
        for room in rooms:
            value = _to_float(room.get("heizlast"))
            if value is None:
                continue
            if value > 1000:  # meist W → in kW umrechnen
                value = value / 1000
            total_load += value

    for room in rooms:
        specific = room.get("spezifische_heizlast")
        if specific is None:
            continue
        try:
            specific_value = float(specific)
        except (TypeError, ValueError):
            continue
        if range_data and specific_value > float(range_data["max"]):
            findings.append(
                Finding(
                    id=f"kg420_room_{room.get('name', 'unbekannt')}_hoch",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Spezifische Heizlast über Richtwert",
                    beschreibung=(
                        f"Für den Raum {room.get('name', 'unbekannt')} liegt die spezifische Heizlast bei {specific_value:.1f} W/m² "
                        f"und überschreitet den Richtwert von {range_data['max']} W/m² für {projekt_typ}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 12831-1",
                    empfehlung="Bauteilannahmen und Lüftungszonen prüfen.",
                    konfidenz_score=0.82,
                )
            )
        if range_data and specific_value < float(range_data["min"]):
            findings.append(
                Finding(
                    id=f"kg420_room_{room.get('name', 'unbekannt')}_niedrig",
                    kategorie="technisch",
                    prioritaet="niedrig",
                    titel="Spezifische Heizlast auffällig niedrig",
                    beschreibung=(
                        f"Der Raum {room.get('name', 'unbekannt')} weist lediglich {specific_value:.1f} W/m² auf."
                        f" Erwartungswert: mindestens {range_data['min']} W/m²."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 12831-1",
                    empfehlung="Eingabedaten der Heizlastberechnung überprüfen.",
                    konfidenz_score=0.7,
                )
            )

    supply_temp = _to_float(system.get("supply_temperature"))
    return_temp = _to_float(system.get("return_temperature"))
    system_pressure = _to_float(system.get("pressure"))

    findings.extend(
        guard(
            supply_temp is None or supply_temp <= float(params["supply_temp_max"]),
            lambda: Finding(
                id="kg420_vorlauf_001",
                kategorie="technisch",
                prioritaet="mittel",
                titel="Vorlauftemperatur über Grenzwert",
                beschreibung=(
                    f"Die geplante Vorlauftemperatur beträgt {supply_temp} °C und überschreitet den Grenzwert"
                    f" von {params['supply_temp_max']} °C für Niedertemperatursysteme."
                ),
                gewerk=GEWERK,
                norm_referenz="GEG §70",
                empfehlung="Heizkreis-Temperaturniveau optimieren (z.B. größere Heizflächen).",
                konfidenz_score=0.78,
            ),
        )
    )

    findings.extend(
        guard(
            return_temp is None or return_temp <= float(params["return_temp_max"]),
            lambda: Finding(
                id="kg420_ruecklauf_001",
                kategorie="technisch",
                prioritaet="niedrig",
                titel="Rücklauftemperatur über Richtwert",
                beschreibung=(
                    f"Der Rücklauf liegt bei {return_temp} °C und überschreitet den empfohlenen Wert"
                    f" von {params['return_temp_max']} °C."
                ),
                gewerk=GEWERK,
                norm_referenz="VDI 6030",
                empfehlung="Hydraulische Optimierung prüfen (z.B. Volumenstromerhöhung).",
                konfidenz_score=0.72,
            ),
        )
    )

    if supply_temp is not None and return_temp is not None and supply_temp > return_temp:
        delta_t = supply_temp - return_temp
        if delta_t < float(params["delta_t_tolerance"]):
            findings.append(
                Finding(
                    id="kg420_deltaT_001",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Temperaturspreizung zu gering",
                    beschreibung=(
                        f"Die Temperaturspreizung beträgt nur {delta_t:.1f} K. Für stabile Regelung sollten mindestens"
                        f" {params['delta_t_tolerance']} K erreicht werden."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="VDI 2035",
                    empfehlung="Heizflächen oder Volumenströme anpassen.",
                    konfidenz_score=0.69,
                )
            )

    if system_pressure is not None:
        if system_pressure < float(params["pressure_min"]):
            findings.append(
                Finding(
                    id="kg420_druck_min",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Anlagendruck zu niedrig",
                    beschreibung=(
                        f"Der dokumentierte Anlagendruck beträgt {system_pressure:.1f} bar."
                        f" Mindestwert nach DIN EN 12828: {params['pressure_min']} bar."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 12828",
                    empfehlung="Vordruck des Ausdehnungsgefäßes prüfen und nachjustieren.",
                    konfidenz_score=0.77,
                )
            )
        elif system_pressure > float(params["pressure_max"]):
            findings.append(
                Finding(
                    id="kg420_druck_max",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Anlagendruck oberhalb Sicherheitsgrenze",
                    beschreibung=(
                        f"Der festgelegte Systemdruck beträgt {system_pressure:.1f} bar und überschreitet den"
                        f" zulässigen Maximalwert von {params['pressure_max']} bar."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 12828",
                    empfehlung="Sicherheitsventil und Ausdehnungsgefäßdimensionierung überprüfen.",
                    konfidenz_score=0.84,
                )
            )

    if params["hydraulic_balance_required"]:
        findings.extend(
            guard(
                bool(system.get("hydraulic_balancing")),
                lambda: Finding(
                    id="kg420_hydraulik_001",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Nachweis hydraulischer Abgleich fehlt",
                    beschreibung="Für das Heizsystem liegt kein Nachweis des hydraulischen Abgleichs vor.",
                    gewerk=GEWERK,
                    norm_referenz="EnSimiMaV, VdZ-Formular",
                    empfehlung="Hydraulischen Abgleich durchführen und protokollieren.",
                    konfidenz_score=0.88,
                ),
            )
        )

    components: Sequence[str] = [comp.lower() for comp in system.get("components", []) if isinstance(comp, str)]
    missing_raw = _REQUIRED_COMPONENTS - set(components)
    if missing_raw:
        missing = [entry.replace("_", " ").title() for entry in sorted(missing_raw)]
        findings.append(
            Finding(
                id="kg420_komponenten_001",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Pflichtkomponenten im Schema nicht nachgewiesen",
                beschreibung="Im Anlagenschema fehlen folgende Komponenten: " + ", ".join(missing),
                gewerk=GEWERK,
                norm_referenz="DIN EN 12828",
                empfehlung="Schema ergänzen und Komponenten nachweisen.",
                konfidenz_score=0.83,
            )
        )

    generator_power = _to_float(generator.get("leistung"))
    if generator_power is not None and total_load:
        margin = generator_power / float(total_load) if total_load else 0
        required_margin = float(params["generator_margin"])
        if margin < required_margin:
            findings.append(
                Finding(
                    id="kg420_erzeuger_001",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Wärmeerzeuger zu klein dimensioniert",
                    beschreibung=(
                        f"Der Wärmeerzeuger ist mit {generator_power:.1f} kW angesetzt."
                        f" Der Nachweis erfordert mindestens {pct(required_margin - 1)} Reserve auf die berechnete Heizlast"
                        f" (aktuell {total_load:.1f} kW)."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 12831-3",
                    empfehlung="Erzeugerleistung erhöhen oder Heizlastberechnung plausibilisieren.",
                    konfidenz_score=0.86,
                )
            )

    gen_type = (generator.get("typ") or "").lower()
    if gen_type == "waermepumpe":
        cop = _to_float(generator.get("cop")) or _to_float(generator.get("cop_scop"))
        findings.extend(
            guard(
                cop is None or cop >= float(params["cop_min"]),
                lambda: Finding(
                    id="kg420_wp_001",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="COP der Wärmepumpe zu niedrig",
                    beschreibung=(
                        f"Der dokumentierte COP/SCOP beträgt {cop} und liegt unter dem Zielwert"
                        f" von {params['cop_min']} für effiziente Wärmepumpen."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="GEG §71",
                    empfehlung="Geräteauswahl prüfen oder Systemtemperaturen senken.",
                    konfidenz_score=0.8,
                ),
            )
        )
    elif gen_type == "gaskessel":
        eta = _to_float(generator.get("wirkungsgrad"))
        findings.extend(
            guard(
                eta is None or eta >= float(params["boiler_efficiency_min"]),
                lambda: Finding(
                    id="kg420_kessel_001",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Wirkungsgrad des Kessels zu gering",
                    beschreibung=(
                        f"Der angegebene Kesselwirkungsgrad liegt bei {pct(eta)} und unterschreitet den"
                        f" Mindestwert von {pct(params['boiler_efficiency_min'])}."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="GEG §62",
                    empfehlung="Brennwerttechnik einsetzen oder Wirkungsgradnachweis erbringen.",
                    konfidenz_score=0.87,
                ),
            )
        )

    return findings


def _to_float(value: Optional[Any]) -> Optional[float]:
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
