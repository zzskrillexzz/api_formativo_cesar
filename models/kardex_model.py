class kardex:
    def __init__(self, kar_id, kar_pro_id_fk, kar_lot_id_fk, kar_inm_id_fk, kar_fecha, kar_tipo, kar_cantidad, kar_saldo_anterior, kar_saldo_actual, kar_costo_unitario, kar_costo_total):
        self.kar_id = kar_id
        self.kar_pro_id_fk = kar_pro_id_fk
        self.kar_lot_id_fk = kar_lot_id_fk
        self.kar_inm_id_fk = kar_inm_id_fk
        self.kar_fecha = kar_fecha
        self.kar_tipo = kar_tipo
        self.kar_cantidad = kar_cantidad
        self.kar_saldo_anterior = kar_saldo_anterior
        self.kar_saldo_actual = kar_saldo_actual
        self.kar_costo_unitario = kar_costo_unitario
        self.kar_costo_total = kar_costo_total
    
    def todic(self):
        return {
            "id": self.kar_id,
            "producto_id": self.kar_pro_id_fk,
            "lote_id": self.kar_lot_id_fk,
            "movimiento_id": self.kar_inm_id_fk,
            "fecha": str(self.kar_fecha) if self.kar_fecha else None,
            "tipo": self.kar_tipo,
            "cantidad": self.kar_cantidad,
            "saldo_anterior": self.kar_saldo_anterior,
            "saldo_actual": self.kar_saldo_actual,
            "costo_unitario": float(self.kar_costo_unitario) if self.kar_costo_unitario else None,
            "costo_total": float(self.kar_costo_total) if self.kar_costo_total else None
        }