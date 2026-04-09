from flask import Blueprint
from controllers.proveedores_productos_controllers import cnlistadoproveedoresproductos, cnregistrarproveedoresproductos

proveedores_productos_bp = Blueprint('proveedores_productos', __name__)

@proveedores_productos_bp.route('/')
def listado():
    return cnlistadoproveedoresproductos()

@proveedores_productos_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarproveedoresproductos()