import asyncio
from datetime import UTC, datetime

from backend.agent_core.tga_coordinator import (
    Document,
    GewerkeType,
    LeistungsPhase,
    ProjectType,
    PruefAuftrag,
    TGACoordinator,
)


def _build_auftrag(document: Document) -> PruefAuftrag:
    return PruefAuftrag(
        id="auftrag-1",
        projekt_name="Testprojekt",
        projekt_typ=ProjectType.RESIDENTIAL,
        leistungsphase=LeistungsPhase.LP3,
        dokumente=[document],
        erstellt_am=datetime.now(UTC),
    )


def test_vdi6026_legende_vollstaendig():
    coordinator = TGACoordinator()
    document = Document(
        id="doc-1",
        filename="plan1.pdf",
        file_path="tests/data/plan1.pdf",
        document_type="plan",
        gewerk=GewerkeType.KG410_SANITAER,
        leistungsphase=LeistungsPhase.LP3,
        metadaten={
            "legende": {
                "symbole": [
                    {"symbol": "KW", "beschreibung": "Kaltwasserleitung"},
                    {"symbol": "WW", "beschreibung": "Warmwasserleitung"},
                    {"symbol": "AW", "beschreibung": "Abwasser"},
                ]
            }
        },
    )

    auftrag = _build_auftrag(document)
    findings = asyncio.run(coordinator._pruefe_vdi_6026_konformitaet(document, auftrag))

    assert findings == []


def test_vdi6026_legende_fehlt_symbol():
    coordinator = TGACoordinator()
    document = Document(
        id="doc-2",
        filename="plan2.pdf",
        file_path="tests/data/plan2.pdf",
        document_type="plan",
        gewerk=GewerkeType.KG410_SANITAER,
        leistungsphase=LeistungsPhase.LP3,
        metadaten={
            "legende": {
                "symbole": [
                    {"symbol": "KW", "beschreibung": "Kaltwasserleitung"},
                ]
            }
        },
    )

    auftrag = _build_auftrag(document)
    findings = asyncio.run(coordinator._pruefe_vdi_6026_konformitaet(document, auftrag))

    assert len(findings) == 1
    assert findings[0].prioritaet == "mittel"
    assert "Warmwasser" in findings[0].beschreibung


def test_vdi6026_legende_nicht_verfuegbar():
    coordinator = TGACoordinator()
    document = Document(
        id="doc-3",
        filename="plan3.pdf",
        file_path="tests/data/plan3.pdf",
        document_type="plan",
        gewerk=GewerkeType.KG410_SANITAER,
        leistungsphase=LeistungsPhase.LP3,
        metadaten={},
    )

    auftrag = _build_auftrag(document)
    findings = asyncio.run(coordinator._pruefe_vdi_6026_konformitaet(document, auftrag))

    assert len(findings) == 1
    assert findings[0].prioritaet == "hinweis"
    assert "Legendenprüfung" in findings[0].titel
