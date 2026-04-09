from flask import Blueprint
from controllers.alertas_vencimientos_controllers import cnlistadoalertasvencimientos, cnregistraralertasvencimientos

alertas_vencimientos_bp = Blueprint('alertas_vencimientos', __name__)

@alertas_vencimientos_bp.route('/')
def listado():
    return cnlistadoalertasvencimientos()

@alertas_vencimientos_bp.route('/', methods=["POST"])
def registrar():
    return cnregistraralertasvencimientos()