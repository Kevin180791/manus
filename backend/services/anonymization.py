"""Utility functions for sanitizing sensitive information before LLM calls."""

from __future__ import annotations

import dataclasses
import logging
import re
from typing import Dict, List


logger = logging.getLogger(__name__)


PERSON_PATTERN = re.compile(r"\b([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)\b")
COMPANY_PATTERN = re.compile(r"\b([A-ZÄÖÜ][\wäöüß\.-]*\s+(?:GmbH|AG|KG|UG|mbH))\b")
LOCATION_PATTERN = re.compile(r"\b(\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+)\b")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_PATTERN = re.compile(r"\b(?:\+?\d{2,3}[\s-]?)?(?:\d{2,4}[\s/-]?){2,4}\d\b")


@dataclasses.dataclass
class SanitizationResult:
    """Represents the outcome of a sanitization run."""

    sanitized_text: str
    replacements: Dict[str, str]
    detected_entities: List[str]
    compliance_ok: bool = True

    def restore(self, text: str) -> str:
        """Reapplies stored replacements to restore the original content."""

        restored = text
        for placeholder, original in self.replacements.items():
            restored = restored.replace(placeholder, original)
        return restored


class TextSanitizer:
    """Sanitizes free-form text by removing personal or company references."""

    def __init__(self) -> None:
        self._patterns: List[tuple[str, re.Pattern[str]]] = [
            ("PERSON", PERSON_PATTERN),
            ("COMPANY", COMPANY_PATTERN),
            ("LOCATION", LOCATION_PATTERN),
        ]

    def sanitize(self, text: str) -> SanitizationResult:
        """Sanitizes a text body and returns the sanitized representation."""

        replacements: Dict[str, str] = {}
        detected_entities: List[str] = []
        sanitized = text
        counter: Dict[str, int] = {key: 1 for key, _ in self._patterns}

        for key, pattern in self._patterns:
            sanitized = self._substitute_pattern(
                sanitized,
                pattern,
                key,
                counter,
                replacements,
                detected_entities,
            )

        # Emails and phone numbers are handled separately to avoid overlaps.
        sanitized = self._replace_with_placeholder(
            sanitized,
            EMAIL_PATTERN,
            "EMAIL",
            replacements,
            detected_entities,
        )
        sanitized = self._replace_with_placeholder(
            sanitized,
            PHONE_PATTERN,
            "PHONE",
            replacements,
            detected_entities,
        )

        compliance_ok = not (EMAIL_PATTERN.search(sanitized) or PHONE_PATTERN.search(sanitized))

        if not compliance_ok:
            logger.warning("Sanitizer konnte sensible Daten nicht vollständig entfernen.")

        return SanitizationResult(
            sanitized_text=sanitized,
            replacements=replacements,
            detected_entities=detected_entities,
            compliance_ok=compliance_ok,
        )

    def _substitute_pattern(
        self,
        text: str,
        pattern: re.Pattern[str],
        key: str,
        counter: Dict[str, int],
        replacements: Dict[str, str],
        detected_entities: List[str],
    ) -> str:
        """Replaces pattern occurrences with placeholders."""

        def _replace(match: re.Match[str]) -> str:
            original = match.group(0)
            placeholder = f"{key}_{counter[key]}"
            counter[key] += 1
            replacements[placeholder] = original
            detected_entities.append(f"{key}:{original}")
            return placeholder

        return pattern.sub(_replace, text)

    def _replace_with_placeholder(
        self,
        text: str,
        pattern: re.Pattern[str],
        key: str,
        replacements: Dict[str, str],
        detected_entities: List[str],
    ) -> str:
        """Utility to replace a pattern and record the replacements."""

        counter = 1

        def _replace(match: re.Match[str]) -> str:
            nonlocal counter
            original = match.group(0)
            placeholder = f"{key}_{counter}"
            counter += 1
            replacements[placeholder] = original
            detected_entities.append(f"{key}:{original}")
            return placeholder

        return pattern.sub(_replace, text)
