class cliente:

    def __init__(self, CLI_ID, CLI_NOMBRE, CLI_APELLIDO, CLI_TELEFONO, CLI_DIRECCION, CLI_CORREO):
        self.cli_id = CLI_ID
        self.cli_nombre = CLI_NOMBRE
        self.cli_apellido = CLI_APELLIDO
        self.cli_telefono = CLI_TELEFONO
        self.cli_direccion = CLI_DIRECCION
        self.cli_correo = CLI_CORREO

    def todic(self):
        return {
            "id": int(self.cli_id) if self.cli_id is not None else None, 
            "nombre": self.cli_nombre,
            "apellido": self.cli_apellido,
            "telefono": self.cli_telefono,  
            "direccion": self.cli_direccion,
            "correo": self.cli_correo
        }
        
        #c.lastrowid