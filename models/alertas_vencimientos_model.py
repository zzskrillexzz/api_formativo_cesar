class alertas_vencimientos:
    def __init__(self, alv_id, alv_pro_id_fk, alv_lot_id_fk, alv_fecha_generacion, alv_fecha_vencimiento, alv_dias_restantes, alv_estado, alv_usu_id_fk):
        self.alv_id = alv_id
        self.alv_pro_id_fk = alv_pro_id_fk
        self.alv_lot_id_fk = alv_lot_id_fk
        self.alv_fecha_generacion = alv_fecha_generacion
        self.alv_fecha_vencimiento = alv_fecha_vencimiento
        self.alv_dias_restantes = alv_dias_restantes
        self.alv_estado = alv_estado
        self.alv_usu_id_fk = alv_usu_id_fk
    
    def todic(self):
        return {
            "id": self.alv_id,
            "producto_id": self.alv_pro_id_fk,
            "lote_id": self.alv_lot_id_fk,
            "fecha_generacion": str(self.alv_fecha_generacion) if self.alv_fecha_generacion else None,
            "fecha_vencimiento": str(self.alv_fecha_vencimiento) if self.alv_fecha_vencimiento else None,
            "dias_restantes": self.alv_dias_restantes,
            "estado": self.alv_estado,
            "usuario_id": self.alv_usu_id_fk
        }