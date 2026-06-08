"""
Tareas automáticas del sistema — APScheduler.

Tareas:
  - Alertas de vencimiento (diaria): escanea t_lote buscando lotes activos
    próximos a vencer y genera alertas en t_alerta_vencimiento.
  - Backup de base de datos (diaria): ejecuta mysqldump y conserva los
    últimos 7 backups.
"""

import os
import subprocess
import logging
from datetime import date, datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app

log = logging.getLogger(__name__)

# ── Configuración ──
DIAS_ALERTA = int(os.getenv('ALERTA_DIAS', '30'))  # Configurable por .env
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backups')
MAX_BACKUPS = 7

_scheduler: BackgroundScheduler | None = None


# ═══════════════════════════════════════════════════════════════════
#  ALERTAS DE VENCIMIENTO
# ═══════════════════════════════════════════════════════════════════

def _generar_id_alerta(c):
    """Genera el siguiente ID de alerta secuencial."""
    c.execute(
        "SELECT alv_id FROM t_alerta_vencimiento "
        "ORDER BY LENGTH(alv_id) DESC, alv_id DESC LIMIT 1"
    )
    row = c.fetchone()
    if row:
        last_id = row[0]
        num_str = last_id[3:]  # "ALV" + número
        try:
            last_num = int(num_str)
            return f"ALV{last_num + 1:03d}"
        except ValueError:
            pass
    return "ALV001"


def tarea_alertas_vencimiento():
    """
    Escanea t_lote buscando lotes activos con fecha de vencimiento
    dentro de DIAS_ALERTA días y sin alerta ya generada. Crea una
    alerta en t_alerta_vencimiento por cada lote encontrado.
    """
    try:
        from flask import current_app as ctx
        app = ctx._get_current_object()
        with app.app_context():
            c = app.mysql.connection.cursor()

            hoy = date.today()
            limite = hoy + timedelta(days=DIAS_ALERTA)

            # Buscar lotes activos próximos a vencer que NO tengan alerta pendiente
            c.execute("""
                SELECT l.lot_id, l.lot_pro_id_fk, l.lot_fecha_vencimiento,
                       DATEDIFF(l.lot_fecha_vencimiento, CURDATE()) AS dias
                FROM t_lote l
                WHERE l.lot_estado = 'Activo'
                  AND l.lot_fecha_vencimiento <= %s
                  AND l.lot_fecha_vencimiento > CURDATE()
                  AND l.lot_id NOT IN (
                      SELECT alv_lot_id_fk FROM t_alerta_vencimiento
                      WHERE alv_estado = 'Pendiente'
                  )
                ORDER BY l.lot_fecha_vencimiento ASC
            """, (limite,))

            lotes = c.fetchall()
            creadas = 0

            for lot_id, pro_id, fecha_venc, dias in lotes:
                alv_id = _generar_id_alerta(c)
                c.execute("""
                    INSERT INTO t_alerta_vencimiento
                        (alv_id, alv_pro_id_fk, alv_lot_id_fk, alv_fecha_generacion,
                         alv_fecha_vencimiento, alv_dias_restantes, alv_estado)
                    VALUES (%s, %s, %s, CURDATE(), %s, %s, 'Pendiente')
                """, (alv_id, pro_id, lot_id, fecha_venc, dias))
                creadas += 1

            app.mysql.connection.commit()
            c.close()

            if creadas > 0:
                log.info("Alertas de vencimiento: %d alerta(s) generada(s) (umbral %d días).",
                         creadas, DIAS_ALERTA)
            else:
                log.debug("Alertas de vencimiento: sin novedades.")

    except Exception as e:
        log.error("Error en tarea de alertas de vencimiento: %s", e, exc_info=True)


# ═══════════════════════════════════════════════════════════════════
#  BACKUP DE BASE DE DATOS
# ═══════════════════════════════════════════════════════════════════

def tarea_backup_bd():
    """
    Ejecuta mysqldump de la base de datos configurada y conserva
    los últimos MAX_BACKUPS archivos.
    """
    try:
        from flask import current_app as ctx
        app = ctx._get_current_object()

        os.makedirs(BACKUP_DIR, exist_ok=True)

        # Leer credenciales desde la config de Flask
        db_host = app.config.get('MYSQL_HOST', 'localhost')
        db_port = str(app.config.get('MYSQL_PORT', 3306))
        db_user = app.config.get('MYSQL_USER', 'root')
        db_pass = app.config.get('MYSQL_PASSWORD', '')
        db_name = app.config.get('MYSQL_DB', 'db_drogueria_sandiego')

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"backup_{db_name}_{timestamp}.sql"
        filepath = os.path.join(BACKUP_DIR, filename)

        mysqldump_path = os.getenv('MYSQLDUMP_PATH', 'mysqldump')

        cmd = [
            mysqldump_path,
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
        ]
        if db_pass:
            cmd.append(f'--password={db_pass}')
        cmd.extend([
            '--single-transaction',
            '--routines',
            '--triggers',
            '--events',
            db_name,
        ])

        with open(filepath, 'w', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True, timeout=300)

        if result.returncode != 0:
            log.error("Backup BD: mysqldump falló — %s", result.stderr.strip())
            return

        # Rotar: conservar solo los últimos MAX_BACKUPS
        backups = sorted(
            [f for f in os.listdir(BACKUP_DIR) if f.endswith('.sql')],
            reverse=True
        )
        for old in backups[MAX_BACKUPS:]:
            os.remove(os.path.join(BACKUP_DIR, old))
            log.debug("Backup BD: eliminado antiguo %s", old)

        log.info("Backup BD: %s generado (%d backups conservados).",
                 filename, min(len(backups), MAX_BACKUPS))

    except FileNotFoundError:
        log.warning(
            "Backup BD: mysqldump no encontrado. Instálalo o configura "
            "MYSQLDUMP_PATH en .env"
        )
    except Exception as e:
        log.error("Error en tarea de backup BD: %s", e, exc_info=True)


# ═══════════════════════════════════════════════════════════════════
#  INICIALIZACIÓN
# ═══════════════════════════════════════════════════════════════════

def iniciar_scheduler(app):
    """
    Arranca el scheduler con las tareas programadas.
    Se llama desde app.py después de registrar los blueprints.
    """
    global _scheduler

    if _scheduler is not None:
        return  # Ya iniciado

    _scheduler = BackgroundScheduler(daemon=True)

    # ── Alertas de vencimiento: todos los días a las 06:00 ──
    _scheduler.add_job(
        tarea_alertas_vencimiento,
        trigger='cron',
        hour=6,
        minute=0,
        id='alertas_vencimiento',
        name='Alertas de vencimiento',
        replace_existing=True,
    )

    # ── Backup de BD: todos los días a las 02:00 ──
    _scheduler.add_job(
        tarea_backup_bd,
        trigger='cron',
        hour=2,
        minute=0,
        id='backup_bd',
        name='Backup de base de datos',
        replace_existing=True,
    )

    _scheduler.start()
    log.info("Scheduler iniciado — %d tarea(s) programada(s).",
             len(_scheduler.get_jobs()))


def detener_scheduler():
    """Detiene el scheduler (para tests o apagado limpio)."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        log.info("Scheduler detenido.")
