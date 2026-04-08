class productos:
    def __init__(self, proID, proCategoria, proCantidad, proPrecio, proNombre, proFechaCaducidad, proDescripcion, proIDprovedor, proIDdetalle):
        self.Pro_id = proID
        self.Pro_categoria = proCategoria
        self.Pro_cantidad_disponible = proCantidad
        self.Pro_precio = proPrecio
        self.Pro_nombre = proNombre
        self.Pro_fecha_caducidad = proFechaCaducidad
        self.Pro_descripcion = proDescripcion
        self.Pro_prov_id_fk = proIDprovedor
        self.pro_det_id_fk =  proIDdetalle
        
    def toDic(self):
        return {
            'Pro_id': self.Pro_id,
            'Pro_categoria': self.Pro_categoria,
            'Pro_cantidad_disponible': self.Pro_cantidad_disponible,
            'Pro_precio': self.Pro_precio,
            'Pro_nombre': self.Pro_nombre,
            'Pro_fecha_caducidad': self.Pro_fecha_caducidad,
            'Pro_descripcion': self.Pro_descripcion,
            'Pro_prov_id_fk': self.Pro_prov_id_fk,
            'pro_det_id_fk': self.pro_det_id_fk
        }
        