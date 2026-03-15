import json
import re
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from app.core.config import get_settings
from app.models.wireframe import WireframeSection, PageWireframe

settings = get_settings()


def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        openai_api_key=settings.openrouter_api_key,
        openai_api_base=settings.openrouter_base_url,
        temperature=0.3,
        max_tokens=4000,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Wireframe Generator"
        }
    )


SYSTEM_PROMPT = """You are a world-class UI/UX design engine inspired by Figma and Elementor.
Your task is to generate fully detailed, professional wireframe layouts for web pages in JSON format.

CRITICAL: You MUST invent a unique visual design for every project. Do NOT use generic styles.
Every section MUST include a rich "style" object that defines its unique aesthetic.

A wireframe section structure:
{
  "id": "unique_id",
  "type": "section_type",
  "label": "Section Label",
  "description": "Functional description of the section",
  "x": 0,
  "y": 0,
  "width": 1280,
  "height": 400,
  "style": {
    "bg": "#HEX_COLOR",
    "textColor": "#HEX_COLOR",
    "accentColor": "#HEX_COLOR",
    "borderColor": "#HEX_COLOR",
    "borderRadius": 12,
    "padding": 32,
    "gap": 20,
    "fontFamily": "Font Name",
    "fontSize": 16,
    "fontWeight": "400"
  },
  "children": []
}

VISUAL DESIGN GUIDELINES:
- COLOR: Generate a cohesive color palette (Primary, Secondary, Accent, Neutral). Use vibrant, modern combinations. Experiment with Glassmorphism, Brutalism, or Minimalism.
- TYPOGRAPHY: Choose from "Inter", "Sora", "DM Mono", "Playfair Display", "Space Grotesk", "Outfit", "Plus Jakarta Sans".
- SPACING: Use consistent padding and gaps to create a premium feel.
- BORDERS: Use border-radius (0-40px) and border colors to define hierarchy.

Section types:
navbar, hero, features, content, image_placeholder, cards, form, cta, testimonials, pricing, footer, sidebar, breadcrumb, stats, tabs, accordion, table, grid, pagination, banner.

The canvas is 1280px wide. Each section stacks vertically starting at y=0.
Return ONLY valid JSON. No markdown, no explanations."""


def generate_page_wireframe_prompt(page_title: str, page_url: str, page_type_context: str, site_name: str) -> str:
    return f"""Generate a high-fidelity wireframe layout for this web page:

Site Name: {site_name}
Page Title: {page_title}
Page URL: {page_url}
Context: {page_type_context}

The design should be bespoke and modern. Every section MUST have unique style properties that create a premium feel. Avoid generic grey-on-white designs unless it's a specific stylistic choice.

Return JSON only."""


async def generate_wireframe_for_page(
    page_title: str,
    page_url: str,
    page_type_context: str,
    site_name: str
) -> PageWireframe:
    llm = get_llm()
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=generate_page_wireframe_prompt(
            page_title, page_url, page_type_context, site_name
        ))
    ]
    
    response = await llm.ainvoke(messages)
    content = response.content
    
    # Extract JSON from response
    json_data = _extract_json(content)
    
    sections = []
    for i, sec_data in enumerate(json_data.get("sections", [])):
        section = _parse_section(sec_data, i)
        if section:
            sections.append(section)
    
    # Calculate total height
    total_height = max((s.y + s.height for s in sections), default=900)
    
    # Generate page id from url
    page_id = re.sub(r'[^a-z0-9]', '_', page_url.lower().split('/')[-1] or 'home')
    if not page_id:
        page_id = 'home'

    return PageWireframe(
        page_id=page_id,
        page_title=page_title,
        page_url=page_url,
        width=1280,
        height=int(total_height),
        sections=sections,
        layout_notes=json_data.get("layout_notes", "")
    )


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response."""
    # Try direct parse
    try:
        return json.loads(text)
    except:
        pass
    
    # Try to find JSON block
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
        r'\{[\s\S]*\}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if '```' in pattern else match.group(0)
                return json.loads(candidate)
            except:
                continue
    
    # Return fallback
    return {"sections": _fallback_sections(), "layout_notes": "Generated fallback layout"}


def _parse_section(data: dict, index: int) -> Optional[WireframeSection]:
    try:
        children = []
        for j, child_data in enumerate(data.get("children", [])):
            child = _parse_section(child_data, j)
            if child:
                children.append(child)
        
        # Ensure style has all needed keys with defaults
        raw_style = data.get("style", {})
        style = {
            "bg": raw_style.get("bg", "#ffffff"),
            "textColor": raw_style.get("textColor", "#000000"),
            "accentColor": raw_style.get("accentColor", "#0000ff"),
            "borderColor": raw_style.get("borderColor", "#cccccc"),
            "borderRadius": raw_style.get("borderRadius", 0),
            "padding": raw_style.get("padding", 20),
            "gap": raw_style.get("gap", 16),
            "fontFamily": raw_style.get("fontFamily", "Inter"),
            "fontSize": raw_style.get("fontSize", 16),
            "fontWeight": str(raw_style.get("fontWeight", "400")),
        }
        
        return WireframeSection(
            id=data.get("id", f"section_{index}"),
            type=data.get("type", "content"),
            label=data.get("label", "Section"),
            description=data.get("description", ""),
            x=float(data.get("x", 0)),
            y=float(data.get("y", index * 100)),
            width=float(data.get("width", 1280)),
            height=float(data.get("height", 150)),
            style=style,
            children=children
        )
    except Exception as e:
        return None


def _fallback_sections() -> list:
    """Return a generic fallback wireframe layout."""
    default_style = {
        "bg": "#1a1a2e", "textColor": "#e0e0f0", "accentColor": "#6c63ff",
        "borderColor": "#2a2a42", "borderRadius": 8, "padding": 24,
        "gap": 16, "fontFamily": "Inter", "fontSize": 14, "fontWeight": "400"
    }
    return [
        {"id": "nav", "type": "navbar", "label": "Navigation", "description": "Logo + Nav links", "x": 0, "y": 0, "width": 1280, "height": 70,
         "style": {**default_style, "bg": "#12121e", "fontSize": 13}, "children": []},
        {"id": "hero", "type": "hero", "label": "Hero Section", "description": "Main headline and CTA", "x": 0, "y": 70, "width": 1280, "height": 450,
         "style": {**default_style, "bg": "#141428", "fontSize": 36, "fontWeight": "700"}, "children": []},
        {"id": "content", "type": "content", "label": "Main Content", "description": "Page content", "x": 160, "y": 520, "width": 960, "height": 300,
         "style": {**default_style, "bg": "#16162a"}, "children": []},
        {"id": "footer", "type": "footer", "label": "Footer", "description": "Links and info", "x": 0, "y": 820, "width": 1280, "height": 180,
         "style": {**default_style, "bg": "#0e0e1a", "fontSize": 12}, "children": []},
    ]
