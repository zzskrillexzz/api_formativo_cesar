from flask import Blueprint
from services.auth_service import token_requerido, rol_requerido
from controllers.monitorias_controllers import (
    cnlistarMonitoria,
    cnregistrarMonitoria,
    cneditarMonitoria,
    cneliminarMonitoria,
    cnbuscarMonitoria
)

monitoria_bp = Blueprint('monitoria', __name__)

@monitoria_bp.route('/', methods=['GET'])
@token_requerido
def listar():
    return cnlistarMonitoria()

@monitoria_bp.route('/', methods=['POST'])
@token_requerido
@rol_requerido('Administrador', 'Vendedor', 'Bodeguero')
def registrar():
    return cnregistrarMonitoria()

@monitoria_bp.route('/<id>', methods=['PUT'])
@token_requerido
@rol_requerido('Administrador', 'Vendedor', 'Bodeguero')
def editar(id):
    return cneditarMonitoria(id)

@monitoria_bp.route('/<id>', methods=['DELETE'])
@token_requerido
@rol_requerido('Administrador')
def eliminar(id):
    return cneliminarMonitoria(id)

@monitoria_bp.route('/buscar', methods=['GET'])
@token_requerido
def buscar():
    return cnbuscarMonitoria()