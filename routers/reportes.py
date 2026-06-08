from flask import Blueprint
from services.auth_service import token_requerido, rol_requerido
from controllers.reportes_controllers import (
    cnlistarreportes, cnregistrarreportes, cneditarreportes,
    cneliminarreportes, cnbuscarreportes,
    cngenerar_reporte, cnexportar_reporte
)

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/', methods=["GET"])
@token_requerido
def listado():
    return cnlistarreportes()

@reportes_bp.route('/', methods=["POST"])
@token_requerido
@rol_requerido('Administrador')
def registrar():
    return cnregistrarreportes()

@reportes_bp.route('/', methods=["PUT"])
@token_requerido
@rol_requerido('Administrador')
def editar():
    return cneditarreportes()

@reportes_bp.route('/eliminar/<rep_id>', methods=["DELETE"])
@token_requerido
@rol_requerido('Administrador')
def eliminar(rep_id):
    return cneliminarreportes(rep_id)

@reportes_bp.route('/buscar', methods=["GET"])
@token_requerido
def buscar():
    return cnbuscarreportes()

# ── Reportes reales (agregaciones) ──
@reportes_bp.route('/generar/<tipo>', methods=["GET"])
@token_requerido
def generar_reporte(tipo):
    return cngenerar_reporte(tipo)

# ── Exportación PDF/Excel ──
@reportes_bp.route('/exportar/<tipo>/<formato>', methods=["GET"])
@token_requerido
def exportar_reporte(tipo, formato):
    return cnexportar_reporte(tipo, formato)