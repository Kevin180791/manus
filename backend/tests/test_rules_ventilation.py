from copy import deepcopy

import pytest

from backend.agent_core.checks.kg430_ventilation import evaluate


BASE_CONTEXT = {
    "projekt_typ": "buerogebaeude",
    "rooms": [
        {
            "name": "Konferenz",
            "zuluft": 360.0,
            "abluft": 360.0,
            "persons": 10,
            "air_change": 3.0,
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


def build_context(**overrides):
    context = deepcopy(BASE_CONTEXT)
    for key, value in overrides.items():
        context[key] = value
    return context


def build_room(**overrides):
    room = deepcopy(BASE_CONTEXT["rooms"][0])
    room.update(overrides)
    return room


@pytest.mark.parametrize(
    "room_overrides, expected_ids",
    [
        ({}, []),
        (
            {
                "zuluft": 100.0,
                "abluft": 100.0,
                "persons": 10,
                "co2": 800.0,
            },
            ["kg430_Konferenz_luftmenge"],
        ),
    ],
)
def test_outdoor_air_per_person(room_overrides, expected_ids):
    rooms = [build_room(**room_overrides)]
    context = build_context(rooms=rooms)

    findings = evaluate(context)

    assert {finding.id for finding in findings} == set(expected_ids)
