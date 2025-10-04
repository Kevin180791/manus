import pytest

from backend.services.knowledge_service import KnowledgeBuilder


class DummySession:
    def add(self, obj):  # pragma: no cover - required by interface
        pass


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
