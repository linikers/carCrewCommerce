#!/usr/bin/env python3
"""Sync preço + medidas do ML para o banco CarCrew."""
import psycopg2
import json
import subprocess
import time
import sys

# Matches aprovados: site_id -> ml_id
MATCHES = {
    1:  "MLB1122641382",   # Compressor HKI 444
    6:  "MLB4062518735",   # Bandeja Slim GM
    8:  "MLB4254645853",   # Bolsa Cônica 20mm
    9:  "MLB4254519613",   # Bolsa Cônica 22mm
    12: "MLB4073187491",   # Par Bolsas Haste 20mm
    15: "MLB4073305609",   # Par Bolsa Haste 22mm
    22: "MLB4011940777",   # Terminal Alongado VW
    30: "MLB5354108212",   # Bucha Reduzida Eixo
    38: "MLB4129754779",   # Rosca Reguladora Barra
    40: "MLB4011940777",   # Terminal Alongado VW (Direção N)
    41: "MLB4011940777",   # Terminal Alongado VW (Direção R)
    45: "MLB3345069149",   # Amortecedores Off Road
}

def fetch_ml_item(ml_id, token):
    """Busca item do ML via API."""
    result = subprocess.run([
        'curl', '-s', '-H', f'Authorization: Bearer {token}',
        f'https://api.mercadolibre.com/items/{ml_id}'
    ], capture_output=True, text=True, timeout=15)
    return json.loads(result.stdout)

def extract_measures(item):
    """Extrai peso e dimensões dos attributes do ML."""
    attrs = item.get('attributes', [])
    peso = altura = largura = profundidade = None
    
    # Primeiro: medidas do catálogo
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
    
    # Fallback: vendor dimensions
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

def main():
    # Token ML
    with open('/root/mercadoLivre/dados.json', 'r') as f:
        ml_data = json.load(f)
    token = ml_data['conta']['api_token']
    
    # Conectar ao banco
    with open('.env.local', 'r') as f:
        for line in f:
            if line.startswith('POSTGRES_PRISMA_URL='):
                url = line.strip().split('=', 1)[1]
                break
    
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    cur.execute("SELECT id, nome FROM produtos")
    db_products = {r[0]: r[1] for r in cur.fetchall()}
    
    print("=" * 70)
    print("SCRIPT DE SYNC: PREÇO + MEDIDAS (ML → CarCrew)")
    print("=" * 70)
    
    updated = 0
    errors = 0
    
    for site_id, ml_id in MATCHES.items():
        site_nome = db_products.get(site_id, "???")
        
        try:
            item = fetch_ml_item(ml_id, token)
        except Exception as e:
            print(f"❌ Site #{site_id}: Erro ao buscar {ml_id}: {e}")
            errors += 1
            continue
        
        price = item.get('price', 0)
        peso, altura, largura, profundidade = extract_measures(item)
        
        # Atualizar banco
        cur.execute("""
            UPDATE produtos 
            SET preco = %s, peso = %s, altura = %s, largura = %s, profundidade = %s
            WHERE id = %s
        """, (price, peso, altura, largura, profundidade, site_id))
        
        peso_str = f"{peso}g" if peso else "s/peso"
        dim_str = f"{altura}x{largura}x{profundidade}cm" if altura else "s/dims"
        
        print(f"✅ #{site_id}: {site_nome[:35]}")
        print(f"   R$ {price:.2f} | {peso_str} | {dim_str}")
        
        updated += 1
        time.sleep(0.3)
    
    conn.commit()
    
    print(f"\n{'='*70}")
    print(f"SYNC COMPLETO: {updated} atualizados, {errors} erros")
    print(f"{'='*70}")
    
    # Listar todos os produtos com preço
    cur.execute("SELECT id, nome, preco, peso, altura, largura, profundidade FROM produtos WHERE preco > 0 ORDER BY id")
    rows = cur.fetchall()
    print(f"\nProdutos com preço no banco ({len(rows)}):")
    for r in rows:
        peso_v = f"{r[3]:.0f}g" if r[3] else "-"
        dim_v = f"{r[4]:.0f}x{r[5]:.0f}x{r[6]:.0f}cm" if r[4] else "-"
        print(f"  #{r[0]:2d} | R$ {r[2]:>8.2f} | {peso_v:>7s} | {dim_v:>15s} | {r[1][:35]}")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
