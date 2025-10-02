"""Kontextaufbereitung für die Heizungs-Prüfung (KG420)."""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional

from .checks import EVALUATORS
from .checks.kg420_heating import GEWERK as KG420_CODE
from .document_parser import DocumentParser

logger = logging.getLogger(__name__)

COMPONENT_KEYWORDS = {
    "wärmeerzeuger": ["wärmeerzeuger", "kessel", "anlage", "wärmepumpe"],
    "umwälzpumpe": ["umwälzpumpe", "heizkreispumpe", "zirkulationspumpe"],
    "ausdehnungsgefäß": ["ausdehnungsgefäß", "ausdehnungsgef", "membranbehälter"],
    "sicherheitsventil": ["sicherheitsventil", "sv"],
    "manometer": ["manometer", "druckanzeige"],
    "thermometer": ["thermometer", "temperaturfühler"],
    "absperrventil": ["absperr", "absperrventil"],
}


async def evaluate_heating(documents: Iterable[Mapping[str, Any]], projekt_typ: str) -> List[Dict[str, Any]]:
    """Baut den Kontext auf und ruft die Regelengine."""

    context = await build_heating_context(documents, projekt_typ)
    evaluator = EVALUATORS[KG420_CODE]
    findings = evaluator(context)
    return [finding.to_dict() for finding in findings]


async def build_heating_context(
    documents: Iterable[Mapping[str, Any]], projekt_typ: str
) -> MutableMapping[str, Any]:
    parser = DocumentParser()
    context: MutableMapping[str, Any] = {
        "projekt_typ": projekt_typ,
        "documents": [],
        "heating_load": {"rooms": [], "total": None, "auslegung": None},
        "system": {
            "supply_temperature": None,
            "return_temperature": None,
            "pressure": None,
            "hydraulic_balancing": False,
            "components": set(),
        },
        "generator": {"typ": None, "leistung": None, "cop": None, "wirkungsgrad": None},
    }

    for document in documents:
        file_path = document.get("file_path")
        filename = document.get("filename", "")
        document_id = document.get("id")

        if not file_path or not parser.can_parse(file_path):
            logger.debug("Skipping unsupported document %s", filename)
            continue

        context["documents"].append({"id": document_id, "filename": filename})

        text = parser.extract_text(file_path)
        lowered = text.lower() if text else ""

        if "heizlast" in filename.lower():
            load_data = parser.find_heizlast_data(file_path)
            _populate_heating_load(context["heating_load"], load_data)

        if any(keyword in filename.lower() for keyword in ["schema", "hydraulik", "anlage"]):
            _populate_system_data(context["system"], text)

        if any(keyword in filename.lower() for keyword in ["erzeuger", "waermeerzeuger", "heizraum", "wärmepumpe"]):
            _populate_generator_data(context["generator"], text)

        if text:
            _enrich_from_text(context, text)
            _detect_components(context["system"], lowered)

    system_components = context["system"].get("components", set())
    context["system"]["components"] = sorted(system_components)

    return context


def _populate_heating_load(target: MutableMapping[str, Any], data: Mapping[str, Any]) -> None:
    rooms = data.get("raeume", [])
    for room in rooms:
        entry = {
            "name": room.get("name"),
            "flaeche": room.get("flaeche"),
            "heizlast": _normalize_heating_power(room.get("heizlast")),
            "spezifische_heizlast": room.get("spezifische_heizlast"),
        }
        target["rooms"].append(entry)

    if data.get("gesamt_heizlast") is not None:
        target["total"] = _normalize_heating_power(data.get("gesamt_heizlast"))
    if data.get("auslegungstemperatur") is not None:
        target["auslegung"] = data.get("auslegungstemperatur")


def _populate_system_data(system: MutableMapping[str, Any], text: str) -> None:
    supply = _find_float(r"Vorlauftemperatur[^\d]*(\d+[.,]?\d*)", text)
    return_temp = _find_float(r"Rücklauftemperatur[^\d]*(\d+[.,]?\d*)", text)
    pressure = _find_float(r"(Systemdruck|Betriebsdruck)[^\d]*(\d+[.,]?\d*)", text)

    if supply is not None:
        system["supply_temperature"] = supply
    if return_temp is not None:
        system["return_temperature"] = return_temp
    if pressure is not None:
        system["pressure"] = pressure

    if re.search(r"hydraulischer\s+abgleich", text, re.IGNORECASE):
        system["hydraulic_balancing"] = True


def _populate_generator_data(generator: MutableMapping[str, Any], text: str) -> None:
    lowered = text.lower()
    if "wärmepumpe" in lowered:
        generator["typ"] = "waermepumpe"
    elif "kessel" in lowered or "brennwert" in lowered:
        generator["typ"] = "gaskessel"

    leistung = _find_float(r"Nennleistung[^\d]*(\d+[.,]?\d*)\s*kW", text)
    if leistung is not None:
        generator["leistung"] = leistung

    cop = _find_float(r"COP\s*[:=]?\s*(\d+[.,]?\d*)", text)
    scop = _find_float(r"SCOP\s*[:=]?\s*(\d+[.,]?\d*)", text)
    generator["cop"] = cop or scop

    eta = _find_float(r"Wirkungsgrad[^\d]*(\d+[.,]?\d*)\s*%", text)
    if eta is not None:
        generator["wirkungsgrad"] = eta / 100 if eta > 1 else eta


def _enrich_from_text(context: MutableMapping[str, Any], text: str) -> None:
    if re.search(r"hydraulischer\s+abgleich\s+nachweis", text, re.IGNORECASE):
        context["system"]["hydraulic_balancing"] = True

    delta_match = _find_float(r"ΔT\s*=\s*(\d+[.,]?\d*)", text)
    if delta_match and context["system"].get("supply_temperature") and not context["system"].get("return_temperature"):
        supply = context["system"]["supply_temperature"]
        context["system"]["return_temperature"] = supply - delta_match


def _detect_components(system: MutableMapping[str, Any], lowered_text: str) -> None:
    components: set[str] = system.get("components", set())  # type: ignore[assignment]
    for canonical, keywords in COMPONENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in lowered_text:
                components.add(canonical)
                break
    system["components"] = components


def _find_float(pattern: str, text: str) -> Optional[float]:
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None
    value = match.group(match.lastindex or 1)
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return None


def _normalize_heating_power(value: Any) -> Optional[float]:
    numeric = _to_float(value)
    if numeric is None:
        return None
    if numeric > 1000:
        numeric = numeric / 1000
    return numeric


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        if isinstance(value, str):
            try:
                return float(value.replace(",", "."))
            except ValueError:
                return None
        return None


__all__ = ["build_heating_context", "evaluate_heating"]
