class usuario_factura:
    def __init__(self, usa_usu_id_fk, usa_fac_id_fk):
        self.usu_id_fk = usa_usu_id_fk
        self.fac_id_fk = usa_fac_id_fk

    def todic(self):
        return {
            "usa_usu_id_fk": self.usu_id_fk,
            "usa_fac_id_fk": self.fac_id_fk
        }
