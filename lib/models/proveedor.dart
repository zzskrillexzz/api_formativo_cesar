class Proveedor {
  final String id;
  final String nombre;

  Proveedor({required this.id, required this.nombre});

  factory Proveedor.fromJson(Map<String, dynamic> json) {
    return Proveedor(
      id: json['prov_id']?.toString() ?? '',
      nombre: json['prov_nombre']?.toString() ?? '',
    );
  }
}
