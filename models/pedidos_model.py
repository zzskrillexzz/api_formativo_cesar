class pedidos:
    def __init__(self, ID, FECHA, METODO_DE_PAGO, ESTADO, TOTAL, ID_CLIENTE, ped_usu_id_fk=None):
        self.ped_id = ID
        self.ped_fecha = FECHA
        self.ped_metodo_pago = METODO_DE_PAGO
        self.ped_estado_entrega = ESTADO
        self.ped_total = TOTAL
        self.ped_cli_id_fk = ID_CLIENTE
        self.ped_usu_id_fk = ped_usu_id_fk

    def a_diccionario(self):
        return {
            "id": self.ped_id,
            "fecha": str(self.ped_fecha),
            "metodo_de_pago": self.ped_metodo_pago,
            "estado": self.ped_estado_entrega,
            "total": float(self.ped_total) if self.ped_total else None,
            "cliente": self.ped_cli_id_fk,
            "usuario_id": self.ped_usu_id_fk
        }
