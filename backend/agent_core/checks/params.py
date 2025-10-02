"""Parameterkatalog für die gewerkespezifischen Prüfregeln."""
from __future__ import annotations

from typing import Dict, MutableMapping


PARAMS: Dict[str, MutableMapping[str, object]] = {
    "kg410": {
        "hot_water_temp_min": 55.0,
        "circulation_temp_min": 50.0,
        "max_stagnation_hours": 72,
        "max_velocity": {
            "kaltwasser": 2.0,
            "warmwasser": 1.5,
            "zirkulation": 0.8,
            "abwasser": 2.5,
        },
        "material_blacklist": {
            "warmwasser": {"verzinkter Stahl"},
        },
        "backflow_required_for": {"gewerblich", "labor", "krankenhaus"},
        "insulation_min": {
            "warmwasser": 13,
            "zirkulation": 20,
        },
    },
    "kg420": {
        "specific_load": {
            "wohngebaeude": {"min": 30.0, "max": 100.0},
            "buerogebaeude": {"min": 40.0, "max": 95.0},
            "schule": {"min": 35.0, "max": 110.0},
            "krankenhaus": {"min": 45.0, "max": 130.0},
            "industriebau": {"min": 35.0, "max": 160.0},
        },
        "supply_temp_max": 70.0,
        "return_temp_max": 55.0,
        "pressure_min": 1.5,
        "pressure_max": 3.0,
        "hydraulic_balance_required": True,
        "generator_margin": 1.15,
        "cop_min": 3.5,
        "boiler_efficiency_min": 0.92,
        "delta_t_tolerance": 5.0,
    },
    "kg430": {
        "air_change": {
            "wohngebaeude": {"min": 0.5, "max": 3.0},
            "buerogebaeude": {"min": 0.7, "max": 6.0},
            "schule": {"min": 3.0, "max": 6.0},
            "krankenhaus": {"min": 6.0, "max": 15.0},
            "industriebau": {"min": 2.0, "max": 20.0},
        },
        "outdoor_air_per_person": {
            "wohngebaeude": 30.0,
            "buerogebaeude": 36.0,
            "schule": 30.0,
            "krankenhaus": 40.0,
            "industriebau": 25.0,
        },
        "co2_limit": 1000,
        "balance_tolerance": 0.1,
        "wrg_required": True,
        "wrg_eta_min": 0.75,
    },
    "kg440": {
        "voltage_drop_max_percent": 3.0,
        "lighting_power_density": {
            "buerogebaeude": 12.0,
            "schule": 15.0,
            "industrie": 18.0,
        },
        "emergency_lighting_required": {"buerogebaeude", "schule", "krankenhaus"},
        "ups_required_for": {"rechenzentrum", "operationssaal"},
        "diversity_factor_range": (0.6, 0.9),
    },
    "kg450": {
        "redundant_paths_required": {"krankenhaus", "rechenzentrum"},
        "fire_alarm_standard": "DIN 14675",
        "data_rack_fill_max": 0.8,
        "cable_shielding_required": {"labor", "industrie"},
    },
    "kg474": {
        "sprinkler_density": {
            "hoch": 5.0,
            "normal": 2.5,
            "niedrig": 1.5,
        },
        "water_supply_duration_min": 30,
        "pump_redundancy_required": {"hoch", "krankenhaus"},
    },
    "kg480": {
        "bacs_classes": {
            "kg420": "A",
            "kg430": "A",
            "kg440": "B",
            "kg450": "B",
        },
        "point_density_min": {
            "hvac": 1.5,
            "lighting": 1.0,
            "metering": 0.5,
        },
        "trend_storage_days_min": 30,
        "alarm_response_time_max": 300,
    },
}


__all__ = ["PARAMS"]
