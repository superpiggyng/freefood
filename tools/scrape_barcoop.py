"""Small, respectful Selenium and Beautiful Soup site inventory scraper.

This captures rendered page structure and metadata for a site you control. It
does not bypass authentication, bot protection, paywalls, or access controls.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from collections import deque
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait


USER_AGENT = "SAVR-owned-site-inventory/1.0 (+contact: owner)"


@dataclass
class PageRecord:
    url: str
    title: str
    description: str
    canonical: str | None
    headings: list[dict[str, str]]
    navigation: list[dict[str, str]]
    buttons: list[str]
    forms: list[dict[str, object]]
    images: list[dict[str, str | None]]
    internal_links: list[str]
    external_links: list[str]
    structured_data: list[object]
    text: str


def normalize_url(url: str) -> str:
    clean, _ = urldefrag(url)
    parsed = urlparse(clean)
    path = parsed.path or "/"
    return parsed._replace(path=path, query="", fragment="").geturl()


def same_origin(url: str, origin: str) -> bool:
    return urlparse(url).netloc.lower() == urlparse(origin).netloc.lower()


def robots_parser(base_url: str) -> RobotFileParser:
    robots_url = urljoin(base_url, "/robots.txt")
    parser = RobotFileParser(robots_url)
    try:
        response = requests.get(robots_url, headers={"User-Agent": USER_AGENT}, timeout=15)
        parser.parse(response.text.splitlines() if response.ok else [])
    except requests.RequestException:
        parser.parse([])
    return parser


def make_driver(headless: bool = True) -> webdriver.Chrome:
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument(f"--user-agent={USER_AGENT}")
    options.set_capability("pageLoadStrategy", "normal")
    return webdriver.Chrome(options=options)


def render_page(driver: webdriver.Chrome, url: str) -> str:
    driver.get(url)
    WebDriverWait(driver, 20).until(
        lambda browser: browser.execute_script("return document.readyState") == "complete"
    )
    previous_height = 0
    for _ in range(8):
        height = driver.execute_script("return document.body.scrollHeight")
        if height == previous_height:
            break
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.35)
        previous_height = height
    driver.execute_script("window.scrollTo(0, 0)")
    return driver.page_source


def clean_text(node) -> str:
    return " ".join(node.get_text(" ", strip=True).split())


def parse_page(html: str, url: str, base_url: str) -> PageRecord:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "template", "svg"]):
        if tag.name != "script" or tag.get("type") != "application/ld+json":
            tag.decompose()

    title = clean_text(soup.title) if soup.title else ""
    description_tag = soup.select_one('meta[name="description"]')
    canonical_tag = soup.select_one('link[rel="canonical"]')
    headings = [
        {"level": heading.name, "text": clean_text(heading)}
        for heading in soup.select("h1, h2, h3, h4")
        if clean_text(heading)
    ]
    navigation = []
    for anchor in soup.select("nav a[href], header a[href], footer a[href]"):
        navigation.append({"text": clean_text(anchor), "url": urljoin(url, anchor["href"])})

    buttons = sorted({clean_text(node) for node in soup.select("button, [role=button], .w-button") if clean_text(node)})
    forms = []
    for form in soup.select("form"):
        fields = []
        for field in form.select("input, select, textarea"):
            fields.append({"name": field.get("name", ""), "type": field.get("type", field.name), "placeholder": field.get("placeholder", "")})
        forms.append({"action": urljoin(url, form.get("action", "")), "method": form.get("method", "get").upper(), "fields": fields})

    images = []
    for image in soup.select("img"):
        source = image.get("src") or image.get("data-src") or image.get("data-lazy-src")
        if source:
            images.append({"url": urljoin(url, source), "alt": image.get("alt"), "width": image.get("width"), "height": image.get("height")})

    internal_links, external_links = set(), set()
    for anchor in soup.select("a[href]"):
        target = normalize_url(urljoin(url, anchor["href"]))
        if urlparse(target).scheme not in {"http", "https"}:
            continue
        (internal_links if same_origin(target, base_url) else external_links).add(target)

    structured_data = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            structured_data.append(json.loads(script.string or "{}"))
        except json.JSONDecodeError:
            continue

    main = soup.select_one("main") or soup.body or soup
    return PageRecord(
        url=url,
        title=title,
        description=description_tag.get("content", "") if description_tag else "",
        canonical=canonical_tag.get("href") if canonical_tag else None,
        headings=headings,
        navigation=navigation,
        buttons=buttons,
        forms=forms,
        images=images,
        internal_links=sorted(internal_links),
        external_links=sorted(external_links),
        structured_data=structured_data,
        text=clean_text(main),
    )


def scrape(base_url: str, output: Path, max_pages: int, delay: float, headless: bool) -> None:
    base_url = normalize_url(base_url)
    output.mkdir(parents=True, exist_ok=True)
    html_dir = output / "html"
    html_dir.mkdir(exist_ok=True)
    robots = robots_parser(base_url)
    queue = deque([base_url])
    visited: set[str] = set()
    records: list[PageRecord] = []
    driver = make_driver(headless=headless)
    try:
        while queue and len(records) < max_pages:
            url = queue.popleft()
            if url in visited or not same_origin(url, base_url):
                continue
            visited.add(url)
            if not robots.can_fetch(USER_AGENT, url):
                print(f"skip robots.txt: {url}")
                continue
            print(f"scrape {len(records) + 1}/{max_pages}: {url}")
            try:
                html = render_page(driver, url)
                record = parse_page(html, url, base_url)
            except Exception as error:
                print(f"failed: {url}: {error}")
                continue
            records.append(record)
            slug = hashlib.sha256(url.encode()).hexdigest()[:12]
            (html_dir / f"{slug}.html").write_text(html, encoding="utf-8")
            for link in record.internal_links:
                if link not in visited:
                    queue.append(link)
            time.sleep(delay)
    finally:
        driver.quit()

    (output / "site.json").write_text(
        json.dumps([asdict(record) for record in records], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    summary = {
        "base_url": base_url,
        "pages": len(records),
        "titles": [record.title for record in records],
        "unique_images": sorted({image["url"] for record in records for image in record.images}),
        "all_internal_links": sorted({link for record in records for link in record.internal_links}),
    }
    (output / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")


if __name__ == "__main__":
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("url", nargs="?", default="https://www.barcoopbevy.com/")
    argument_parser.add_argument("--output", type=Path, default=Path("scrape-output/barcoop"))
    argument_parser.add_argument("--max-pages", type=int, default=30)
    argument_parser.add_argument("--delay", type=float, default=1.25)
    argument_parser.add_argument("--show-browser", action="store_true")
    args = argument_parser.parse_args()
    scrape(args.url, args.output, args.max_pages, args.delay, not args.show_browser)
