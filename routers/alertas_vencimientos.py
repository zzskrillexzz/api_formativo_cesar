from flask import Blueprint
from services.auth_service import token_requerido, rol_requerido
from controllers.alertas_vencimientos_controllers import (
    cnlistadoalertasvencimientos, cnregistraralertasvencimientos,
    cnbuscaralertasvencimientos, cneditaralertasvencimientos, cneliminaralertasvencimientos
)

alertas_vencimientos_bp = Blueprint('alertas_vencimientos', __name__)

@alertas_vencimientos_bp.route('/')
@token_requerido
def listado():
    return cnlistadoalertasvencimientos()

@alertas_vencimientos_bp.route('/', methods=["POST"])
@token_requerido
def registrar():
    return cnregistraralertasvencimientos()

@alertas_vencimientos_bp.route('/<ALV_ID>')
@token_requerido
def buscar(ALV_ID):
    return cnbuscaralertasvencimientos(ALV_ID)

@alertas_vencimientos_bp.route('/<ALV_ID>', methods=["PUT"])
@token_requerido
@rol_requerido('Administrador', 'Bodeguero')
def editar(ALV_ID):
    return cneditaralertasvencimientos(ALV_ID)

@alertas_vencimientos_bp.route('/<ALV_ID>', methods=["DELETE"])
@token_requerido
@rol_requerido('Administrador')
def eliminar(ALV_ID):
    return cneliminaralertasvencimientos(ALV_ID)