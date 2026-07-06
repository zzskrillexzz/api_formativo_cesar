class Producto {
  final String id;
  final String nombre;
  final String categoria;
  final String descripcion;
  final double? precio;
  final String estado;

  Producto({
    required this.id,
    required this.nombre,
    required this.categoria,
    required this.descripcion,
    this.precio,
    required this.estado,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id']?.toString() ?? '',
      nombre: json['nombre']?.toString() ?? '',
      categoria: json['categoria']?.toString() ?? '',
      descripcion: json['descripcion']?.toString() ?? '',
      precio: (json['precio'] != null) ? (json['precio'] as num).toDouble() : null,
      estado: json['estado']?.toString() ?? '',
    );
  }
}
