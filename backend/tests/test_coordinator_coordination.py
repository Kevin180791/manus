import asyncio
from datetime import datetime, timezone

from backend.agent_core.tga_coordinator import (
    Document,
    GewerkeType,
    LeistungsPhase,
    ProjectType,
    PruefAuftrag,
    TGACoordinator,
)


def _run(coro):
    return asyncio.run(coro)


def _auftrag(dokumente):
    return PruefAuftrag(
        id="auftrag-test",
        projekt_name="Testprojekt",
        projekt_typ=ProjectType.OFFICE,
        leistungsphase=LeistungsPhase.LP3,
        dokumente=dokumente,
        erstellt_am=datetime.now(timezone.utc),
    )


def _create_document(**kwargs):
    defaults = dict(
        file_path="",
        document_type="plan",
        leistungsphase=LeistungsPhase.LP3,
        plan_nummer="PLAN-01",
        revision="A",
    )
    defaults.update(kwargs)
    return Document(**defaults)  # type: ignore[arg-type]


def test_pruefe_kollisionen_detects_overlap():
    coordinator = TGACoordinator()

    ventilation = _create_document(
        id="doc_lueftung",
        filename="Lueftung.pdf",
        gewerk=GewerkeType.KG430_LUEFTUNG,
        metadaten={
            "geometrie": {
                "elemente": [
                    {
                        "id": "L1",
                        "bbox": {"x": 0.0, "y": 0.0, "z": 2.6, "width": 1.5, "depth": 1.0, "height": 0.4},
                        "plan_ref": "LP-01",
                        "level": "EG",
                    }
                ]
            }
        },
    )

    electrical = _create_document(
        id="doc_elektro",
        filename="Elektro.pdf",
        gewerk=GewerkeType.KG440_ELEKTRO,
        metadaten={
            "geometrie": {
                "elemente": [
                    {
                        "id": "E1",
                        "bbox": {
                            "x": 0.8,
                            "y": 0.5,
                            "z": 2.5,
                            "width": 1.0,
                            "depth": 0.8,
                            "height": 0.3,
                        },
                        "plan_ref": "EP-01",
                        "level": "EG",
                    }
                ]
            }
        },
    )

    auftrag = _auftrag([ventilation, electrical])

    findings = _run(coordinator._pruefe_kollisionen(auftrag))

    assert len(findings) == 1
    finding = findings[0]
    assert finding.document_id == ventilation.id
    assert "L1" in finding.beschreibung
    assert "E1" in finding.beschreibung
    assert finding.plan_referenz == "LP-01 / EP-01"


def test_pruefe_kollisionen_no_overlap():
    coordinator = TGACoordinator()

    ventilation = _create_document(
        id="doc_lueftung",
        filename="Lueftung.pdf",
        gewerk=GewerkeType.KG430_LUEFTUNG,
        metadaten={
            "geometrie": {
                "elemente": [
                    {
                        "id": "L1",
                        "bbox": {"x": 0.0, "y": 0.0, "width": 1.0, "depth": 1.0},
                        "plan_ref": "LP-01",
                    }
                ]
            }
        },
    )

    electrical = _create_document(
        id="doc_elektro",
        filename="Elektro.pdf",
        gewerk=GewerkeType.KG440_ELEKTRO,
        metadaten={
            "geometrie": {
                "elemente": [
                    {
                        "id": "E1",
                        "bbox": {"x": 2.0, "y": 2.0, "width": 0.5, "depth": 0.5},
                        "plan_ref": "EP-01",
                    }
                ]
            }
        },
    )

    auftrag = _auftrag([ventilation, electrical])

    findings = _run(coordinator._pruefe_kollisionen(auftrag))

    assert findings == []


