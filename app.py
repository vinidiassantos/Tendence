import os
from flask import Flask, jsonify, send_from_directory
import pandas as pd

app = Flask(__name__, static_folder='tendence')

# 🔹 Rotas de frontend
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/script.js')
def script():
    return send_from_directory(app.static_folder, 'script.js')

@app.route('/style.css')
def style():
    return send_from_directory(app.static_folder, 'style.css')

# 🔹 Rotas de API (dados dinâmicos)
@app.route('/api/estados')
def estados():
    df = pd.read_csv('tendence/data/processed/estados.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/investimentos')
def investimentos():
    df = pd.read_csv('tendence/data/processed/investimentos_saude.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/indicadores')
def indicadores():
    df = pd.read_csv('tendence/data/processed/indicadores_saude.csv')
    return jsonify(df.to_dict(orient='records'))

# 🔹 Rota adicional para dados integrados
@app.route('/api/dados-integrados')
def dados_integrados():
    df = pd.read_csv('tendence/data/raw/dados_integrados.csv')
    return jsonify(df.to_dict(orient='records'))

# 🔹 Rota para investimento em natalidade
@app.route('/api/investimento-natalidade')
def investimento_natalidade():
    df = pd.read_csv('tendence/data/raw/dados_integrados.csv')
    agrupado = df.groupby('estado')[['investimento_total', 'natalidade']].mean().reset_index()
    return jsonify(agrupado.to_dict(orient='records'))

# 🔹 Execução do servidor
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)
