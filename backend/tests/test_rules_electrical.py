from copy import deepcopy

import pytest

from backend.agent_core.checks.kg440_electrical import evaluate


BASE_CONTEXT = {
    "projekt_typ": "buerogebaeude",
    "stromkreise": [
        {
            "name": "HV1",
            "voltage_drop_percent": 2.5,
            "diversity_factor": 0.8,
            "reserve_percent": 15.0,
        }
    ],
    "beleuchtung": [
        {
            "id": "B1",
            "flaeche": 100.0,
            "leistung": 1000.0,
            "nutzung": "buerogebaeude",
        }
    ],
    "verbraucher": [
        {"bereich": "rechenzentrum", "usv_erforderlich": True},
        {"bereich": "operationssaal", "usv_erforderlich": True},
    ],
    "notbeleuchtung": True,
}


def build_context(**overrides):
    context = deepcopy(BASE_CONTEXT)
    for key, value in overrides.items():
        context[key] = value
    return context


def build_circuit(**overrides):
    circuit = deepcopy(BASE_CONTEXT["stromkreise"][0])
    circuit.update(overrides)
    return circuit


@pytest.mark.parametrize(
    "circuit_overrides, expected_ids",
    [
        ({}, []),
        (
            {
                "voltage_drop_percent": 3.5,
            },
            ["kg440_HV1_spannung"],
        ),
    ],
)
def test_voltage_drop_rule(circuit_overrides, expected_ids):
    circuits = [build_circuit(**circuit_overrides)]
    context = build_context(stromkreise=circuits)

    findings = evaluate(context)

    assert {finding.id for finding in findings} == set(expected_ids)
