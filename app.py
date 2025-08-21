import os
import logging
import jwt
import pandas as pd
from flask import Flask, jsonify, send_from_directory, request, abort
from functools import lru_cache

# 🔐 Configuração de segurança
SECRET_KEY = 'sua_chave_secreta'  # Troque por algo seguro

app = Flask(__name__, static_folder='tendence')

# 🔍 Logs de acesso
logging.basicConfig(level=logging.INFO)

@app.before_request
def log_request():
    logging.info(f"Acesso: {request.method} {request.path}")

# 🔐 Verificação de token
def verificar_token():
    token = request.headers.get('Authorization')
    if not token:
        abort(401, description='Token ausente')
    try:
        jwt.decode(token.replace('Bearer ', ''), SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        abort(401, description='Token expirado')
    except jwt.InvalidTokenError:
        abort(401, description='Token inválido')

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

# 🔹 Cache para leitura de CSV
@lru_cache(maxsize=5)
def ler_csv(caminho):
    return pd.read_csv(caminho)

# 🔹 Rotas de API
@app.route('/api/estados')
def estados():
    df = ler_csv('tendence/data/processed/estados.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/investimentos')
def investimentos():
    df = ler_csv('tendence/data/processed/investimentos_saude.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/indicadores')
def indicadores():
    verificar_token()
    df = ler_csv('tendence/data/processed/indicadores_saude.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/dados-integrados')
def dados_integrados():
    df = ler_csv('tendence/data/raw/dados_integrados.csv')
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/investimento-natalidade')
def investimento_natalidade():
    df = ler_csv('tendence/data/raw/dados_integrados.csv')
    agrupado = df.groupby('estado')[['investimento_total', 'natalidade']].mean().reset_index()
    return jsonify(agrupado.to_dict(orient='records'))

# 🔹 Tratamento de erros
@app.errorhandler(404)
def not_found(e):
    return jsonify(error='Rota não encontrada'), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify(error='Erro interno no servidor'), 500

@app.errorhandler(401)
def unauthorized(e):
    return jsonify(error=str(e)), 401

# 🔹 Execução do servidor
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)
