from .cliente import clientes_bp
from .pedido import pedido_bp
from .factura import facturas_bp
from .producto import productos_bp
from .detalle_de_pedido_route import detalles_bp
from .proveedor import proveedores_bp
from .inventario_movimiento import inventario_bp
#from .usuario import usuarios_bp

def cargarruta(app):
    app.register_blueprint(clientes_bp, url_prefix='/clientes')
    app.register_blueprint(pedido_bp, url_prefix='/pedidos')
    app.register_blueprint(facturas_bp, url_prefix='/facturas')
    app.register_blueprint(productos_bp, url_prefix='/productos')
    app.register_blueprint(detalles_bp, url_prefix='/detalles')
    app.register_blueprint(proveedores_bp, url_prefix='/proveedores')
    app.register_blueprint(inventario_bp, url_prefix='/inventario')
#    app.register_blueprint(usuarios_bp, url_prefix='/usuarios')