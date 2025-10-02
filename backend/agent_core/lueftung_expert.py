"""Kontextaufbereitung für die Lüftungs-Prüfung (KG430)."""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional

from .checks import EVALUATORS
from .checks.kg430_ventilation import GEWERK as KG430_CODE
from .document_parser import DocumentParser

logger = logging.getLogger(__name__)


async def evaluate_ventilation(documents: Iterable[Mapping[str, Any]], projekt_typ: str) -> List[Dict[str, Any]]:
    """Baut den Kontext auf und ruft die Regelengine."""

    context = await build_ventilation_context(documents, projekt_typ)
    evaluator = EVALUATORS[KG430_CODE]
    findings = evaluator(context)
    return [finding.to_dict() for finding in findings]


async def build_ventilation_context(
    documents: Iterable[Mapping[str, Any]], projekt_typ: str
) -> MutableMapping[str, Any]:
    parser = DocumentParser()
    context: MutableMapping[str, Any] = {
        "projekt_typ": projekt_typ,
        "documents": [],
        "rooms": [],
        "anlagen": [],
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
        luftdaten = parser.find_luftmengen_data(file_path)
        _merge_room_data(context["rooms"], luftdaten.get("raeume", []))
        _merge_anlagen(context["anlagen"], luftdaten.get("anlagen", []))

        if text:
            _enrich_rooms_from_text(context["rooms"], text)
            _enrich_anlagen_from_text(context["anlagen"], text)

    return context


def _merge_room_data(rooms: List[MutableMapping[str, Any]], new_rooms: Iterable[Mapping[str, Any]]) -> None:
    index = {room.get("name", "").lower(): room for room in rooms if room.get("name")}
    for entry in new_rooms:
        name = entry.get("name")
        if not name:
            continue
        key = name.lower()
        room = index.get(key)
        if room is None:
            room = {
                "name": name,
                "zuluft": None,
                "abluft": None,
                "persons": None,
                "air_change": None,
                "co2": None,
            }
            rooms.append(room)
            index[key] = room

        if entry.get("zuluft") is not None:
            room["zuluft"] = _to_float(entry.get("zuluft"))
        if entry.get("abluft") is not None:
            room["abluft"] = _to_float(entry.get("abluft"))
        if entry.get("personen") is not None:
            room["persons"] = _to_float(entry.get("personen"))


def _merge_anlagen(anlagen: List[MutableMapping[str, Any]], new_anlagen: Iterable[Mapping[str, Any]]) -> None:
    index = {anlage.get("id") or anlage.get("nummer"): anlage for anlage in anlagen if anlage.get("id") or anlage.get("nummer")}
    for entry in new_anlagen:
        nummer = entry.get("nummer")
        if not nummer:
            continue
        anlage = index.get(nummer)
        if anlage is None:
            anlage = {
                "id": nummer,
                "volumenstrom": None,
                "waermerueckgewinnung": None,
                "wrg_wirkungsgrad": None,
                "filterklassen": [],
            }
            anlagen.append(anlage)
            index[nummer] = anlage

        if entry.get("volumenstrom") is not None:
            anlage["volumenstrom"] = _to_float(entry.get("volumenstrom"))


def _enrich_rooms_from_text(rooms: List[MutableMapping[str, Any]], text: str) -> None:
    co2_matches = [float(match.replace(",", ".")) for match in re.findall(r"CO2[^\d]*(\d{3,4})", text, re.IGNORECASE)]
    if co2_matches:
        co2_value = co2_matches[0]
        for room in rooms:
            room.setdefault("co2", co2_value)

    air_change_match = re.findall(
        r"Luftwechsel(?:rate)?[^\d]*(\d+(?:[.,]\d+)?)\s*(?:1/h|h-1)", text, re.IGNORECASE
    )
    if air_change_match:
        value = float(air_change_match[0].replace(",", "."))
        for room in rooms:
            if room.get("air_change") is None:
                room["air_change"] = value


def _enrich_anlagen_from_text(anlagen: List[MutableMapping[str, Any]], text: str) -> None:
    lowered = text.lower()
    wrg_present = "wärmerückgewinnung" in lowered or "wrg" in lowered
    if wrg_present:
        for anlage in anlagen:
            anlage.setdefault("waermerueckgewinnung", True)

    eta_match = re.findall(r"η\s*=?\s*(\d+[.,]?\d*)\s*%", text)
    if eta_match:
        efficiency = float(eta_match[0].replace(",", ".")) / 100
        for anlage in anlagen:
            if anlage.get("wrg_wirkungsgrad") is None:
                anlage["wrg_wirkungsgrad"] = efficiency

    filter_matches = {
        match.upper().replace(" ", "")
        for match in re.findall(r"(F[5-9]|EPM1\s*\d{1,2})", text, re.IGNORECASE)
    }
    if filter_matches:
        for anlage in anlagen:
            filters = set(anlage.get("filterklassen", []))
            filters.update(filter_matches)
            anlage["filterklassen"] = sorted(filters)


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


__all__ = ["build_ventilation_context", "evaluate_ventilation"]
