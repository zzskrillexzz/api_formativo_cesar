from flask import Blueprint
from controllers.lotes_controllers import cnlistadolotes, cnregistrarlotes

lotes_bp = Blueprint('lotes', __name__)

@lotes_bp.route('/')
def listado():
    return cnlistadolotes()

@lotes_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarlotes()