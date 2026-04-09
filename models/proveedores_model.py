class proveedores:
    def __init__(self, provID, provNit=None, provNombre=None, provTipo=None, provContacto=None, provDireccion=None, provEmail=None):
        self.prov_id = provID
        self.prov_nit = provNit
        self.prov_nombre = provNombre
        self.prov_tipo = provTipo
        self.prov_contacto = provContacto
        self.prov_direccion = provDireccion
        self.prov_email = provEmail

    def todic(self):
        return {
            "id": self.prov_id,
            "nit": self.prov_nit,
            "nombre": self.prov_nombre,
            "tipo": self.prov_tipo,
            "contacto": self.prov_contacto,
            "direccion": self.prov_direccion,
            "email": self.prov_email
        }
