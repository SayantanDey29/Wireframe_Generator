import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from typing import Optional
from urllib.parse import urlparse

from app.services.sitemap_parser import parse_sitemap_xml, sitemap_to_dict
from app.services.workflow import run_wireframe_generation
from app.services.job_store import (
    create_job, get_job, update_job, complete_job, fail_job, make_status_callback
)
from app.models.wireframe import GenerationStatus

router = APIRouter()


async def run_generation_task(job_id: str, xml_content: str, site_name: str, max_pages: int):
    """Background task to run wireframe generation."""
    try:
        await update_job(job_id, status="processing")
        
        # Parse sitemap
        pages = parse_sitemap_xml(xml_content)
        if not pages:
            await fail_job(job_id, "No pages found in sitemap XML")
            return
        
        await update_job(job_id, total_pages=min(len(pages), max_pages))
        
        # Run generation workflow
        callback = make_status_callback(job_id)
        project = await run_wireframe_generation(
            pages=pages,
            site_name=site_name,
            status_callback=callback,
            max_pages=max_pages
        )
        
        await complete_job(job_id, project)
        
    except Exception as e:
        await fail_job(job_id, str(e))


@router.post("/generate")
async def generate_wireframes(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    site_name: Optional[str] = Form(default="My Website"),
    max_pages: Optional[int] = Form(default=10)
):
    """Upload sitemap XML and start wireframe generation."""
    if not file.filename.endswith('.xml'):
        raise HTTPException(status_code=400, detail="Only XML files are accepted")
    
    content = await file.read()
    try:
        xml_content = content.decode('utf-8')
    except:
        xml_content = content.decode('latin-1')
    
    # Validate XML first
    try:
        pages = parse_sitemap_xml(xml_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not pages:
        raise HTTPException(status_code=400, detail="No URLs found in sitemap")
    
    # Cap max pages
    max_pages = min(max_pages, 20)
    
    job_id = create_job()
    background_tasks.add_task(
        run_generation_task, job_id, xml_content, site_name, max_pages
    )
    
    return {
        "job_id": job_id,
        "message": f"Generation started for {min(len(pages), max_pages)} pages",
        "total_pages_found": len(pages)
    }


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get the status of a generation job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/result/{job_id}")
async def get_result(job_id: str):
    """Get the completed wireframe project."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail=f"Job is {job.status}, not completed")
    return job.result


@router.post("/parse-preview")
async def parse_preview(file: UploadFile = File(...)):
    """Preview what pages will be extracted from a sitemap."""
    content = await file.read()
    try:
        xml_content = content.decode('utf-8')
    except:
        xml_content = content.decode('latin-1')
    
    try:
        pages = parse_sitemap_xml(xml_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "total_pages": len(pages),
        "pages": [
            {"url": p.url, "title": p.title, "depth": p.depth}
            for p in pages[:50]  # preview first 50
        ]
    }
