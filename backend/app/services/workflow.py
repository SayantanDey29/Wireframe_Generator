import asyncio
from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph import StateGraph, END
from app.models.wireframe import SitemapPage, PageWireframe, WireframeProject
from app.services.sitemap_parser import get_page_context
from app.services.llm_service import generate_wireframe_for_page
from urllib.parse import urlparse


# State definition for LangGraph
class WireframeState(TypedDict):
    pages: List[Dict[str, Any]]
    site_name: str
    current_index: int
    generated_wireframes: List[Dict[str, Any]]
    errors: List[str]
    status_callback: Optional[Any]


async def process_page_node(state: WireframeState) -> WireframeState:
    """Process a single page and generate its wireframe."""
    pages = state["pages"]
    current_index = state["current_index"]
    
    if current_index >= len(pages):
        return state
    
    page_data = pages[current_index]
    page = SitemapPage(**page_data["page"])
    all_pages = [SitemapPage(**p["page"]) for p in pages]
    
    # Notify progress
    if state.get("status_callback"):
        await state["status_callback"](
            current_page=page.title,
            pages_done=current_index,
            total_pages=len(pages)
        )
    
    try:
        context = get_page_context(page, all_pages)
        wireframe = await generate_wireframe_for_page(
            page_title=page.title,
            page_url=page.url,
            page_type_context=context,
            site_name=state["site_name"]
        )
        
        new_wireframes = state["generated_wireframes"] + [wireframe.model_dump()]
        return {
            **state,
            "generated_wireframes": new_wireframes,
            "current_index": current_index + 1
        }
    except Exception as e:
        new_errors = state["errors"] + [f"Error on {page.title}: {str(e)}"]
        return {
            **state,
            "errors": new_errors,
            "current_index": current_index + 1
        }


def should_continue(state: WireframeState) -> str:
    """Check if there are more pages to process."""
    if state["current_index"] < len(state["pages"]):
        return "process_page"
    return END


def build_wireframe_graph() -> StateGraph:
    """Build the LangGraph workflow."""
    workflow = StateGraph(WireframeState)
    
    workflow.add_node("process_page", process_page_node)
    
    workflow.set_entry_point("process_page")
    workflow.add_conditional_edges(
        "process_page",
        should_continue,
        {
            "process_page": "process_page",
            END: END
        }
    )
    
    return workflow.compile()


async def run_wireframe_generation(
    pages: List[SitemapPage],
    site_name: str,
    status_callback=None,
    max_pages: int = 20
) -> WireframeProject:
    """Run the full wireframe generation workflow."""
    
    # Limit pages to avoid excessive API calls
    limited_pages = pages[:max_pages]
    
    # Prepare state
    pages_data = [{"page": page.model_dump()} for page in limited_pages]
    
    initial_state: WireframeState = {
        "pages": pages_data,
        "site_name": site_name,
        "current_index": 0,
        "generated_wireframes": [],
        "errors": [],
        "status_callback": status_callback
    }
    
    graph = build_wireframe_graph()
    final_state = await graph.ainvoke(initial_state)
    
    if final_state["errors"] and not final_state["generated_wireframes"]:
        error_msgs = "; ".join(final_state["errors"])
        raise Exception(f"Failed to generate wireframes: {error_msgs}")

    # Assemble project
    wireframes = [PageWireframe(**wf) for wf in final_state["generated_wireframes"]]
    
    return WireframeProject(
        project_name=site_name,
        total_pages=len(wireframes),
        pages=wireframes,
        sitemap_structure={p.url: p.title for p in limited_pages}
    )
