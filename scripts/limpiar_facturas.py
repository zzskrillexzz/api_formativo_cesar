"""
Script para eliminar facturas con datos irreales o huérfanas.
Uso: cd Backend && python scripts/limpiar_facturas.py

Elimina:
  1. Facturas cuyo fac_id no existe en t_pedido (huérfanas)
  2. Facturas cuyo fac_cli_id_fk no existe en t_cliente
  3. Facturas con texto basura (más de 100 caracteres en forma_pago o cuenta_bancaria)
  4. Facturas con emojis en campos de texto

Antes de eliminar, muestra un resumen y pide confirmación.
"""

import os
import sys
import re

# Asegurar que podemos importar los módulos del backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import MySQLdb

# ── Conexión ──
conn = MySQLdb.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    passwd=os.getenv('MYSQL_PASSWORD', ''),
    port=int(os.getenv('MYSQL_PORT', 3307)),
    db=os.getenv('MYSQL_DB', 'db_drogueria_sandiego'),
    charset='utf8mb4'
)
c = conn.cursor()

# ── Emoji pattern ──
EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "\U00002600-\U000026FF"
    "\U0000FE00-\U0000FE0F"
    "\U0000200D"
    "]+"
)

print("=" * 60)
print("  LIMPIADOR DE FACTURAS — ANÁLISIS")
print("=" * 60)

ids_a_eliminar = set()
motivos = {}

# 1. Huérfanas sin pedido
c.execute("""
    SELECT f.fac_id FROM t_factura f
    LEFT JOIN t_pedido p ON f.fac_id = p.ped_id
    WHERE p.ped_id IS NULL
""")
huerfanas_pedido = [r[0] for r in c.fetchall()]
for fid in huerfanas_pedido:
    ids_a_eliminar.add(fid)
    motivos[fid] = motivos.get(fid, []) + ["sin pedido asociado"]

# 2. Cliente inexistente (si tiene fac_cli_id_fk)
try:
    c.execute("""
        SELECT f.fac_id FROM t_factura f
        LEFT JOIN t_cliente cl ON f.fac_cli_id_fk = cl.cli_id
        WHERE f.fac_cli_id_fk IS NOT NULL AND cl.cli_id IS NULL
    """)
    huerfanas_cliente = [r[0] for r in c.fetchall()]
    for fid in huerfanas_cliente:
        ids_a_eliminar.add(fid)
        motivos[fid] = motivos.get(fid, []) + ["cliente inexistente"]
except Exception:
    pass  # Columna fac_cli_id_fk puede no existir

# 3. Texto basura en fac_forma_pago (>100 chars o emojis)
c.execute("SELECT fac_id, fac_forma_pago FROM t_factura")
for fid, forma_pago in c.fetchall():
    if forma_pago:
        if len(str(forma_pago)) > 100:
            ids_a_eliminar.add(fid)
            motivos[fid] = motivos.get(fid, []) + [f"forma_pago muy largo ({len(str(forma_pago))} chars)"]
        if EMOJI_RE.search(str(forma_pago)):
            ids_a_eliminar.add(fid)
            motivos[fid] = motivos.get(fid, []) + ["forma_pago con emojis"]

# 4. Texto basura en fac_cuenta_bancaria (>100 chars o emojis)
try:
    c.execute("SELECT fac_id, fac_cuenta_bancaria FROM t_factura")
    for fid, cuenta in c.fetchall():
        if cuenta:
            if len(str(cuenta)) > 100:
                ids_a_eliminar.add(fid)
                motivos[fid] = motivos.get(fid, []) + [f"cuenta_bancaria muy larga ({len(str(cuenta))} chars)"]
            if EMOJI_RE.search(str(cuenta)):
                ids_a_eliminar.add(fid)
                motivos[fid] = motivos.get(fid, []) + ["cuenta_bancaria con emojis"]
except Exception:
    pass

c.close()

print(f"\nTotal facturas a eliminar: {len(ids_a_eliminar)}")
print("-" * 40)
for fid in sorted(ids_a_eliminar):
    print(f"  {fid}: {' | '.join(motivos[fid])}")
print("-" * 40)

if not ids_a_eliminar:
    print("\n✅ No hay facturas para limpiar. Todo en orden.")
    conn.close()
    sys.exit(0)

resp = input("\n⚠️  ¿Eliminar estas facturas? (SI/NO): ").strip().upper()
if resp != 'SI':
    print("Cancelado.")
    conn.close()
    sys.exit(0)

# ── Eliminar ──
c2 = conn.cursor()
eliminadas = 0
for fid in ids_a_eliminar:
    try:
        c2.execute("DELETE FROM t_factura WHERE fac_id = %s", (fid,))
        eliminadas += 1
    except Exception as e:
        print(f"  ⚠️  No se pudo eliminar {fid}: {e}")

conn.commit()
c2.close()
conn.close()

print(f"\n✅ {eliminadas} facturas eliminadas correctamente.")
