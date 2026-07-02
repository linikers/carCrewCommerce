#!/usr/bin/env python3
"""Sync ML prices to JSON frontend."""
import json, time, urllib.request, urllib.parse

# Load token from file
with open('/root/mercadoLivre/dados.json', 'r') as f:
    ml_data = json.load(f)

# Refresh token
data = urllib.parse.urlencode({
    'grant_type': 'refresh_token',
    'client_id': ml_data["conta"]["client_id"],
    'client_secret': ml_data["conta"]["client_secret"],
    'refresh_token': ml_data["conta"]["refresh_token"]
}).encode()

req = urllib.request.Request('https://api.mercadolibre.com/oauth/token', data=data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'})
resp = json.loads(urllib.request.urlopen(req).read())

if 'access_token' in resp:
    ml_data['conta']['api_token'] = resp['access_token']
    ml_data['conta']['refresh_token'] = resp['refresh_token']
    with open('/root/mercadoLivre/dados.json', 'w') as f:
        json.dump(ml_data, f, indent=2, ensure_ascii=False)
    print("Token refreshed!")

TOKEN = ml_data['conta']['api_token']
MATCHES = {
    1: "MLB1122641382", 6: "MLB4062518735", 8: "MLB4254645853",
    9: "MLB4254519613", 12: "MLB4073187491", 15: "MLB4073305609",
    22: "MLB4011940777", 30: "MLB5354108212", 38: "MLB4129754779",
    40: "MLB4011940777", 41: "MLB4011940777", 45: "MLB3345069149",
}

def fetch_ml(ml_id):
    req = urllib.request.Request(f'https://api.mercadolibre.com/items/{ml_id}',
        headers={'Authorization': f'Bearer {TOKEN}'})
    return json.loads(urllib.request.urlopen(req).read())

def extract_measures(item):
    attrs = item.get('attributes', [])
    peso = altura = largura = profundidade = None
    for attr in attrs:
        name = attr.get('name', '').lower()
        value = attr.get('value_name', '')
        if 'peso da embalagem' in name and 'vendor' not in name:
            try: peso = float(value.replace(' g', '').replace(',', '.'))
            except: pass
        elif 'altura da embalagem' in name and 'vendor' not in name:
            try: altura = float(value.replace(' cm', '').replace(',', '.'))
            except: pass
        elif 'largura da embalagem' in name and 'vendor' not in name:
            try: largura = float(value.replace(' cm', '').replace(',', '.'))
            except: pass
        elif 'comprimento da embalagem' in name and 'vendor' not in name:
            try: profundidade = float(value.replace(' cm', '').replace(',', '.'))
            except: pass
    if peso is None:
        for attr in attrs:
            name = attr.get('name', '').lower()
            value = attr.get('value_name', '')
            if 'peso da embalagem do vendor' in name:
                try: peso = float(value.replace(' g', '').replace(',', '.'))
                except: pass
            elif 'altura da embalagem do vendor' in name:
                try: altura = float(value.replace(' cm', '').replace(',', '.'))
                except: pass
            elif 'largura da embalagem do vendor' in name:
                try: largura = float(value.replace(' cm', '').replace(',', '.'))
                except: pass
            elif 'comprimento da embalagem do vendor' in name:
                try: profundidade = float(value.replace(' cm', '').replace(',', '.'))
                except: pass
    return peso, altura, largura, profundidade

sync_data = {}
for site_id, ml_id in MATCHES.items():
    try:
        item = fetch_ml(ml_id)
        price = item.get('price', 0)
        peso, altura, largura, profundidade = extract_measures(item)
        sync_data[site_id] = {'preco': price, 'peso': peso, 'altura': altura, 'largura': largura, 'profundidade': profundidade}
        print(f"#{site_id}: R$ {price:.2f} | {peso}g | {altura}x{largura}x{profundidade}cm")
        time.sleep(0.3)
    except Exception as e:
        print(f"#{site_id}: ERROR {e}")

with open('/root/carCrewCommerce/src/data/produtos.json', 'r') as f:
    produtos = json.load(f)

for p in produtos:
    if p['id'] in sync_data:
        d = sync_data[p['id']]
        p['preco'] = d['preco']
        p['estoque'] = 1
        if d['peso']: p['peso'] = d['peso']
        if d['altura']: p['altura'] = d['altura']
        if d['largura']: p['largura'] = d['largura']
        if d['profundidade']: p['profundidade'] = d['profundidade']

with open('/root/carCrewCommerce/src/data/produtos.json', 'w') as f:
    json.dump(produtos, f, indent=2, ensure_ascii=False)

print(f"\nSaved! {len(sync_data)} products with price")
with open('/root/carCrewCommerce/src/data/produtos.json', 'r') as f:
    verify = json.load(f)
print(f"Verify: {sum(1 for p in verify if p.get('preco', 0) > 0)} with price > 0")
