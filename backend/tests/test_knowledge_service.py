import sys
from types import SimpleNamespace

import pytest

from backend.core.config import get_settings
from backend.services.knowledge_service import KnowledgeBuilder
from backend.services.rag_service import EmbeddingService, EmbeddingServiceError


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def stub_models(monkeypatch):
    class FakeChunk:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
            self.id = kwargs.get("id", f"chunk-{kwargs.get('chunk_index', 0)}")

    fake_enum = SimpleNamespace(
        TEXT=SimpleNamespace(value="text"),
        TABLE=SimpleNamespace(value="table"),
    )

    stub_module = SimpleNamespace(KnowledgeChunk=FakeChunk, KnowledgeChunkTypeEnum=fake_enum)
    monkeypatch.setitem(sys.modules, "backend.models", stub_module)
    yield stub_module


class DummySession:
    def __init__(self) -> None:
        self.added = []
        self.flushed = False

    def add(self, obj):  # pragma: no cover - simple container
        self.added.append(obj)

    def flush(self):  # pragma: no cover - simple container
        self.flushed = True


class FakeEmbeddingService:
    def __init__(self) -> None:
        self.calls = []

    def generate(self, text: str):
        self.calls.append(text)
        return SimpleNamespace(vector=[0.1, 0.2], model="fake", dimensions=2)


@pytest.mark.parametrize(
    "text,chunk_size,overlap,expected",
    [
        (
            "abcdefghijklmnop",
            6,
            2,
            ["abcdef", "efghij", "ijklmn", "mnop"],
        ),
        (
            "kurz",
            10,
            2,
            ["kurz"],
        ),
    ],
)
def test_split_text_respects_overlap(text, chunk_size, overlap, expected):
    builder = KnowledgeBuilder(
        db=DummySession(),
        embedding_service=None,
        max_chunk_chars=chunk_size,
        chunk_overlap=overlap,
    )

    assert builder._split_text(text) == expected


def test_split_text_rejects_invalid_overlap():
    builder = KnowledgeBuilder(
        db=DummySession(),
        embedding_service=None,
        max_chunk_chars=5,
        chunk_overlap=5,
    )

    with pytest.raises(ValueError):
        builder._split_text("abcdef")


def test_persist_chunks_flushes_and_returns(stub_models):
    session = DummySession()
    builder = KnowledgeBuilder(db=session, embedding_service=FakeEmbeddingService())

    dokument = SimpleNamespace(id="doc", projekt_id="proj")
    chunk = builder._create_chunk(
        dokument=dokument,
        chunk_index=0,
        chunk_type=stub_models.KnowledgeChunkTypeEnum.TEXT,
        chunk_text="hello",
        source_reference={"source": "test"},
    )

    persisted = builder.persist_chunks([chunk])

    assert session.flushed is True
    assert persisted[0].embedding_vector is not None


def test_embedding_service_respects_test_mode(monkeypatch):
    monkeypatch.setenv("TEST_MODE", "1")
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    service = EmbeddingService.from_env()
    assert service is not None

    response = service.generate("Test eingabe")
    assert response.model == "test/fake"
    assert len(response.vector) == 8

    monkeypatch.delenv("TEST_MODE", raising=False)


def test_embedding_service_without_backend(monkeypatch):
    monkeypatch.delenv("TEST_MODE", raising=False)
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    assert EmbeddingService.from_env() is None

    service = EmbeddingService()

    with pytest.raises(EmbeddingServiceError):
        service.generate("text")
