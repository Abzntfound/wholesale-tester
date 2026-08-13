import urllib.request
import re

url = 'https://www.wholesaleclearance.co.uk/wholesale-joblot-of-20-womens-brakeburn-cream-honesty-jumpers_1.htm'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; catalogue-research/1.0)'})
try:
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='ignore')
except Exception as e:
    # try another pattern
    url = 'https://www.wholesaleclearance.co.uk/wholesale-joblot-of-50-ladies-brakeburn-mixed-knitwear-huge-variety_8.htm'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; catalogue-research/1.0)'})
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='ignore')

print('URL:', url)
print('Length:', len(html))

# title
title = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
print('H1:', re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else 'none')

# price patterns
for pat in [r'£[\d,.]+', r'SKU[\w]+', r'RRP[^<]{0,80}', r'prod_thumb[^"\']+', r'prod/[^"\']+']:
    matches = re.findall(pat, html, re.I)[:5]
    if matches:
        print(pat, ':', matches)

imgs = re.findall(r'(?:src|href)="([^"]*(?:prod|thumb|upload)[^"]*)"', html, re.I)
print('Product media:', imgs[:10])

# meta
desc = re.search(r'<meta name="description" content="([^"]*)"', html)
print('Meta desc:', desc.group(1)[:200] if desc else 'none')
