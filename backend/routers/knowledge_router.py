"""API endpoints for querying project knowledge chunks."""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import KnowledgeChunk, KnowledgeChunkTypeEnum
from backend.services.anonymization import TextSanitizer


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/projects", tags=["Knowledge"])


class KnowledgeChunkResponse(BaseModel):
    chunk_id: str
    dokument_id: str
    chunk_type: str
    chunk_text: str
    score: float
    source_reference: Optional[dict]


class KnowledgeSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    chunk_types: Optional[List[str]] = None


class KnowledgeSearchResponse(BaseModel):
    projekt_id: str
    query: str
    results: List[KnowledgeChunkResponse]


@router.get("/{projekt_id}/knowledge/chunks", response_model=List[KnowledgeChunkResponse])
def list_chunks(
    projekt_id: str,
    chunk_type: Optional[str] = Query(default=None, alias="type"),
    db: Session = Depends(get_db),
):
    query = db.query(KnowledgeChunk).filter(KnowledgeChunk.projekt_id == projekt_id)

    if chunk_type:
        try:
            chunk_type_enum = KnowledgeChunkTypeEnum(chunk_type)
        except ValueError as exc:  # pragma: no cover - validation
            raise HTTPException(status_code=400, detail=f"Ungültiger Chunk-Typ: {chunk_type}") from exc
        query = query.filter(KnowledgeChunk.chunk_type == chunk_type_enum)

    sanitizer = TextSanitizer()
    results = []

    for chunk in query.order_by(KnowledgeChunk.chunk_index.asc()).limit(200):
        sanitized = sanitizer.sanitize(chunk.chunk_text)
        results.append(
            KnowledgeChunkResponse(
                chunk_id=chunk.id,
                dokument_id=chunk.dokument_id,
                chunk_type=chunk.chunk_type.value,
                chunk_text=sanitized.sanitized_text,
                score=1.0,
                source_reference=chunk.source_reference or {},
            )
        )

    return results


@router.post("/{projekt_id}/knowledge/search", response_model=KnowledgeSearchResponse)
def search_chunks(
    projekt_id: str,
    request: KnowledgeSearchRequest,
    db: Session = Depends(get_db),
):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Suchanfrage darf nicht leer sein.")

    allowed_types: Optional[List[KnowledgeChunkTypeEnum]] = None
    if request.chunk_types:
        allowed_types = []
        for chunk_type in request.chunk_types:
            try:
                allowed_types.append(KnowledgeChunkTypeEnum(chunk_type))
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=f"Ungültiger Chunk-Typ: {chunk_type}") from exc

    query = db.query(KnowledgeChunk).filter(KnowledgeChunk.projekt_id == projekt_id)
    if allowed_types:
        query = query.filter(KnowledgeChunk.chunk_type.in_(allowed_types))

    chunks = query.all()
    sanitizer = TextSanitizer()

    scored = []
    needle = request.query.lower()
    for chunk in chunks:
        haystack = (chunk.chunk_text or "").lower()
        if not haystack:
            continue
        occurrences = haystack.count(needle)
        if occurrences == 0 and needle not in haystack:
            continue
        score = occurrences if occurrences > 0 else 0.5
        sanitized = sanitizer.sanitize(chunk.chunk_text)
        scored.append(
            KnowledgeChunkResponse(
                chunk_id=chunk.id,
                dokument_id=chunk.dokument_id,
                chunk_type=chunk.chunk_type.value,
                chunk_text=sanitized.sanitized_text,
                score=score,
                source_reference=chunk.source_reference or {},
            )
        )

    scored.sort(key=lambda item: item.score, reverse=True)
    limited = scored[: max(request.top_k, 1)]

    logger.info("Knowledge-Suche für Projekt %s mit %s Ergebnissen", projekt_id, len(limited))

    return KnowledgeSearchResponse(projekt_id=projekt_id, query=request.query, results=limited)
