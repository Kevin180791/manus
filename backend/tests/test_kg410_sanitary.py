from __future__ import annotations

from typing import Dict, List

from backend.agent_core.checks.kg410_sanitary import Finding, evaluate


def _finding_ids(findings: List[Finding]) -> set[str]:
    return {finding.id for finding in findings}


def test_missing_hot_water_temperature_does_not_raise_temp_finding() -> None:
    context: Dict[str, object] = {
        "systems": [
            {
                "id": "sys1",
                "hot_water_temp": None,
            }
        ],
        "fixtures": [],
    }

    findings = evaluate(context)

    ids = _finding_ids(findings)
    assert "kg410_sys1_temp" not in ids
    assert "kg410_sys1_temp_missing" in ids


def test_low_hot_water_temperature_triggers_temp_finding() -> None:
    context: Dict[str, object] = {
        "systems": [
            {
                "id": "sys1",
                "hot_water_temp": 45.0,
            }
        ],
        "fixtures": [],
    }

    findings = evaluate(context)

    ids = _finding_ids(findings)
    assert "kg410_sys1_temp" in ids
    assert "kg410_sys1_temp_missing" not in ids
