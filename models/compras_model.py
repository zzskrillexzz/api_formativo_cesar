class compras:
    def __init__(self, com_id, com_fecha, com_prov_id_fk, com_usu_id_fk, com_total, com_estado, com_observacion):
        self.com_id = com_id
        self.com_fecha = com_fecha
        self.com_prov_id_fk = com_prov_id_fk
        self.com_usu_id_fk = com_usu_id_fk
        self.com_total = com_total
        self.com_estado = com_estado
        self.com_observacion = com_observacion
    
    def todic(self):
        return {
            "id": self.com_id,
            "fecha": str(self.com_fecha) if self.com_fecha else None,
            "proveedor_id": self.com_prov_id_fk,
            "usuario_id": self.com_usu_id_fk,
            "total": float(self.com_total) if self.com_total else None,
            "estado": self.com_estado,
            "observacion": self.com_observacion
        }