from flask import Blueprint
from controllers.proveedores_controllers import cnlistadoproveedores, cnregistrarproveedores

proveedores_bp = Blueprint('proveedores', __name__)

@proveedores_bp.route('/')
def listado():
    return cnlistadoproveedores()

@proveedores_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarproveedores()