class detalles_compras:
    def __init__(self, dco_id, dco_com_id_fk, dco_pro_id_fk, dco_lot_id_fk, dco_cantidad, dco_precio_compra, dco_subtotal):
        self.dco_id = dco_id
        self.dco_com_id_fk = dco_com_id_fk
        self.dco_pro_id_fk = dco_pro_id_fk
        self.dco_lot_id_fk = dco_lot_id_fk
        self.dco_cantidad = dco_cantidad
        self.dco_precio_compra = dco_precio_compra
        self.dco_subtotal = dco_subtotal
    
    def todic(self):
        return {
            "id": self.dco_id,
            "compra_id": self.dco_com_id_fk,
            "producto_id": self.dco_pro_id_fk,
            "lote_id": self.dco_lot_id_fk,
            "cantidad": self.dco_cantidad,
            "precio_compra": float(self.dco_precio_compra) if self.dco_precio_compra else None,
            "subtotal": float(self.dco_subtotal) if self.dco_subtotal else None
        }