from copy import deepcopy

import pytest

from backend.agent_core.checks.kg480_bacs import evaluate


BASE_CONTEXT = {
    "systeme": [
        {"gewerk": "kg420", "klasse": "A"},
        {"gewerk": "kg440", "klasse": "B"},
    ],
    "messstellen": [
        {"kategorie": "hvac", "flaeche": 200.0, "anzahl": 4},
        {"kategorie": "lighting", "flaeche": 200.0, "anzahl": 3},
    ],
    "trendaufzeichnung_tage": 45.0,
    "alarmreaktionszeit": 200.0,
}


def build_context(**overrides):
    context = deepcopy(BASE_CONTEXT)
    for key, value in overrides.items():
        context[key] = value
    return context


@pytest.mark.parametrize(
    "trend_days, expected_ids",
    [
        (45.0, []),
        (14.0, ["kg480_trendaufzeichnung"]),
    ],
)
def test_trend_storage_requirement(trend_days, expected_ids):
    context = build_context(trendaufzeichnung_tage=trend_days)

    findings = evaluate(context)

    assert {finding.id for finding in findings} == set(expected_ids)
