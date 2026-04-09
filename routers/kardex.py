from flask import Blueprint
from controllers.kardex_controllers import cnlistadokardex, cnregistrarkardex

kardex_bp = Blueprint('kardex', __name__)

@kardex_bp.route('/')
def listado():
    return cnlistadokardex()

@kardex_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarkardex()