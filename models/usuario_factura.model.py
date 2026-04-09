class usuario_factura:
    def __init__(self, usa_usu_id_fk, usa_fac_id_fk):
        self.id_usuario_factura = usa_usu_id_fk
        self.id_usuario = usa_fac_id_fk

    def todic(self):
        return {
            "usuario_id": self.id_usuario_factura,
            "factura_id": self.id_usuario
        }
