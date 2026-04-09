class proveedores_productos:
    def __init__(self, ppp_prov_id_fk, ppp_pro_id_fk):
        self.ppp_prov_id_fk = ppp_prov_id_fk
        self.ppp_pro_id_fk = ppp_pro_id_fk
    
    def todic(self):
        return {
            "proveedor_id": self.ppp_prov_id_fk,
            "producto_id": self.ppp_pro_id_fk
        }