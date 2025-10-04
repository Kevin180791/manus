"""Regelwerk für KG410 Sanitär, Wasser, Gas."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping

from .common import Finding, guard
from .params import PARAMS

GEWERK = "kg410_sanitaer"


def _system_label(system: Mapping[str, Any]) -> str:
    return system.get("name") or system.get("id") or "System"


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    """Bewertet Sanitärsysteme anhand der hinterlegten Parameter."""

    params = PARAMS["kg410"]
    findings: List[Finding] = []

    systems: Iterable[Mapping[str, Any]] = context.get("systems", [])  # type: ignore[assignment]
    fixtures: Iterable[Mapping[str, Any]] = context.get("fixtures", [])  # type: ignore[assignment]
    projekt_typ = context.get("projekt_typ")

    findings.extend(
        guard(
            bool(systems),
            lambda: Finding(
                id="kg410_0001",
                kategorie="technisch",
                prioritaet="hoch",
                titel="Keine Trinkwasseranlagen gefunden",
                beschreibung="Für das Gewerk KG410 konnten keine Systeme erkannt werden.",
                gewerk=GEWERK,
                empfehlung="Heizungs- und Sanitärunterlagen bereitstellen bzw. Kennzeichnung prüfen.",
                konfidenz_score=0.6,
            ),
        )
    )

    for system in systems:
        dokument_id = system.get("dokument_id")
        label = _system_label(system)

        hot_temp = system.get("hot_water_temp")
        findings.extend(
            guard(
                hot_temp is None or float(hot_temp) >= params["hot_water_temp_min"],
                lambda: Finding(
                    id=f"kg410_{label}_temp",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Trinkwarmwasser nicht ausreichend aufgeheizt",
                    beschreibung=(
                        f"Im System {label} liegt die Warmwassertemperatur bei {hot_temp} °C "
                        f"und unterschreitet den Mindestwert von {params['hot_water_temp_min']} °C nach TrinkwV."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="TrinkwV, DVGW W 551",
                    empfehlung="Warmwasserbereitung auf mindestens 55 °C einstellen und dokumentieren.",
                    konfidenz_score=0.85,
                    dokument_id=dokument_id,
                ),
            )
        )

        findings.extend(
            guard(
                hot_temp is not None,
                lambda: Finding(
                    id=f"kg410_{label}_temp_missing",
                    kategorie="hinweis",
                    prioritaet="niedrig",
                    titel="Keine Warmwassertemperatur dokumentiert",
                    beschreibung=(
                        f"Für das System {label} liegt keine dokumentierte Trinkwarmwassertemperatur vor."
                        " Bitte Messwert nachreichen oder Monitoring ergänzen."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Temperaturaufzeichnungen ergänzen und Prüfprotokolle aktualisieren.",
                    konfidenz_score=0.4,
                    dokument_id=dokument_id,
                ),
            )
        )

        circ_temp = system.get("circulation_temp")
        findings.extend(
            guard(
                circ_temp is None or float(circ_temp) >= params["circulation_temp_min"],
                lambda: Finding(
                    id=f"kg410_{label}_zirkulation",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Zirkulationsrücklauftemperatur zu niedrig",
                    beschreibung=(
                        f"Die gemessene Rücklauftemperatur der Zirkulation beträgt {circ_temp} °C und "
                        f"unterschreitet den Richtwert von {params['circulation_temp_min']} °C."
                    ),
                    gewerk=GEWERK,
                    norm_referenz="DVGW W 551",
                    empfehlung="Zirkulationssystem hydraulisch optimieren und Dämmung prüfen.",
                    konfidenz_score=0.8,
                    dokument_id=dokument_id,
                ),
            ),
        )

        velocities = system.get("velocities", {})
        for medium, limit in params["max_velocity"].items():
            actual = velocities.get(medium)
            if actual is None:
                continue
            try:
                value = float(actual)
            except (TypeError, ValueError):
                continue
            if value > float(limit):
                findings.append(
                    Finding(
                        id=f"kg410_{label}_velocity_{medium}",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Strömungsgeschwindigkeit überschreitet Grenzwert",
                        beschreibung=(
                            f"Im Strang '{medium}' des Systems {label} liegt die Strömungsgeschwindigkeit bei {value:.2f} m/s "
                            f"und überschreitet den Richtwert von {limit} m/s gemäß DIN 1988-300."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="DIN 1988-300",
                        empfehlung="Dimensionierung bzw. Pumpeneinstellung überprüfen.",
                        konfidenz_score=0.78,
                        dokument_id=dokument_id,
                    )
                )

        materials = system.get("materials") or {}
        if isinstance(materials, Mapping):
            for medium, blacklist in params["material_blacklist"].items():
                mat = materials.get(medium)
                if mat and isinstance(mat, str) and mat.lower() in {entry.lower() for entry in blacklist}:  # type: ignore[arg-type]
                    findings.append(
                        Finding(
                            id=f"kg410_{label}_material_{medium}",
                            kategorie="technisch",
                            prioritaet="hoch",
                            titel="Nicht zulässiges Werkstoffkonzept",
                            beschreibung=(
                                f"Für {medium} in {label} ist der Werkstoff '{mat}' vorgesehen. Dieser ist für Trinkwarmwasser"
                                " hygienisch kritisch und sollte vermieden werden."
                            ),
                            gewerk=GEWERK,
                            norm_referenz="DIN EN 806-2",
                            empfehlung="Korrosionsbeständige Werkstoffe (z.B. Edelstahl, Kunststoff) einsetzen.",
                            konfidenz_score=0.82,
                            dokument_id=dokument_id,
                        )
                    )

        insulation = system.get("insulation") or {}
        if isinstance(insulation, Mapping):
            for medium, min_thickness in params["insulation_min"].items():
                thickness = insulation.get(medium)
                if thickness is None:
                    continue
                try:
                    thickness_value = float(thickness)
                except (TypeError, ValueError):
                    continue
                if thickness_value < float(min_thickness):
                    findings.append(
                        Finding(
                            id=f"kg410_{label}_insulation_{medium}",
                            kategorie="technisch",
                            prioritaet="mittel",
                            titel="Dämmstärke unterschreitet GEG-Anforderung",
                            beschreibung=(
                                f"Für {medium} im System {label} sind nur {thickness_value:.0f} mm Dämmung vorgesehen."
                                f" Vorgabe nach GEG: mindestens {min_thickness} mm."
                            ),
                            gewerk=GEWERK,
                            norm_referenz="GEG Anlage 8",
                            empfehlung="Dämmkonzept nachbessern und Berechnung aktualisieren.",
                            konfidenz_score=0.76,
                            dokument_id=dokument_id,
                        )
                    )

    for fixture in fixtures:
        bereich = fixture.get("bereich") or fixture.get("nutzung")
        stagnation = fixture.get("stagnation_hours")
        if stagnation is not None:
            try:
                hours = float(stagnation)
            except (TypeError, ValueError):
                hours = None
            if hours and hours > float(params["max_stagnation_hours"]):
                findings.append(
                    Finding(
                        id=f"kg410_fixture_{fixture.get('id', 'unbekannt')}_stagnation",
                        kategorie="technisch",
                        prioritaet="hoch",
                        titel="Stagnationszeiten überschreiten Trinkwasseranforderungen",
                        beschreibung=(
                            f"Für den Bereich {bereich or 'unbekannt'} wurden Stagnationszeiten von {hours:.0f} Stunden"
                            f" angegeben. Vorgabe: ≤ {params['max_stagnation_hours']} Stunden."
                        ),
                        gewerk=GEWERK,
                        norm_referenz="DVGW W 557",
                        empfehlung="Nutzungsprofil prüfen und ggf. Spülkonzept vorsehen.",
                        konfidenz_score=0.74,
                        dokument_id=fixture.get("dokument_id"),
                    )
                )

        backflow = fixture.get("backflow_protection")
        findings.extend(
            guard(
                not (bereich and projekt_typ and projekt_typ in params["backflow_required_for"])
                or bool(backflow),
                lambda: Finding(
                    id=f"kg410_fixture_{fixture.get('id', 'unbekannt')}_ruecksaugsicherung",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Rückflussverhinderer erforderlich",
                    beschreibung=(
                        "Für den sensiblen Bereich {bereich} ist gemäß DIN EN 1717 ein Rückflussverhinderer vorzusehen."
                        " Die Unterlage weist keinen entsprechenden Nachweis auf."
                    ).format(bereich=bereich or "unbekannt"),
                    gewerk=GEWERK,
                    norm_referenz="DIN EN 1717",
                    empfehlung="Geräteseitige Sicherungseinrichtungen vorsehen und dokumentieren.",
                    konfidenz_score=0.81,
                    dokument_id=fixture.get("dokument_id"),
                ),
            )
        )

    return findings


__all__ = ["evaluate", "GEWERK"]
