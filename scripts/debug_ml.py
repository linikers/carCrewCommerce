#!/usr/bin/env python3
"""Debug: testar API do ML."""
import json
import urllib.request

# Ler token
with open('/root/mercadoLivre/dados.json', 'r') as f:
    ml_data = json.load(f)
token = ml_data['conta']['api_token']

# Fazer request
url = 'https://api.mercadolibre.com/items/MLB1122641382'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
response = urllib.request.urlopen(req)
data = json.loads(response.read())

print('price:', data.get('price'))
print('title:', data.get('title', '')[:50])
print('status:', data.get('status'))
