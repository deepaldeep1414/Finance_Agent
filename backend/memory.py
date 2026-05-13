from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .schemas import MemoryProfile


class MemoryStore:
    def __init__(self) -> None:
        self._profiles: dict[str, MemoryProfile] = defaultdict(MemoryProfile)

    def get(self, key: str) -> MemoryProfile:
        return self._profiles[key]

    def update(self, key: str, profile: MemoryProfile) -> MemoryProfile:
        current = self._profiles[key]
        merged = current.model_copy(update=profile.model_dump(exclude_unset=True))
        if profile.priorities:
            seen: set[str] = set()
            combined: list[str] = []
            for p in (*current.priorities, *profile.priorities):
                if p in seen:
                    continue
                seen.add(p)
                combined.append(p)
            merged = merged.model_copy(update={"priorities": combined})
        self._profiles[key] = merged
        return merged

    def keys(self) -> Iterable[str]:
        return self._profiles.keys()
