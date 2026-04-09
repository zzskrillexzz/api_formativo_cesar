from flask import Blueprint
from controllers.reportes_controllers import cnlistadoreportes, cnregistrarreportes

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/')
def listado():
    return cnlistadoreportes()

@reportes_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarreportes()