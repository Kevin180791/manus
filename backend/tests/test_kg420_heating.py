from __future__ import annotations

from typing import Dict, Iterable

from backend.agent_core.checks.kg420_heating import evaluate


def base_context() -> Dict[str, object]:
    return {
        "projekt_typ": "buerogebaeude",
        "heating_load": {
            "rooms": [
                {
                    "name": "Raum A",
                    "heizlast": 40.0,
                    "spezifische_heizlast": 60.0,
                }
            ],
            "total": 40.0,
        },
        "system": {
            "supply_temperature": 60.0,
            "return_temperature": 45.0,
            "pressure": 2.0,
            "hydraulic_balancing": True,
            "components": [
                "wärmeerzeuger",
                "umwälzpumpe",
                "ausdehnungsgefäß",
                "sicherheitsventil",
                "manometer",
            ],
        },
        "generator": {
            "leistung": 50.0,
            "typ": "gaskessel",
            "wirkungsgrad": 0.95,
        },
    }


def finding_ids(findings: Iterable[object]) -> set[str]:
    return {finding.id for finding in findings}  # type: ignore[attr-defined]


def test_requires_room_data_negative():
    context = base_context()
    context["heating_load"]["rooms"] = []  # type: ignore[index]

    findings = evaluate(context)

    assert finding_ids(findings) == {"kg420_0001"}


def test_requires_room_data_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_0001" not in finding_ids(findings)


def test_specific_load_too_high_negative():
    context = base_context()
    context["heating_load"]["rooms"][0]["spezifische_heizlast"] = 120.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_room_Raum A_hoch" in finding_ids(findings)


def test_specific_load_too_high_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_room_Raum A_hoch" not in finding_ids(findings)


def test_specific_load_too_low_negative():
    context = base_context()
    context["heating_load"]["rooms"][0]["spezifische_heizlast"] = 20.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_room_Raum A_niedrig" in finding_ids(findings)


def test_specific_load_too_low_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_room_Raum A_niedrig" not in finding_ids(findings)


def test_supply_temperature_limit_negative():
    context = base_context()
    context["system"]["supply_temperature"] = 75.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_vorlauf_001" in finding_ids(findings)


def test_supply_temperature_limit_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_vorlauf_001" not in finding_ids(findings)


def test_return_temperature_limit_negative():
    context = base_context()
    context["system"]["return_temperature"] = 60.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_ruecklauf_001" in finding_ids(findings)


def test_return_temperature_limit_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_ruecklauf_001" not in finding_ids(findings)


def test_delta_t_too_small_negative():
    context = base_context()
    context["system"]["supply_temperature"] = 50.0  # type: ignore[index]
    context["system"]["return_temperature"] = 47.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_deltaT_001" in finding_ids(findings)


def test_delta_t_too_small_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_deltaT_001" not in finding_ids(findings)


def test_pressure_minimum_negative():
    context = base_context()
    context["system"]["pressure"] = 1.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_druck_min" in finding_ids(findings)


def test_pressure_minimum_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_druck_min" not in finding_ids(findings)


def test_pressure_maximum_negative():
    context = base_context()
    context["system"]["pressure"] = 3.5  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_druck_max" in finding_ids(findings)


def test_pressure_maximum_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_druck_max" not in finding_ids(findings)


def test_requires_hydraulic_balancing_negative():
    context = base_context()
    context["system"]["hydraulic_balancing"] = False  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_hydraulik_001" in finding_ids(findings)


def test_requires_hydraulic_balancing_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_hydraulik_001" not in finding_ids(findings)


def test_required_components_negative():
    context = base_context()
    context["system"]["components"] = ["wärmeerzeuger", "umwälzpumpe"]  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_komponenten_001" in finding_ids(findings)


def test_required_components_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_komponenten_001" not in finding_ids(findings)


def test_generator_margin_negative():
    context = base_context()
    context["generator"]["leistung"] = 40.0  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_erzeuger_001" in finding_ids(findings)


def test_generator_margin_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_erzeuger_001" not in finding_ids(findings)


def test_heat_pump_cop_negative():
    context = base_context()
    context["generator"].update({"typ": "waermepumpe", "cop": 3.0})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_wp_001" in finding_ids(findings)


def test_heat_pump_cop_positive():
    context = base_context()
    context["generator"].update({"typ": "waermepumpe", "cop": 3.6})  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_wp_001" not in finding_ids(findings)


def test_boiler_efficiency_negative():
    context = base_context()
    context["generator"]["wirkungsgrad"] = 0.9  # type: ignore[index]

    findings = evaluate(context)

    assert "kg420_kessel_001" in finding_ids(findings)


def test_boiler_efficiency_positive():
    context = base_context()

    findings = evaluate(context)

    assert "kg420_kessel_001" not in finding_ids(findings)
