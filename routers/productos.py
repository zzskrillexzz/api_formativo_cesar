from flask import Blueprint, jsonify
from services.auth_service import token_requerido, rol_requerido
from controllers.productos_controllers import cnListarProductos, cnRegistrarProductos, cnEditarProductos, cnEliminarProductos
from utils.id_generator import generarIdSiguiente

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/next-id')
@token_requerido
def siguiente_id_producto():
    next_id = generarIdSiguiente("t_producto", "pro_id", "PRO", 3)
    return jsonify({"next_id": next_id}), 200

@productos_bp.route('/')
@token_requerido
def listado():
    return cnListarProductos()

@productos_bp.route('/', methods=["POST"])
@token_requerido
@rol_requerido('Administrador', 'Vendedor', 'Bodeguero')
def registrar():
    return cnRegistrarProductos()

@productos_bp.route('/', methods=["PUT"])
@token_requerido
@rol_requerido('Administrador', 'Vendedor', 'Bodeguero')
def editar():
    return cnEditarProductos()

@productos_bp.route('/<id>', methods=["DELETE"])
@token_requerido
@rol_requerido('Administrador')
def eliminar(id):
    return cnEliminarProductos(id)
