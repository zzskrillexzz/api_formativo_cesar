"""
Pytest fixtures compartidos.
Para ejecutar: cd Backend && pip install pytest && pytest tests/ -v
Requiere MySQL corriendo en localhost:3307 con la base de datos configurada.
"""

import pytest
from app import app as _app
import json


@pytest.fixture
def app():
    _app.config['TESTING'] = True
    _app.config['DEBUG'] = False
    return _app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_token(client):
    """Inicia sesión con test@sd.com / admin123 y retorna el token JWT."""
    resp = client.post('/login', json={
        'usu_correo': 'test@sd.com',
        'usu_contrasena': 'admin123'
    })
    assert resp.status_code == 200, f"Login falló: {resp.get_json()}"
    data = resp.get_json()
    return data['access_token']


@pytest.fixture
def auth_headers(auth_token):
    return {'Authorization': f'Bearer {auth_token}'}
