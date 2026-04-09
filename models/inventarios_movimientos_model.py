class inventarios_movimientos:
    def __init__(self, inm_id, inm_tipo_movimiento, inm_pro_id_fk, inm_cantidad, inm_fecha, inm_motivo, inm_usu_id_fk, inm_lot_id_fk=None):
        self.inm_id = inm_id
        self.inm_tipo_movimiento = inm_tipo_movimiento
        self.inm_pro_id_fk = inm_pro_id_fk
        self.inm_cantidad = inm_cantidad
        self.inm_fecha = inm_fecha
        self.inm_motivo = inm_motivo
        self.inm_usu_id_fk = inm_usu_id_fk
        self.inm_lot_id_fk = inm_lot_id_fk

    def todic(self):
        return {
            "id": self.inm_id,
            "tipo_movimiento": self.inm_tipo_movimiento,
            "producto_id": self.inm_pro_id_fk,
            "cantidad": self.inm_cantidad,
            "fecha": str(self.inm_fecha) if self.inm_fecha else None,
            "motivo": self.inm_motivo,
            "usuario_id": self.inm_usu_id_fk,
            "lote_id": self.inm_lot_id_fk
        }