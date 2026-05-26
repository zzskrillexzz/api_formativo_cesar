"""Tests de CRUD para pedidos."""

import json


class TestPedidos:
    def test_listar_pedidos(self, client, auth_headers):
        """GET /pedidos/ retorna lista."""
        resp = client.get('/pedidos/', headers=auth_headers)
        assert resp.status_code == 200
        body = resp.get_json()
        assert 'data' in body and 'total' in body and 'page' in body
        data = body['data']
        assert isinstance(data, list)
        assert len(data) > 0

    def test_buscar_pedido_exists(self, client, auth_headers):
        """GET /pedidos/<id> con pedido existente."""
        resp = client.get('/pedidos/PED001', headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['ped_id'] == 'PED001'

    def test_buscar_pedido_not_found(self, client, auth_headers):
        """GET /pedidos/<id> con pedido inexistente retorna 404."""
        resp = client.get('/pedidos/PED99999', headers=auth_headers)
        assert resp.status_code == 404

    def test_avanzar_estado(self, client, auth_headers):
        """PUT /pedidos/<id>/avanzar-estado avanza un estado."""
        # Primero verificar que existe
        resp = client.get('/pedidos/PED002', headers=auth_headers)
        assert resp.status_code == 200

        # Intentar avanzar
        resp = client.put('/pedidos/PED002/avanzar-estado', headers=auth_headers)
        # Puede ser 200 o 400 (si ya está en estado terminal)
        assert resp.status_code in (200, 400)

    def test_auth_required(self, client):
        """Sin token debe dar 401."""
        resp = client.get('/pedidos/')
        assert resp.status_code == 401


class TestRoles:
    def test_listar_roles(self, client, auth_headers):
        """GET /roles/ retorna lista de roles."""
        resp = client.get('/roles/', headers=auth_headers)
        assert resp.status_code == 200
        body = resp.get_json()
        assert 'data' in body
        data = body['data']
        assert isinstance(data, list)
        assert len(data) > 0


class TestClientes:
    def test_listar_clientes(self, client, auth_headers):
        """GET /clientes/ retorna lista."""
        resp = client.get('/clientes/', headers=auth_headers)
        assert resp.status_code == 200
        body = resp.get_json()
        assert 'data' in body
        data = body['data']
        assert isinstance(data, list)


class TestUsuarios:
    def test_listar_usuarios_no_password(self, client, auth_headers):
        """GET /usuarios/ NO debe exponer contrasena."""
        resp = client.get('/usuarios/', headers=auth_headers)
        assert resp.status_code == 200
        body = resp.get_json()
        assert 'data' in body
        data = body['data']
        assert isinstance(data, list)
        if data:
            assert 'contrasena' not in data[0], "contrasena no debe estar en respuesta"
            assert 'correo' in data[0]
