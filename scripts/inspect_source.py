import urllib.request
import re

req = urllib.request.Request(
    'https://www.wholesaleclearance.co.uk/joblots.php',
    headers={'User-Agent': 'Mozilla/5.0 (compatible; catalogue-research/1.0)'}
)
html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', errors='ignore')

links = re.findall(r'href="([^"]+)"', html)
product_links = [l for l in links if any(x in l.lower() for x in ('product', 'sku', 'moreinfo', 'detail', 'joblot'))][:25]
print('PRODUCT LINKS:')
for l in product_links:
    print(' ', l)

imgs = re.findall(r'<img[^>]+src="([^"]+)"', html, re.I)[:15]
print('\nIMAGES:')
for i in imgs:
    print(' ', i)

scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)[:20]
print('\nSCRIPTS:')
for s in scripts:
    print(' ', s)

json_hints = re.findall(r'/(api|feed|json|xml)[^"\']*', html, re.I)
print('\nJSON/API PATHS:', list(set(json_hints))[:20])

# product detail page attempt
if product_links:
    test = product_links[0]
    if not test.startswith('http'):
        test = 'https://www.wholesaleclearance.co.uk/' + test.lstrip('/')
    print('\nTesting detail URL:', test)
    try:
        req2 = urllib.request.Request(test, headers={'User-Agent': 'Mozilla/5.0'})
        detail = urllib.request.urlopen(req2, timeout=30).read().decode('utf-8', errors='ignore')
        print('Detail page length:', len(detail))
        detail_imgs = re.findall(r'<img[^>]+src="([^"]+)"', detail, re.I)[:10]
        print('Detail images:', detail_imgs[:5])
        ld_json = re.findall(r'<script type="application/ld\+json">(.*?)</script>', detail, re.S)
        print('LD+JSON blocks:', len(ld_json))
    except Exception as e:
        print('Detail fetch error:', e)
