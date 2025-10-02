"""Gemeinsame Utilities für gewerkespezifische Checks."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Callable, List, MutableMapping, Optional, Sequence, Union


@dataclass
class Finding:
    """Standardisierte Darstellung eines Prüfbefunds."""

    id: str
    kategorie: str
    prioritaet: str
    titel: str
    beschreibung: str
    gewerk: str
    norm_referenz: Optional[str] = None
    empfehlung: Optional[str] = None
    konfidenz_score: float = 0.7
    dokument_id: Optional[str] = None
    plan_referenz: Optional[str] = None

    def to_dict(self) -> MutableMapping[str, Any]:
        """Gibt den Befund als Dictionary ohne ``None``-Werte zurück."""

        data = asdict(self)
        return {key: value for key, value in data.items() if value is not None}


GuardCandidate = Union[Finding, Sequence[Finding], Callable[[], Union[Finding, Sequence[Finding]]]]


def guard(condition: bool, candidate: GuardCandidate, *, enabled: bool = True) -> List[Finding]:
    """Hilfsfunktion zur kompakten Regelnotation."""

    if not enabled or condition:
        return []

    if callable(candidate):
        produced = candidate()
    else:
        produced = candidate

    if produced is None:
        return []

    if isinstance(produced, Finding):
        return [produced]

    return list(produced)


def pct(value: Union[float, int, Sequence[Union[float, int]]], digits: int = 1) -> str:
    """Formatiert Werte als Prozentangabe."""

    ratio: Optional[float] = None

    if isinstance(value, Sequence) and len(value) == 2:
        numerator, denominator = value  # type: ignore[assignment]
        try:
            numerator_f = float(numerator)
            denominator_f = float(denominator)
        except (TypeError, ValueError):
            ratio = None
        else:
            if denominator_f != 0:
                ratio = numerator_f / denominator_f
    else:
        try:
            ratio = float(value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            ratio = None

    if ratio is None:
        return "n/a"

    return f"{ratio * 100:.{digits}f}%"


__all__ = ["Finding", "guard", "pct"]
