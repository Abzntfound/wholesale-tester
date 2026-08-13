"""
Extract publicly listed products from WCUK joblots listing page 1.
For authorised catalogue migration only — visible public HTML, no auth bypass.
Run manually: python scripts/extract_listing_page.py > data/live-seed.json
"""
import json
import re
import urllib.request
from html import unescape

BASE = 'https://www.wholesaleclearance.co.uk'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'WCUK-Catalogue-Migration/1.0 (+authorised)'})
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='ignore')

def parse_price(text):
    m = re.search(r'£([\d,.]+)', text.replace(',', ''))
    return float(m.group(1)) if m else None

def extract_products(html):
    products = []
    # Each product block has thumb, link, title pattern
    blocks = re.split(r'<div class="product[^"]*"', html)
    for block in blocks[1:21]:
        img = re.search(r'prod_thumb/540x500/(\d+)\.jpg', block)
        link = re.search(r'href="(/[^"]+\.htm)"', block)
        sku = re.search(r'PART NO:\s*(SKU[\w]+)', block, re.I)
        discount = re.search(r'(\d+)% off RRP', block, re.I)
        # title from alt or link text
        alt = re.search(r'alt="([^"]{10,})"', block)
        title = alt.group(1).strip() if alt else None
        prices = re.findall(r'£([\d,.]+)', block.replace(',', ''))
        unit_price = float(prices[0]) if prices else None
        lot_price = float(prices[1]) if len(prices) > 1 else unit_price
        if not title and link:
            title = link.group(1).split('/')[-1].replace('-', ' ').replace('_', ' ').replace('.htm', '')

        if img and title:
            image_id = img.group(1)
            products.append({
                'id': sku.group(1) if sku else f'SKU{image_id}',
                'sku': sku.group(1) if sku else f'SKU{image_id}',
                'name': unescape(title),
                'image': f'{BASE}/prod_thumb/540x500/{image_id}.jpg',
                'images': [f'{BASE}/prod_thumb/540x500/{image_id}.jpg'],
                'url': (BASE + link.group(1)) if link else f'/product/{image_id}',
                'legacyUrl': (BASE + link.group(1)) if link else None,
                'price': lot_price,
                'unitPrice': unit_price,
                'discountPercent': int(discount.group(1)) if discount else None,
                'source': 'live-listing-page-1'
            })
    return products

if __name__ == '__main__':
    html = fetch(f'{BASE}/joblots.php')
    products = extract_products(html)
    print(json.dumps({'count': len(products), 'products': products}, indent=2))
