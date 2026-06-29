"""Exportar la BD actual a BD_Distribuidora_SANDIEGO.sql"""
import MySQLdb

conn = MySQLdb.connect(host='localhost', user='root', port=3307, db='db_drogueria_sandiego', charset='utf8mb4')
c = conn.cursor()

# Obtener todas las tablas
c.execute("SHOW TABLES")
tables = [row[0] for row in c.fetchall()]

output_path = r"C:\App Facturación DSD\Backend\BD_Distribuidora_SANDIEGO.sql"

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("""/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

""")

    for table in tables:
        if table.startswith('v_'):
            # Vistas
            c.execute(f"SHOW CREATE VIEW `{table}`")
            row = c.fetchone()
            if row:
                f.write(f"\nDROP VIEW IF EXISTS `{table}`;\n")
                f.write(f"/*!50001 CREATE VIEW `{table}` AS {row[1]} */;\n")
            continue

        # Estructura de tabla
        c.execute(f"SHOW CREATE TABLE `{table}`")
        row = c.fetchone()
        f.write(f"\nDROP TABLE IF EXISTS `{table}`;\n")
        f.write(f"{row[1]};\n")

        # Datos
        c.execute(f"SELECT * FROM `{table}`")
        rows = c.fetchall()
        if rows:
            cols = [desc[0] for desc in c.description]
            f.write(f"\nINSERT INTO `{table}` (`{'`, `'.join(cols)}`) VALUES\n")
            values_list = []
            for r in rows:
                vals = []
                for v, col in zip(r, cols):
                    if v is None:
                        vals.append("NULL")
                    elif isinstance(v, (int, float)):
                        vals.append(str(v))
                    elif isinstance(v, bytes):
                        vals.append(f"'{v.decode('utf-8', errors='replace').replace(chr(39), chr(39)+chr(39))}'")
                    else:
                        vals.append(f"'{str(v).replace(chr(39), chr(39)+chr(39))}'")
                values_list.append(f"({', '.join(vals)})")
            f.write(",\n".join(values_list) + ";\n")

    f.write("""
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
""")

c.close()
conn.close()
print(f"✓ BD exportada → {output_path}")
print(f"  Tablas: {len(tables)}")
