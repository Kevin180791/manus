"""Regelwerk für KG450 Kommunikations- und sicherheitstechnische Anlagen."""
from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Optional

from .common import Finding, guard
from .params import PARAMS

GEWERK = "kg450_kommunikation"


def evaluate(context: Mapping[str, Any]) -> List[Finding]:
    params = PARAMS["kg450"]
    projekt_typ = context.get("projekt_typ") or "buerogebaeude"

    networks: Iterable[Mapping[str, Any]] = context.get("datennetze", [])  # type: ignore[assignment]
    fire_alarm = context.get("brandmeldeanlage") or {}
    security: Iterable[Mapping[str, Any]] = context.get("sicherheitsbereiche", [])  # type: ignore[assignment]

    findings: List[Finding] = []

    if not networks and not fire_alarm and not security:
        findings.append(
            Finding(
                id="kg450_0001",
                kategorie="technisch",
                prioritaet="mittel",
                titel="Keine Kommunikationsanlagen dokumentiert",
                beschreibung="Es konnten keine Daten zu Netzwerken oder sicherheitstechnischen Anlagen ausgewertet werden.",
                gewerk=GEWERK,
                empfehlung="Planunterlagen für Datennetze und Gefahrenmeldeanlagen ergänzen.",
                konfidenz_score=0.45,
            )
        )
        return findings

    for network in networks:
        rack_fill = _to_float(network.get("rack_belegung"))
        zone = network.get("zone") or "Netz"
        shielding = network.get("kabelschirmung")

        if rack_fill is not None and rack_fill > float(params["data_rack_fill_max"]):
            findings.append(
                Finding(
                    id=f"kg450_{zone}_rack",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Racks zu hoch belegt",
                    beschreibung=(
                        f"Im Bereich {zone} ist eine Gestellbelegung von {rack_fill:.0%} geplant."
                        f" Empfohlen werden maximal {params['data_rack_fill_max']:.0%} zur Reservebildung."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Racks auf mehrere Verteilräume verteilen oder Kapazität erweitern.",
                    konfidenz_score=0.7,
                )
            )

        if projekt_typ in params["cable_shielding_required"]:
            findings.extend(
                guard(
                    bool(shielding),
                    lambda: Finding(
                        id=f"kg450_{zone}_schirmung",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Kabelschirmung nicht nachgewiesen",
                        beschreibung=(
                            f"Für Zone {zone} ist aufgrund elektromagnetischer Störungen eine geschirmte Verkabelung"
                            " vorzusehen. Aktuell fehlt der Nachweis."
                        ),
                        gewerk=GEWERK,
                        empfehlung="Verkabelungskonzept aktualisieren und Schirmungsmaßnahme spezifizieren.",
                        konfidenz_score=0.68,
                    ),
                )
            )

    if fire_alarm:
        standard = str(fire_alarm.get("norm")) if fire_alarm.get("norm") else ""
        findings.extend(
            guard(
                standard.lower().startswith("din 14675"),
                lambda: Finding(
                    id="kg450_bma_norm",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Brandmeldeanlage nicht normkonform",
                    beschreibung=(
                        "Für die Brandmeldeanlage ist kein Nachweis gemäß DIN 14675 dokumentiert."
                    ),
                    gewerk=GEWERK,
                    norm_referenz=params["fire_alarm_standard"],
                    empfehlung="Planungsnachweis nach DIN 14675 erstellen und Wartungskonzept definieren.",
                    konfidenz_score=0.82,
                ),
            )
        )

        redundant_paths_required = projekt_typ in params["redundant_paths_required"]
        redundant_paths = fire_alarm.get("redundante_wege")
        findings.extend(
            guard(
                not redundant_paths_required or bool(redundant_paths),
                lambda: Finding(
                    id="kg450_bma_redundanz",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Brandmeldeanlage ohne redundante Leitungsführung",
                    beschreibung="Für kritische Gebäude ist eine redundante Übertragungsstrecke vorzusehen.",
                    gewerk=GEWERK,
                    empfehlung="Ringstruktur bzw. doppelte Anbindung der Brandmeldezentrale planen.",
                    konfidenz_score=0.8,
                ),
            )
        )

    for area in security:
        area_name = area.get("name") or area.get("bereich") or "Bereich"
        redundancy = area.get("redundante_anbindung")
        monitoring = area.get("videoueberwachung")

        if projekt_typ in params["redundant_paths_required"]:
            findings.extend(
                guard(
                    bool(redundancy),
                    lambda: Finding(
                        id=f"kg450_{area_name}_redundanz",
                        kategorie="technisch",
                        prioritaet="mittel",
                        titel="Sicherheitsnetz ohne redundante Anbindung",
                        beschreibung=(
                            f"Für sicherheitskritische Zone {area_name} ist keine redundante Netzwerkverbindung vorgesehen."
                        ),
                        gewerk=GEWERK,
                        empfehlung="Redundante Switch-/Leitungstopologie auslegen.",
                        konfidenz_score=0.7,
                    ),
                )
            )

        access_control = area.get("zutrittskontrolle")
        findings.extend(
            guard(
                bool(access_control),
                lambda: Finding(
                    id=f"kg450_{area_name}_zutritt",
                    kategorie="technisch",
                    prioritaet="hoch",
                    titel="Zutrittskontrolle nicht geplant",
                    beschreibung=(
                        f"Für den sensiblen Bereich {area_name} ist keine Zutrittskontrolle dokumentiert."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Zutrittskontrollsystem mit Protokollierung vorsehen.",
                    konfidenz_score=0.75,
                ),
            )
        )

        if monitoring is None and projekt_typ in {"krankenhaus", "rechenzentrum"}:
            findings.append(
                Finding(
                    id=f"kg450_{area_name}_video",
                    kategorie="technisch",
                    prioritaet="mittel",
                    titel="Videomonitoring nicht spezifiziert",
                    beschreibung=(
                        f"Für sicherheitsrelevanten Bereich {area_name} fehlt der Nachweis einer Videoüberwachung."
                    ),
                    gewerk=GEWERK,
                    empfehlung="Videoüberwachungskonzept inkl. Aufbewahrungsfristen definieren.",
                    konfidenz_score=0.66,
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
