class usuarios:
    def __init__(self, usu_id, usu_nombre, usu_rol, usu_correo, usu_contrasena, usu_estado, usu_ultimo_acceso):
        self.usu_id = usu_id
        self.usu_nombre = usu_nombre
        self.usu_rol = usu_rol
        self.usu_correo = usu_correo
        self.usu_contrasena = usu_contrasena
        self.usu_estado = usu_estado
        self.usu_ultimo_acceso = usu_ultimo_acceso
    
    def todic(self):
        return {
            "id": self.usu_id,
            "nombre": self.usu_nombre,
            "rol": self.usu_rol,
            "correo": self.usu_correo,
            "estado": self.usu_estado,
            "ultimo_acceso": str(self.usu_ultimo_acceso) if self.usu_ultimo_acceso else None
        }