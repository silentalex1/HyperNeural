from __future__ import annotations

from inferforge.storage.base import StorageBackend
from inferforge.storage.s3_backend import S3StorageBackend

__all__ = ["StorageBackend", "S3StorageBackend"]
