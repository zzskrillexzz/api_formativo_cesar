class reportes:
    def __init__(self, rep_id, rep_tipo, rep_fecha, rep_parametros, rep_usu_id_fk, rep_resultado):
        self.rep_id = rep_id
        self.rep_tipo = rep_tipo
        self.rep_fecha = rep_fecha
        self.rep_parametros = rep_parametros
        self.rep_usu_id_fk = rep_usu_id_fk
        self.rep_resultado = rep_resultado
    
    def todic(self):
        return {
            "id": self.rep_id,
            "tipo": self.rep_tipo,
            "fecha": str(self.rep_fecha) if self.rep_fecha else None,
            "parametros": self.rep_parametros,
            "usuario_id": self.rep_usu_id_fk,
            "resultado": self.rep_resultado
        }