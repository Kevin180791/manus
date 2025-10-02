"""Regelbasierte Prüfmodule für die Gewerke der KG400."""
from __future__ import annotations

from typing import Any, Callable, Dict, List, Mapping

from .common import Finding
from .kg410_sanitary import GEWERK as KG410_CODE, evaluate as evaluate_kg410
from .kg420_heating import GEWERK as KG420_CODE, evaluate as evaluate_kg420
from .kg430_ventilation import GEWERK as KG430_CODE, evaluate as evaluate_kg430
from .kg440_electrical import GEWERK as KG440_CODE, evaluate as evaluate_kg440
from .kg450_communication import GEWERK as KG450_CODE, evaluate as evaluate_kg450
from .kg474_fire_suppression import GEWERK as KG474_CODE, evaluate as evaluate_kg474
from .kg480_bacs import GEWERK as KG480_CODE, evaluate as evaluate_kg480

Evaluator = Callable[[Mapping[str, Any]], List[Finding]]

EVALUATORS: Dict[str, Evaluator] = {
    KG410_CODE: evaluate_kg410,
    KG420_CODE: evaluate_kg420,
    KG430_CODE: evaluate_kg430,
    KG440_CODE: evaluate_kg440,
    KG450_CODE: evaluate_kg450,
    KG474_CODE: evaluate_kg474,
    KG480_CODE: evaluate_kg480,
}


def evaluate(gewerk: str, context: Mapping[str, Any]) -> List[Finding]:
    """Führt die passenden Regeln für das angegebene Gewerk aus."""

    evaluator = EVALUATORS.get(gewerk)
    if not evaluator:
        return []
    return evaluator(context)


__all__ = [
    "Finding",
    "EVALUATORS",
    "evaluate",
    "evaluate_kg410",
    "evaluate_kg420",
    "evaluate_kg430",
    "evaluate_kg440",
    "evaluate_kg450",
    "evaluate_kg474",
    "evaluate_kg480",
]
