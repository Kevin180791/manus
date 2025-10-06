import sys
import types
from enum import Enum
from types import SimpleNamespace
from unittest.mock import MagicMock


# Provide a lightweight SQLAlchemy stub so that knowledge_service can be imported
sqlalchemy_module = types.ModuleType("sqlalchemy")
sqlalchemy_orm_module = types.ModuleType("sqlalchemy.orm")


class _StubSession:  # pragma: no cover - typing placeholder
    pass


sqlalchemy_orm_module.Session = _StubSession
sqlalchemy_module.orm = sqlalchemy_orm_module
sys.modules.setdefault("sqlalchemy", sqlalchemy_module)
sys.modules.setdefault("sqlalchemy.orm", sqlalchemy_orm_module)

backend_models_module = types.ModuleType("backend.models")


class _StubKnowledgeChunkTypeEnum(Enum):  # pragma: no cover - typing placeholder
    TEXT = "text"
    TABLE = "table"
    METRIC = "metric"


class _StubKnowledgeChunk:  # pragma: no cover - lightweight data container
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


backend_models_module.Dokument = type("Dokument", (), {})
backend_models_module.DokumentMetadata = type("DokumentMetadata", (), {})
backend_models_module.KnowledgeChunk = _StubKnowledgeChunk
backend_models_module.KnowledgeChunkTypeEnum = _StubKnowledgeChunkTypeEnum

sys.modules.setdefault("backend.models", backend_models_module)

backend_services_rag_module = types.ModuleType("backend.services.rag_service")


class _StubEmbeddingServiceError(Exception):  # pragma: no cover - simple stub
    pass


class _StubEmbeddingService:  # pragma: no cover - minimal API for tests
    def __init__(self, *args, **kwargs):
        pass

    @classmethod
    def from_env(cls):
        return cls()

    def generate(self, text: str):
        return SimpleNamespace(vector=[0.0], model="dummy")


def _stub_serialize_embedding(vector):  # pragma: no cover - passthrough helper
    return vector


backend_services_rag_module.EmbeddingService = _StubEmbeddingService
backend_services_rag_module.EmbeddingServiceError = _StubEmbeddingServiceError
backend_services_rag_module.serialize_embedding = _stub_serialize_embedding

sys.modules.setdefault("backend.services.rag_service", backend_services_rag_module)

from backend.services.knowledge_service import KnowledgeBuilder


class DummyEmbeddingService:
    def generate(self, text: str):  # pragma: no cover - simple stub
        return SimpleNamespace(vector=[0.0], model="dummy")


def test_build_chunks_handles_list_based_tables():
    builder = KnowledgeBuilder(db=MagicMock(), embedding_service=DummyEmbeddingService())

    dokument = SimpleNamespace(id="doc-1", projekt_id="proj-1")
    metadata = SimpleNamespace(
        extrahierter_text="",
        tabellen_daten=[
            [
                ["Raum", "Wert"],
                ["Bad", "12"],
                [],
                None,
                ["", ""],
                ["Wohnzimmer", "30"],
                "malformed",
                ["Küche", None],
            ]
        ],
    )

    chunks = builder.build_chunks(dokument, metadata)

    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.chunk_type.value == "table"
    assert chunk.chunk_text.splitlines() == [
        "Raum | Wert",
        "Bad | 12",
        "Wohnzimmer | 30",
        "Küche |",
    ]
    assert chunk.source_reference["headers"] == ["Raum", "Wert"]
