from copy import deepcopy

import pytest

from backend.agent_core.checks.kg474_fire_suppression import evaluate


BASE_CONTEXT = {
    "sprinkler": [
        {
            "name": "Zone A",
            "gefährdungsklasse": "hoch",
            "berechnete_dichte": 5.5,
            "loescheinwirkzeit": 40.0,
            "pumpenredundanz": True,
        }
    ],
    "hydranten": [],
    "wasserversorgung": {"dauer": 40.0},
}


def build_context(**overrides):
    context = deepcopy(BASE_CONTEXT)
    for key, value in overrides.items():
        context[key] = value
    return context


def build_zone(**overrides):
    zone = deepcopy(BASE_CONTEXT["sprinkler"][0])
    zone.update(overrides)
    return zone


@pytest.mark.parametrize(
    "zone_overrides, expected_ids",
    [
        ({}, []),
        (
            {
                "berechnete_dichte": 4.0,
            },
            ["kg474_Zone A_dichte"],
        ),
    ],
)
def test_sprinkler_density(zone_overrides, expected_ids):
    sprinkler = [build_zone(**zone_overrides)]
    context = build_context(sprinkler=sprinkler)

    findings = evaluate(context)

    assert {finding.id for finding in findings} == set(expected_ids)
