from flask import Blueprint
from controllers.usuarios_controllers import cnlistadousuarios, cnregistrarusuarios

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/')
def listado():
    return cnlistadousuarios()

@usuarios_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarusuarios()