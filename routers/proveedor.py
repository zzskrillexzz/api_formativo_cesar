from flask import Blueprint
from controllers.proveedor_controllers import (
    cnListarProveedores,
    cnRegistrarProveedor,
    cnEditarProveedor,
    cnEliminarProveedor,
    cnBuscarProveedor
)

proveedores_bp = Blueprint('proveedores', __name__)

@proveedores_bp.route('/', methods=['GET'])
def listado():
    return cnListarProveedores()

@proveedores_bp.route('/', methods=['POST'])
def registrar():
    return cnRegistrarProveedor()

@proveedores_bp.route('/<string:prov_id>', methods=['GET'])
def buscar(prov_id):
    return cnBuscarProveedor(prov_id)

@proveedores_bp.route('/<string:prov_id>', methods=['PUT'])
def editar(prov_id):
    return cnEditarProveedor(prov_id)

@proveedores_bp.route('/<string:prov_id>', methods=['DELETE'])
def eliminar(prov_id):
    return cnEliminarProveedor(prov_id)