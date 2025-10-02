from copy import deepcopy

import pytest

from backend.agent_core.checks.kg420_heating import evaluate


BASE_CONTEXT = {
    "projekt_typ": "buerogebaeude",
    "heating_load": {
        "rooms": [
            {
                "name": "Raum 1",
                "heizlast": 30.0,
                "spezifische_heizlast": 50.0,
            }
        ],
        "total": 50.0,
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
        "leistung": 60.0,
        "typ": "gaskessel",
        "wirkungsgrad": 0.95,
    },
}


def build_context(**overrides):
    context = deepcopy(BASE_CONTEXT)
    for key, value in overrides.items():
        context[key] = value
    return context


@pytest.mark.parametrize(
    "generator_power, expected_ids",
    [
        (60.0, []),
        (50.0, ["kg420_erzeuger_001"]),
    ],
)
def test_generator_margin(generator_power, expected_ids):
    generator = deepcopy(BASE_CONTEXT["generator"])
    generator["leistung"] = generator_power
    context = build_context(generator=generator)

    findings = evaluate(context)

    assert {finding.id for finding in findings} == set(expected_ids)
