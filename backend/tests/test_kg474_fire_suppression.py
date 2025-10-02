from __future__ import annotations

from typing import Dict, Iterable

from backend.agent_core.checks.kg474_fire_suppression import evaluate


def base_context() -> Dict[str, object]:
    return {
        "sprinkler": [
            {
                "name": "Zone A",
                "gefährdungsklasse": "hoch",
                "berechnete_dichte": 5.0,
                "loescheinwirkzeit": 35.0,
                "pumpenredundanz": True,
            }
        ],
        "hydranten": [
            {
                "name": "Hydrant 1",
                "volumenstrom": 250.0,
                "druck": 0.5,
            }
        ],
        "wasserversorgung": {"dauer": 40.0},
    }


def finding_ids(findings: Iterable[object]) -> set[str]:
    return {finding.id for finding in findings}  # type: ignore[attr-defined]


def test_requires_any_system_negative():
    context: Dict[str, object] = {"sprinkler": [], "hydranten": []}

    findings = evaluate(context)

    assert finding_ids(findings) == {"kg474_0001"}


def test_requires_any_system_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_0001" not in finding_ids(findings)


def test_sprinkler_density_negative():
    context = base_context()
    context["sprinkler"][0]["berechnete_dichte"] = 1.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_Zone A_dichte" in finding_ids(findings)


def test_sprinkler_density_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_Zone A_dichte" not in finding_ids(findings)


def test_sprinkler_duration_negative():
    context = base_context()
    context["sprinkler"][0]["loescheinwirkzeit"] = 20.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_Zone A_dauer" in finding_ids(findings)


def test_sprinkler_duration_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_Zone A_dauer" not in finding_ids(findings)


def test_pump_redundancy_negative():
    context = base_context()
    context["sprinkler"][0]["pumpenredundanz"] = False  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_Zone A_pumpe" in finding_ids(findings)


def test_pump_redundancy_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_Zone A_pumpe" not in finding_ids(findings)


def test_hydrant_flow_negative():
    context = base_context()
    context["hydranten"][0]["volumenstrom"] = 150.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_Hydrant 1_strom" in finding_ids(findings)


def test_hydrant_flow_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_Hydrant 1_strom" not in finding_ids(findings)


def test_hydrant_pressure_negative():
    context = base_context()
    context["hydranten"][0]["druck"] = 0.3  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_Hydrant 1_druck" in finding_ids(findings)


def test_hydrant_pressure_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_Hydrant 1_druck" not in finding_ids(findings)


def test_global_water_supply_negative():
    context = base_context()
    context["wasserversorgung"]["dauer"] = 20.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg474_wasserspeicher" in finding_ids(findings)


def test_global_water_supply_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg474_wasserspeicher" not in finding_ids(findings)
