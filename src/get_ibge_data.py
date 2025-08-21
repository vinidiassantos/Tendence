import requests
import pandas as pd

# Requisição à API do IBGE
url = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados'
response = requests.get(url)
estados = response.json()

# Transformar em DataFrame
df_estados = pd.DataFrame(estados)

# Criar pasta processed se não existir
import os
processed_path = '../social-health-impact/data/processed'
os.makedirs(processed_path, exist_ok=True)

# Salvar como CSV
df_estados.to_csv(f'{processed_path}/estados.csv', index=False)

print("✅ Arquivo 'estados.csv' salvo com sucesso!")
