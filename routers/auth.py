from flask import Blueprint, request, jsonify
from controllers.auth_controller import iniciarSesion

autenticacion_bp = Blueprint('autenticacion', __name__)

@autenticacion_bp.route('/login', methods=['POST'])
def login():
    # 1. Recibe los datos del frontend
    body = request.get_json()
    correo   = body.get('usu_correo')
    password = body.get('usu_contrasena')

    # 2. Le pregunta al controller
    resultado = iniciarSesion(correo, password)

    # 3. ¿Falló?
    if not resultado:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    # 4. ¿Todo ok?
    return jsonify(resultado), 200