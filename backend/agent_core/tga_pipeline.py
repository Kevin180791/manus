from __future__ import annotations

import logging
from typing import Any, Dict, List, Mapping

from .checks import EVALUATORS
from .checks.common import Finding as RuleFinding
from .checks.kg410_sanitary import GEWERK as KG410_CODE
from .checks.kg420_heating import GEWERK as KG420_CODE
from .checks.kg430_ventilation import GEWERK as KG430_CODE
from .checks.kg440_electrical import GEWERK as KG440_CODE
from .checks.kg450_communication import GEWERK as KG450_CODE
from .checks.kg474_fire_suppression import GEWERK as KG474_CODE
from .checks.kg480_bacs import GEWERK as KG480_CODE

logger = logging.getLogger(__name__)


class CheckEngine:
    """Wrapper um die regelbasierten Evaluatoren der Fachmodule."""

    def __init__(self, gewerk_code: str, evaluator):
        self._gewerk_code = gewerk_code
        self._evaluator = evaluator

    def run(self, context: Mapping[str, Any]) -> List[RuleFinding]:
        try:
            findings = self._evaluator(context)
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Regelausführung für %s fehlgeschlagen", self._gewerk_code)
            return []

        return list(findings)


_ENGINE_CACHE: Dict[str, CheckEngine] = {}


def _engine_for(gewerk_code: str) -> CheckEngine:
    engine = _ENGINE_CACHE.get(gewerk_code)
    if engine is not None:
        return engine

    evaluator = EVALUATORS.get(gewerk_code)
    if evaluator is None:
        raise ValueError(f"Kein Evaluator für Gewerk {gewerk_code} registriert")

    engine = CheckEngine(gewerk_code, evaluator)
    _ENGINE_CACHE[gewerk_code] = engine
    return engine


def run_pipeline_sanitary(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG410_CODE).run(context)


def run_pipeline_heating(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG420_CODE).run(context)


def run_pipeline_ventilation(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG430_CODE).run(context)


def run_pipeline_electrical(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG440_CODE).run(context)


def run_pipeline_communication(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG450_CODE).run(context)


def run_pipeline_fire_suppression(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG474_CODE).run(context)


def run_pipeline_automation(context: Mapping[str, Any]) -> List[RuleFinding]:
    return _engine_for(KG480_CODE).run(context)


__all__ = [
    "CheckEngine",
    "run_pipeline_sanitary",
    "run_pipeline_heating",
    "run_pipeline_ventilation",
    "run_pipeline_electrical",
    "run_pipeline_communication",
    "run_pipeline_fire_suppression",
    "run_pipeline_automation",
]
