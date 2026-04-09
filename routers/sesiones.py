from flask import Blueprint
from controllers.sesiones_controllers import cnlistadosesiones, cnregistrarsesiones

sesiones_bp = Blueprint('sesiones', __name__)

@sesiones_bp.route('/')
def listado():
    return cnlistadosesiones()

@sesiones_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarsesiones()