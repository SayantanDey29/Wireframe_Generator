from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class SitemapPage(BaseModel):
    url: str
    title: str
    depth: int
    parent: Optional[str] = None
    children: List[str] = []


class WireframeSection(BaseModel):
    id: str
    type: str  # header, hero, nav, content, sidebar, footer, cta, form, grid, cards, etc.
    label: str
    description: str
    x: float
    y: float
    width: float
    height: float
    style: Dict[str, Any] = {}
    children: List["WireframeSection"] = []


class PageWireframe(BaseModel):
    page_id: str
    page_title: str
    page_url: str
    width: int = 1280
    height: int = 900
    sections: List[WireframeSection]
    layout_notes: str = ""


class WireframeProject(BaseModel):
    project_name: str
    total_pages: int
    pages: List[PageWireframe]
    sitemap_structure: Dict[str, Any] = {}


class GenerationStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    current_page: Optional[str] = None
    pages_done: int = 0
    total_pages: int = 0
    result: Optional[WireframeProject] = None
    error: Optional[str] = None
