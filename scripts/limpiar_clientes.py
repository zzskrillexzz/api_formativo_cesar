"""
Script para eliminar clientes con datos irreales.
Uso: cd Backend && python scripts/limpiar_clientes.py

Elimina:
  1. Clientes con correo inválido (sin @ o extremadamente largos)
  2. Clientes con teléfono con letras o más de 10 dígitos
  3. Clientes con nombres/apellidos con números o caracteres especiales
  4. Clientes con emojis en cualquier campo de texto
"""

import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import MySQLdb

conn = MySQLdb.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    passwd=os.getenv('MYSQL_PASSWORD', ''),
    port=int(os.getenv('MYSQL_PORT', 3307)),
    db=os.getenv('MYSQL_DB', 'db_drogueria_sandiego'),
    charset='utf8mb4'
)
c = conn.cursor()

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

NOMBRE_RE = re.compile(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$')
EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
TELEFONO_RE = re.compile(r'^[\d\s\+\-\(\)]+$')

print("=" * 60)
print("  LIMPIADOR DE CLIENTES — ANÁLISIS")
print("=" * 60)

ids_a_eliminar = set()
motivos = {}

c.execute("SELECT cli_id, cli_nombre, cli_apellido, cli_correo, cli_telefono, cli_direccion FROM t_cliente")
rows = c.fetchall()
c.close()

for cli_id, nombre, apellido, correo, telefono, direccion in rows:
    razones = []

    # Correo inválido
    if correo:
        if len(str(correo)) > 120:
            razones.append(f"correo muy largo ({len(str(correo))} chars)")
        elif not EMAIL_RE.match(str(correo)):
            razones.append(f"correo inválido: {correo}")
        if EMOJI_RE.search(str(correo)):
            razones.append("correo con emojis")

    # Teléfono con letras o muy largo
    if telefono:
        tel_str = str(telefono)
        if len(tel_str) > 10:
            razones.append(f"teléfono muy largo ({len(tel_str)} chars)")
        elif not TELEFONO_RE.match(tel_str):
            razones.append(f"teléfono con caracteres inválidos: {telefono}")
        if EMOJI_RE.search(tel_str):
            razones.append("teléfono con emojis")

    # Nombres con números o caracteres especiales
    if nombre and not NOMBRE_RE.match(str(nombre)):
        razones.append(f"nombre con caracteres inválidos: {nombre}")
    if nombre and EMOJI_RE.search(str(nombre)):
        razones.append("nombre con emojis")
    if apellido and not NOMBRE_RE.match(str(apellido)):
        razones.append(f"apellido con caracteres inválidos: {apellido}")
    if apellido and EMOJI_RE.search(str(apellido)):
        razones.append("apellido con emojis")

    # Dirección con emojis
    if direccion and EMOJI_RE.search(str(direccion)):
        razones.append("dirección con emojis")

    # Texto basura (más de 200 chars en cualquier campo)
    for campo, val, nombre_campo in [(nombre, 'nombre', 'cli_nombre'), (apellido, 'apellido', 'cli_apellido'), (direccion, 'dirección', 'cli_direccion')]:
        if val and len(str(val)) > 200:
            razones.append(f"{nombre_campo} muy largo ({len(str(val))} chars)")

    if razones:
        ids_a_eliminar.add(cli_id)
        motivos[cli_id] = razones

print(f"\nTotal clientes a eliminar: {len(ids_a_eliminar)}")
print("-" * 40)
for cid in sorted(ids_a_eliminar):
    print(f"  {cid}: {' | '.join(motivos[cid])}")
print("-" * 40)

if not ids_a_eliminar:
    print("\n✅ No hay clientes para limpiar. Todo en orden.")
    conn.close()
    sys.exit(0)

resp = input("\n⚠️  ¿Eliminar estos clientes? (SI/NO): ").strip().upper()
if resp != 'SI':
    print("Cancelado.")
    conn.close()
    sys.exit(0)

c2 = conn.cursor()
eliminadas = 0
errores = 0
for cid in ids_a_eliminar:
    try:
        c2.execute("DELETE FROM t_cliente WHERE cli_id = %s", (cid,))
        eliminadas += 1
    except Exception as e:
        errores += 1
        print(f"  ⚠️  No se pudo eliminar {cid}: {e}")

conn.commit()
c2.close()
conn.close()

print(f"\n✅ {eliminadas} clientes eliminados. {errores} errores (posibles FK en pedidos/facturas).")
if errores > 0:
    print("   Los clientes con error probablemente tienen pedidos o facturas asociados.")
    print("   Elimina primero esos pedidos/facturas o asígnalos a otro cliente.")
