from services.auth_service import login

def iniciarSesion(USU_CORREO, USU_CONTRASENA):
    # Le delega todo al service
    resultado = login(USU_CORREO, USU_CONTRASENA)

    if not resultado:
        return None  # credenciales incorrectas o usuario inactivo

    return resultado