from flask import Blueprint
from controllers.kardex_controllers import *

kardex_bp = Blueprint('kardex', __name__)

@kardex_bp.route('/', methods=["GET"])
def listado():
    return cnlistadokardex()

@kardex_bp.route('/', methods=["POST"])
def registrar():
    return cnregistrarkardex()

@kardex_bp.route('/', methods=["PUT"])
def editar():
    return cneditarkardex()

@kardex_bp.route('/eliminar/<kar_id>', methods=["DELETE"])
def eliminar(kar_id):
    return cneliminarkardex(kar_id)

@kardex_bp.route('/buscar', methods=["GET"])
def buscar():
    return cnbuscarkardex()