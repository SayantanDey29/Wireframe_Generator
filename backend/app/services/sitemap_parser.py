import xmltodict
from typing import Dict, Any, List
from app.models.wireframe import SitemapPage
import re
from urllib.parse import urlparse


def parse_sitemap_xml(xml_content: str) -> List[SitemapPage]:
    """Parse sitemap XML into structured page list."""
    try:
        data = xmltodict.parse(xml_content)
    except Exception as e:
        raise ValueError(f"Invalid XML: {e}")

    pages = []
    url_entries = []

    # Handle standard sitemap format
    if "urlset" in data:
        urlset = data["urlset"]
        urls = urlset.get("url", [])
        if isinstance(urls, dict):
            urls = [urls]
        url_entries = urls

    # Handle sitemap index
    elif "sitemapindex" in data:
        sitemaps = data["sitemapindex"].get("sitemap", [])
        if isinstance(sitemaps, dict):
            sitemaps = [sitemaps]
        for sm in sitemaps:
            loc = sm.get("loc", "")
            url_entries.append({"loc": loc})

    for entry in url_entries:
        loc = entry.get("loc", "")
        if not loc:
            continue
        parsed = urlparse(loc)
        path = parsed.path.strip("/")
        parts = path.split("/") if path else []
        depth = len(parts)
        title = _path_to_title(parts[-1] if parts else parsed.netloc)
        parent = "/" + "/".join(parts[:-1]) if len(parts) > 1 else None

        pages.append(SitemapPage(
            url=loc,
            title=title,
            depth=depth,
            parent=parent,
            children=[]
        ))

    # Assign children
    url_to_page = {p.url: p for p in pages}
    for page in pages:
        if page.parent:
            # find parent by path
            for other in pages:
                parsed_other = urlparse(other.url)
                other_path = parsed_other.path.strip("/")
                parsed_self = urlparse(page.url)
                self_path = parsed_self.path.strip("/")
                self_parts = self_path.split("/") if self_path else []
                if len(self_parts) > 0:
                    parent_path = "/".join(self_parts[:-1])
                    if other_path == parent_path:
                        other.children.append(page.url)
                        break

    return pages


def _path_to_title(slug: str) -> str:
    """Convert URL slug to readable title."""
    if not slug:
        return "Home"
    # Remove extensions
    slug = re.sub(r'\.\w+$', '', slug)
    # Replace separators
    title = slug.replace("-", " ").replace("_", " ").replace(".", " ")
    return title.title()


def sitemap_to_dict(pages: List[SitemapPage]) -> Dict[str, Any]:
    """Build hierarchical dict from flat page list."""
    result = {}
    for page in pages:
        result[page.url] = {
            "title": page.title,
            "depth": page.depth,
            "children": page.children
        }
    return result


def get_page_context(page: SitemapPage, all_pages: List[SitemapPage]) -> str:
    """Generate context string about a page for the LLM."""
    path = urlparse(page.url).path.strip("/")
    parts = path.split("/") if path else []

    context_parts = [f"Page: {page.title}", f"URL: {page.url}", f"Depth: {page.depth}"]

    if page.children:
        child_titles = []
        for child_url in page.children[:5]:
            for p in all_pages:
                if p.url == child_url:
                    child_titles.append(p.title)
        if child_titles:
            context_parts.append(f"Sub-pages: {', '.join(child_titles)}")

    # Infer page type
    page_type = _infer_page_type(page.title, parts)
    context_parts.append(f"Page type: {page_type}")

    return "\n".join(context_parts)


def _infer_page_type(title: str, parts: List[str]) -> str:
    """Infer the type/purpose of a page from its title and path."""
    title_lower = title.lower()
    path_str = "/".join(parts).lower()

    if not parts or title_lower in ["home", "index", ""]:
        return "Homepage - main landing page with hero, features, CTA"
    elif any(x in title_lower for x in ["about", "team", "story", "mission"]):
        return "About page - company info, team, mission, values"
    elif any(x in title_lower for x in ["contact", "reach", "touch"]):
        return "Contact page - contact form, map, info"
    elif any(x in title_lower for x in ["blog", "news", "articles", "posts"]):
        return "Blog listing page - article cards, categories, search"
    elif any(x in title_lower for x in ["product", "item", "detail"]) and len(parts) > 1:
        return "Product detail page - images, description, CTA, specs"
    elif any(x in title_lower for x in ["shop", "store", "products", "catalog", "collection"]):
        return "Shop/catalog page - product grid, filters, sorting"
    elif any(x in title_lower for x in ["cart", "basket"]):
        return "Shopping cart page - item list, totals, checkout CTA"
    elif any(x in title_lower for x in ["checkout", "payment", "order"]):
        return "Checkout page - form, order summary, payment"
    elif any(x in title_lower for x in ["login", "signin", "sign-in"]):
        return "Login page - email/password form, social login"
    elif any(x in title_lower for x in ["register", "signup", "sign-up", "join"]):
        return "Registration page - signup form"
    elif any(x in title_lower for x in ["pricing", "plans", "subscription"]):
        return "Pricing page - plan cards, features comparison, CTA"
    elif any(x in title_lower for x in ["service", "solution", "offering"]):
        return "Services page - service cards/list, benefits"
    elif any(x in title_lower for x in ["portfolio", "work", "projects", "gallery"]):
        return "Portfolio/gallery page - image grid, project cards"
    elif any(x in title_lower for x in ["faq", "help", "support", "docs"]):
        return "FAQ/Help page - accordion questions, search, categories"
    elif any(x in title_lower for x in ["privacy", "terms", "legal", "policy"]):
        return "Legal page - formatted text, table of contents"
    elif any(x in title_lower for x in ["dashboard", "account", "profile", "settings"]):
        return "Dashboard/Account page - stats, user info, settings"
    else:
        return f"Content page - {title} with relevant sections"
