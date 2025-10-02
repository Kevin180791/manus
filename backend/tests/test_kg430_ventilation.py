from __future__ import annotations

from typing import Dict, Iterable

from backend.agent_core.checks.kg430_ventilation import evaluate


def base_context() -> Dict[str, object]:
    return {
        "projekt_typ": "buerogebaeude",
        "rooms": [
            {
                "name": "Raum A",
                "zuluft": 360.0,
                "abluft": 360.0,
                "persons": 10,
                "air_change": 4.0,
                "co2": 800.0,
            }
        ],
        "anlagen": [
            {
                "id": "AHU1",
                "volumenstrom": 1400.0,
                "waermerueckgewinnung": True,
                "wrg_wirkungsgrad": 0.8,
                "filterklassen": ["F7"],
            }
        ],
    }


def finding_ids(findings: Iterable[object]) -> set[str]:
    return {finding.id for finding in findings}  # type: ignore[attr-defined]


def test_requires_room_data_negative():
    context = base_context()
    context["rooms"] = []  # type: ignore[index]

    findings = evaluate(context)

    assert finding_ids(findings) == {"kg430_0001"}


def test_requires_room_data_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_0001" not in finding_ids(findings)


def test_outdoor_air_volume_negative():
    context = base_context()
    context["rooms"][0]["zuluft"] = 200.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_Raum A_luftmenge" in finding_ids(findings)


def test_outdoor_air_volume_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_Raum A_luftmenge" not in finding_ids(findings)


def test_air_change_too_low_negative():
    context = base_context()
    context["rooms"][0]["air_change"] = 0.3  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_Raum A_wechsel_min" in finding_ids(findings)


def test_air_change_too_low_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_Raum A_wechsel_min" not in finding_ids(findings)


def test_air_change_too_high_negative():
    context = base_context()
    context["rooms"][0]["air_change"] = 7.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_Raum A_wechsel_max" in finding_ids(findings)


def test_air_change_too_high_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_Raum A_wechsel_max" not in finding_ids(findings)


def test_co2_limit_negative():
    context = base_context()
    context["rooms"][0]["co2"] = 1200.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_Raum A_co2" in finding_ids(findings)


def test_co2_limit_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_Raum A_co2" not in finding_ids(findings)


def test_supply_exhaust_balance_negative():
    context = base_context()
    context["rooms"][0]["zuluft"] = 500.0  # type: ignore[index]
    context["rooms"][0]["abluft"] = 300.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_balance_001" in finding_ids(findings)


def test_supply_exhaust_balance_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_balance_001" not in finding_ids(findings)


def test_wrg_required_negative():
    context = base_context()
    context["anlagen"][0].update({"volumenstrom": 2000.0, "waermerueckgewinnung": False})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_AHU1_wrg" in finding_ids(findings)


def test_wrg_required_positive():
    context = base_context()
    context["anlagen"][0].update({"volumenstrom": 2000.0, "waermerueckgewinnung": True})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_AHU1_wrg" not in finding_ids(findings)


def test_wrg_efficiency_negative():
    context = base_context()
    context["anlagen"][0]["wrg_wirkungsgrad"] = 0.6  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_AHU1_eta" in finding_ids(findings)


def test_wrg_efficiency_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_AHU1_eta" not in finding_ids(findings)


def test_filter_class_negative():
    context = base_context()
    context["anlagen"][0]["filterklassen"] = ["F5"]  # type: ignore[index]

    findings = evaluate(context)

    assert "kg430_AHU1_filter" in finding_ids(findings)


def test_filter_class_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg430_AHU1_filter" not in finding_ids(findings)