def test_pruefe_schnittstellen_detects_power_mismatch():
    coordinator = TGACoordinator()

    heating = _create_document(
        id="doc_heizung",
        filename="Heizung.pdf",
        gewerk=GewerkeType.KG420_HEIZUNG,
        metadaten={
            "schnittstellen": {
                "elektro": [
                    {
                        "referenz": "WP1",
                        "leistung_kw": 20.0,
                        "versorgung": "SK5",
                        "plan_ref": "HP-01",
                    }
                ]
            }
        },
    )

    electrical = _create_document(
        id="doc_elektro",
        filename="Elektro.pdf",
        gewerk=GewerkeType.KG440_ELEKTRO,
        metadaten={
            "schnittstellen": {
                "versorgungen": [
                    {
                        "referenz": "SK5",
                        "kapazitaet_kw": 15.0,
                        "plan_ref": "EP-01",
                    }
                ]
            }
        },
    )

    auftrag = _auftrag([heating, electrical])

    findings = _run(coordinator._pruefe_schnittstellen(auftrag))

    assert len(findings) == 1
    finding = findings[0]
    assert "15.0" in finding.beschreibung
    assert "20.0" in finding.beschreibung
    assert finding.document_id == heating.id


def test_pruefe_schnittstellen_consistent():
    coordinator = TGACoordinator()

    heating = _create_document(
        id="doc_heizung",
        filename="Heizung.pdf",
        gewerk=GewerkeType.KG420_HEIZUNG,
        metadaten={
            "schnittstellen": {
                "elektro": [
                    {
                        "referenz": "WP1",
                        "leistung_kw": 18.0,
                        "versorgung": "SK5",
                        "plan_ref": "HP-01",
                    }
                ]
            }
        },
    )

    electrical = _create_document(
        id="doc_elektro",
        filename="Elektro.pdf",
        gewerk=GewerkeType.KG440_ELEKTRO,
        metadaten={
            "schnittstellen": {
                "versorgungen": [
                    {
                        "referenz": "SK5",
                        "kapazitaet_kw": 22.0,
                        "plan_ref": "EP-01",
                    }
                ]
            }
        },
    )

    auftrag = _auftrag([heating, electrical])

    findings = _run(coordinator._pruefe_schnittstellen(auftrag))

    assert findings == []


def test_pruefe_sud_planung_detects_missing_confirmation():
    coordinator = TGACoordinator()

    sanitary = _create_document(
        id="doc_sanitaer",
        filename="Sanitaer.pdf",
        gewerk=GewerkeType.KG410_SANITAER,
        metadaten={
            "sud": {
                "anforderungen": [
                    {
                        "id": "DW1",
                        "plan_ref": "SP-01",
                        "dimensionen": {"breite": 0.4, "hoehe": 0.4},
                        "lage": {"x": 4.0, "y": 2.0},
                    }
                ]
            }
        },
    )

    auftrag = _auftrag([sanitary])

    findings = _run(coordinator._pruefe_sud_planung(auftrag))

    assert len(findings) == 1
    finding = findings[0]
    assert finding.document_id == sanitary.id
    assert finding.prioritaet == "hoch"


def test_pruefe_sud_planung_matching_confirmation():
    coordinator = TGACoordinator()

    sanitary = _create_document(
        id="doc_sanitaer",
        filename="Sanitaer.pdf",
        gewerk=GewerkeType.KG410_SANITAER,
        metadaten={
            "sud": {
                "anforderungen": [
                    {
                        "id": "DW1",
                        "plan_ref": "SP-01",
                        "dimensionen": {"breite": 0.4, "hoehe": 0.4},
                        "lage": {"x": 4.0, "y": 2.0},
                    }
                ],
                "bestaetigt": [
                    {
                        "referenz": "DW1",
                        "plan_ref": "SUD-01",
                        "dimensionen": {"breite": 0.39, "hoehe": 0.41},
                        "lage": {"x": 4.05, "y": 2.05},
                    }
                ],
            }
        },
    )

    auftrag = _auftrag([sanitary])

    findings = _run(coordinator._pruefe_sud_planung(auftrag))

    assert findings == []

