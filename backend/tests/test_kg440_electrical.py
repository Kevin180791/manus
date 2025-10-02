from __future__ import annotations

from typing import Dict, Iterable

from backend.agent_core.checks.kg440_electrical import evaluate


def base_context() -> Dict[str, object]:
    return {
        "projekt_typ": "buerogebaeude",
        "stromkreise": [
            {
                "name": "SK1",
                "voltage_drop_percent": 2.0,
                "diversity_factor": 0.8,
                "reserve_percent": 15.0,
            }
        ],
        "beleuchtung": [
            {
                "id": "B1",
                "name": "Open Space",
                "flaeche": 100.0,
                "leistung": 1000.0,
                "nutzung": "buerogebaeude",
            }
        ],
        "verbraucher": [
            {
                "bereich": "rechenzentrum",
                "usv_erforderlich": True,
            },
            {
                "bereich": "operationssaal",
                "usv_erforderlich": True,
            },
        ],
        "notbeleuchtung": {"nachweis": True},
    }


def finding_ids(findings: Iterable[object]) -> set[str]:
    return {finding.id for finding in findings}  # type: ignore[attr-defined]


def test_requires_circuit_data_negative():
    context = base_context()
    context["stromkreise"] = []  # type: ignore[index]

    findings = evaluate(context)

    assert finding_ids(findings) == {"kg440_0001"}


def test_requires_circuit_data_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_0001" not in finding_ids(findings)


def test_voltage_drop_limit_negative():
    context = base_context()
    context["stromkreise"][0]["voltage_drop_percent"] = 4.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg440_SK1_spannung" in finding_ids(findings)


def test_voltage_drop_limit_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_SK1_spannung" not in finding_ids(findings)


def test_diversity_factor_range_negative():
    context = base_context()
    context["stromkreise"][0]["diversity_factor"] = 0.95  # type: ignore[index]

    findings = evaluate(context)

    assert "kg440_SK1_diversity" in finding_ids(findings)


def test_diversity_factor_range_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_SK1_diversity" not in finding_ids(findings)


def test_reserve_limit_negative():
    context = base_context()
    context["stromkreise"][0]["reserve_percent"] = 5.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg440_SK1_reserve" in finding_ids(findings)


def test_reserve_limit_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_SK1_reserve" not in finding_ids(findings)


def test_lighting_density_negative():
    context = base_context()
    context["beleuchtung"][0]["leistung"] = 1500.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg440_beleuchtung_B1" in finding_ids(findings)


def test_lighting_density_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_beleuchtung_B1" not in finding_ids(findings)


def test_emergency_lighting_required_negative():
    context = base_context()
    context.pop("notbeleuchtung")

    findings = evaluate(context)

    assert "kg440_notbeleuchtung" in finding_ids(findings)


def test_emergency_lighting_required_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg440_notbeleuchtung" not in finding_ids(findings)


def test_ups_requirement_negative():
    context = base_context()
    context["verbraucher"] = []  # type: ignore[index]

    findings = evaluate(context)

    ids = finding_ids(findings)
    assert {"kg440_usv_rechenzentrum", "kg440_usv_operationssaal"} <= ids


def test_ups_requirement_positive():
    context = base_context()

    findings = evaluate(context)

    ids = finding_ids(findings)
    assert "kg440_usv_rechenzentrum" not in ids
    assert "kg440_usv_operationssaal" not in ids
