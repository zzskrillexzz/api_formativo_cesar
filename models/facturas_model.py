class facturas:
    def __init__(self, id=None, fecha_emision=None, email_enviado=None, 
                 forma_pago=None, cuenta_bancaria=None, total=None, usuario_id=None, fac_estado='Vigente',
                 cli_id_fk=None, cli_nombre=None, cli_apellido=None, cli_correo=None):
        self.id = id
        self.fecha_emision = fecha_emision
        self.email_enviado = email_enviado
        self.forma_pago = forma_pago
        self.cuenta_bancaria = cuenta_bancaria
        self.total = total
        self.usuario_id = usuario_id
        self.fac_estado = fac_estado
        self.cli_id_fk = cli_id_fk
        self.cli_nombre = cli_nombre
        self.cli_apellido = cli_apellido
        self.cli_correo = cli_correo

    def todic(self):
        return {
            "id": self.id,
            "fecha_emision": self.fecha_emision,
            "email_enviado": self.email_enviado,
            "forma_pago": self.forma_pago,
            "cuenta_bancaria": self.cuenta_bancaria,
            "total": self.total,
            "usuario_id": self.usuario_id,
            "estado": self.fac_estado,
            "cli_id_fk": self.cli_id_fk,
            "cli_nombre": self.cli_nombre,
            "cli_apellido": self.cli_apellido,
            "cli_correo": self.cli_correo
        }