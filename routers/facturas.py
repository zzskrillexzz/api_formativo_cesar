from flask import Blueprint
from controllers.facturas_controllers import cnListarFacturas, cnRegistrarFacturas, cnEditarFacturas, cnEliminarFacturas, cnBuscarFacturas

facturas_bp = Blueprint('facturas', __name__)

@facturas_bp.route('/')
def listado():
    return cnListarFacturas()

@facturas_bp.route('/', methods=["POST"])
def registrar():
    return cnRegistrarFacturas()

@facturas_bp.route('/<int:fac_id>', methods=["PUT"])
def editar(fac_id):
    return cnEditarFacturas(fac_id)

@facturas_bp.route('/<int:fac_id>', methods=["DELETE"])
def eliminar(fac_id):
    return cnEliminarFacturas(fac_id)

@facturas_bp.route('/<int:fac_id>')
def buscar(fac_id):
    return cnBuscarFacturas(fac_id)
