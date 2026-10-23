"""Mede a home em 390x844 e em 1440x900 (posição do primeiro produto, grids)."""
import json
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3102/"
SAIDA = sys.argv[2] if len(sys.argv) > 2 else "/tmp/home-medida.json"

JS = """
() => {
  const vitrine = document.getElementById('vitrine');
  const links = vitrine ? [...vitrine.querySelectorAll('a[href^="/produto/"]')] : [];
  const primeiro = links[0] || null;
  let grid = primeiro ? primeiro.parentElement : null;
  while (grid && getComputedStyle(grid).display !== 'grid') grid = grid.parentElement;
  const cards = grid ? [...grid.children].map(c => Math.round(c.getBoundingClientRect().width)) : [];
  const cats = document.querySelectorAll('a[href^="/?cat="]').length;
  return {
    viewport: [window.innerWidth, window.innerHeight],
    alturaTotal: document.documentElement.scrollHeight,
    primeiroProdutoY: primeiro ? Math.round(primeiro.getBoundingClientRect().top + window.scrollY) : null,
    h2: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()).slice(0, 5),
    h1: document.querySelector('h1')?.innerText?.slice(0, 120) || null,
    cardsCategoria: cats,
    produtosVisiveis: links.length,
    larguraCards: cards,
    colunasGrid: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    temBotaoVerTodas: document.body.innerText.includes('Ver todas as'),
  };
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/local/bin/chromium", args=["--no-sandbox"])
    out = {}
    for nome, vp in (("mobile", {"width": 390, "height": 844}), ("desktop", {"width": 1440, "height": 900})):
        page = browser.new_page(viewport=vp, device_scale_factor=1, is_mobile=(nome == "mobile"))
        page.goto(URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(1500)
        out[nome] = page.evaluate(JS)
        page.screenshot(path=f"/tmp/home-{nome}.png", full_page=False)
        page.close()
    browser.close()

print(json.dumps(out, ensure_ascii=False, indent=2))
open(SAIDA, "w").write(json.dumps(out, ensure_ascii=False, indent=2))
