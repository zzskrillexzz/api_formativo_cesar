from flask import Blueprint
from controllers.inventario_movimiento_controllers import (
    cnListarMovimientos,
    cnRegistrarMovimiento,
    cnEditarMovimiento,
    cnEliminarMovimiento,
    cnBuscarMovimiento
)

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/', methods=['GET'])
def listado():
    return cnListarMovimientos()

@inventario_bp.route('/', methods=['POST'])
def registrar():
    return cnRegistrarMovimiento()

@inventario_bp.route('/<string:inm_id>', methods=['GET'])
def buscar(inm_id):
    return cnBuscarMovimiento(inm_id)

@inventario_bp.route('/<string:inm_id>', methods=['PUT'])
def editar(inm_id):
    return cnEditarMovimiento(inm_id)

@inventario_bp.route('/<string:inm_id>', methods=['DELETE'])
def eliminar(inm_id):
    return cnEliminarMovimiento(inm_id)