from flask import Blueprint
from controllers.inventarios_movimientos_controllers import cnlistadoinventariosmovimientos, cnregistrarinventariosmovimientos

inventarios_movimientos_bp = Blueprint('inventarios_movimientos', __name__)

@inventarios_movimientos_bp.route('/')
def listado():
    return cnlistadoinventariosmovimientos()

@inventarios_movimientos_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarinventariosmovimientos()