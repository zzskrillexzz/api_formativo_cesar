class mas_vendidos:
    def __init__(self, pro_id, pro_nombre, total_unidades, total_ingresos=0):
        self.pro_id = pro_id
        self.pro_nombre = pro_nombre
        # Convertir Decimal/None a int/float para JSON limpio
        self.total_vendido = int(total_unidades) if total_unidades is not None else 0
        self.total_ingresos = float(total_ingresos) if total_ingresos is not None else 0.0

    def todic(self):
        return {
            "producto_id": self.pro_id,
            "nombre": self.pro_nombre,
            "total_vendido": self.total_vendido,
            "total_ingresos": self.total_ingresos
        }

    @staticmethod
    def get_all(mysql):
        cur = mysql.connection.cursor()
        cur.execute("SELECT pro_id, pro_nombre, total_unidades_vendidas, total_ingresos FROM v_mas_vendidos ORDER BY total_unidades_vendidas DESC")
        rows = cur.fetchall()
        cur.close()
        
        resultados = []
        for row in rows:
            item = mas_vendidos(
                pro_id=row[0],
                pro_nombre=row[1],
                total_unidades=row[2],
                total_ingresos=row[3] if len(row) > 3 else 0
            )
            resultados.append(item.todic())
        return resultados