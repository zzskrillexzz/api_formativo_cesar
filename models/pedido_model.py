class pedido:
    def __init__(self, ID, FECHA, METODO_DE_PAGO, ESTADO, TOTAL, ID_CLIENTE, DETALLES):
        self.ped_id = ID
        self.ped_fecha = FECHA
        self.ped_metodo_pago = METODO_DE_PAGO
        self.ped_estado_entrega = ESTADO
        self.ped_total = TOTAL
        self.ped_cli_id_fk = ID_CLIENTE
        self.ped_det_id_fk = DETALLES

    def a_diccionario(self):
        return{
            "id": int(self.ped_id) if self.ped_id is not None else None,
            "fecha": str(self.ped_fecha),
            "metodo_de_pag": self.ped_metodo_pago,
            "estado": self.ped_estado_entrega,
            "total": float(self.ped_total),
            "cliente" : self.ped_cli_id_fk,
            "detalles" : self.ped_det_id_fk
        }