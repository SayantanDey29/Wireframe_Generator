import uuid
import asyncio
from typing import Dict, Optional
from app.models.wireframe import GenerationStatus, WireframeProject


# In-memory job store (use Redis for production)
_jobs: Dict[str, GenerationStatus] = {}
_locks: Dict[str, asyncio.Lock] = {}


def create_job() -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = GenerationStatus(
        job_id=job_id,
        status="pending",
        pages_done=0,
        total_pages=0
    )
    _locks[job_id] = asyncio.Lock()
    return job_id


def get_job(job_id: str) -> Optional[GenerationStatus]:
    return _jobs.get(job_id)


async def update_job(job_id: str, **kwargs):
    if job_id in _jobs:
        job = _jobs[job_id]
        for key, value in kwargs.items():
            setattr(job, key, value)


async def complete_job(job_id: str, result: WireframeProject):
    if job_id in _jobs:
        _jobs[job_id].status = "completed"
        _jobs[job_id].result = result
        _jobs[job_id].pages_done = result.total_pages


async def fail_job(job_id: str, error: str):
    if job_id in _jobs:
        _jobs[job_id].status = "failed"
        _jobs[job_id].error = error


def make_status_callback(job_id: str):
    async def callback(current_page: str, pages_done: int, total_pages: int):
        await update_job(
            job_id,
            status="processing",
            current_page=current_page,
            pages_done=pages_done,
            total_pages=total_pages
        )
    return callback
