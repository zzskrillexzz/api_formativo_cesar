class anulaciones_ventas:
    def __init__(self, anu_id, anu_fac_id_fk, anu_usu_id_fk, anu_fecha, anu_motivo):
        self.anu_id = anu_id
        self.anu_fac_id_fk = anu_fac_id_fk
        self.anu_usu_id_fk = anu_usu_id_fk
        self.anu_fecha = anu_fecha
        self.anu_motivo = anu_motivo
    
    def todic(self):
        return {
            "id": self.anu_id,
            "factura_id": self.anu_fac_id_fk,
            "usuario_id": self.anu_usu_id_fk,
            "fecha": str(self.anu_fecha) if self.anu_fecha else None,
            "motivo": self.anu_motivo
        }