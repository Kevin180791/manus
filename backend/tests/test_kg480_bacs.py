from __future__ import annotations

from typing import Dict, Iterable

from backend.agent_core.checks.kg480_bacs import evaluate


def base_context() -> Dict[str, object]:
    return {
        "systeme": [
            {
                "gewerk": "kg420",
                "klasse": "A",
            }
        ],
        "messstellen": [
            {
                "kategorie": "hvac",
                "flaeche": 200.0,
                "anzahl": 4,
            }
        ],
        "trendaufzeichnung_tage": 45.0,
        "alarmreaktionszeit": 120.0,
    }


def finding_ids(findings: Iterable[object]) -> set[str]:
    return {finding.id for finding in findings}  # type: ignore[attr-defined]


def test_bacs_class_requirement_worse_triggers_finding():
    context = base_context()
    context["systeme"].append({"gewerk": "kg440", "klasse": "C"})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg480_kg440_klasse" in finding_ids(findings)


def test_bacs_class_requirement_better_no_finding():
    context = base_context()
    context["systeme"].append({"gewerk": "kg440", "klasse": "A"})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg480_kg440_klasse" not in finding_ids(findings)


def test_point_density_negative():
    context = base_context()
    context["messstellen"][0]["anzahl"] = 2  # type: ignore[index]

    findings = evaluate(context)

    assert "kg480_hvac_punkte" in finding_ids(findings)


def test_point_density_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg480_hvac_punkte" not in finding_ids(findings)


def test_trend_storage_negative():
    context = base_context()
    context["trendaufzeichnung_tage"] = 10.0

    findings = evaluate(context)

    assert "kg480_trendaufzeichnung" in finding_ids(findings)


def test_trend_storage_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg480_trendaufzeichnung" not in finding_ids(findings)


def test_alarm_response_negative():
    context = base_context()
    context["alarmreaktionszeit"] = 400.0

    findings = evaluate(context)

    assert "kg480_alarmzeit" in finding_ids(findings)


def test_alarm_response_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg480_alarmzeit" not in finding_ids(findings)
