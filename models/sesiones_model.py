class sesiones:
    def __init__(self, ses_id, ses_usu_id_fk, ses_fecha_inicio, ses_fecha_fin, ses_ip, ses_activa):
        self.ses_id = ses_id
        self.ses_usu_id_fk = ses_usu_id_fk
        self.ses_fecha_inicio = ses_fecha_inicio
        self.ses_fecha_fin = ses_fecha_fin
        self.ses_ip = ses_ip
        self.ses_activa = ses_activa
    
    def todic(self):
        return {
            "id": self.ses_id,
            "usuario_id": self.ses_usu_id_fk,
            "fecha_inicio": str(self.ses_fecha_inicio) if self.ses_fecha_inicio else None,
            "fecha_fin": str(self.ses_fecha_fin) if self.ses_fecha_fin else None,
            "ip": self.ses_ip,
            "activa": self.ses_activa
        }