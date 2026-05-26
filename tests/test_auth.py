"""Tests de autenticación y endpoints públicos."""

import json


class TestAuth:
    def test_health_check(self, client):
        """El endpoint público / debe responder 200."""
        resp = client.get('/')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['estado'] == 'online'

    def test_login_success(self, client):
        """Login con credenciales válidas retorna token JWT."""
        resp = client.post('/login', json={
            'usu_correo': 'test@sd.com',
            'usu_contrasena': 'admin123'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'access_token' in data
        assert data['usu_nombre'] == 'Test User'

    def test_login_invalid_password(self, client):
        """Login con contraseña incorrecta retorna 401."""
        resp = client.post('/login', json={
            'usu_correo': 'test@sd.com',
            'usu_contrasena': 'wrongpassword'
        })
        assert resp.status_code == 401

    def test_login_invalid_email(self, client):
        """Login con correo inexistente retorna 401."""
        resp = client.post('/login', json={
            'usu_correo': 'noexiste@test.com',
            'usu_contrasena': 'admin123'
        })
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        """Login sin campos retorna 400."""
        resp = client.post('/login', json={})
        # El router auth.login() requiere ambos campos, falla con llave None
        assert resp.status_code in (400, 401)


class TestPublicEndpoints:
    def test_verificar_pedido_exists(self, client):
        """Endpoint público /verificar/<id> con pedido existente."""
        resp = client.get('/verificar/PED001')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ped_id'] == 'PED001'

    def test_verificar_pedido_not_found(self, client):
        """Endpoint público /verificar/<id> con pedido inexistente."""
        resp = client.get('/verificar/PED99999')
        assert resp.status_code == 404

    def test_verificar_rate_limit(self, client):
        """Rate limit: 5 requests OK, 6to da 429."""
        for i in range(5):
            resp = client.get('/verificar/PED001')
            assert resp.status_code == 200, f"Request {i+1} falló: {resp.status_code}"
        # 6to request debe ser rate-limited
        resp = client.get('/verificar/PED001')
        assert resp.status_code == 429
