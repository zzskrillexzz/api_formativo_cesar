from flask import Blueprint
from services.auth_service import token_requerido, rol_requerido
from controllers.detalles_compras_controllers import (
    cnlistadodetallescompras, cnregistrardetallescompras,
    cnbuscadetallescompras, cneditardetallescompras, cneliminardetallescompras
)

detalles_compras_bp = Blueprint('detalles_compras', __name__)

@detalles_compras_bp.route('/')
@token_requerido
def listado():
    return cnlistadodetallescompras()

@detalles_compras_bp.route('/', methods=["POST"])
@token_requerido
@rol_requerido('Administrador', 'Bodeguero')
def registrar():
    return cnregistrardetallescompras()

@detalles_compras_bp.route('/<DCO_ID>')
@token_requerido
def buscar(DCO_ID):
    return cnbuscadetallescompras(DCO_ID)

@detalles_compras_bp.route('/<DCO_ID>', methods=["PUT"])
@token_requerido
@rol_requerido('Administrador', 'Bodeguero')
def editar(DCO_ID):
    return cneditardetallescompras(DCO_ID)

@detalles_compras_bp.route('/<DCO_ID>', methods=["DELETE"])
@token_requerido
@rol_requerido('Administrador')
def eliminar(DCO_ID):
    return cneliminardetallescompras(DCO_ID)