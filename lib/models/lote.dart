class Lote {
  final String id;
  final String numero;
  final String? fechaFabricacion;
  final String fechaVencimiento;
  final int cantidadInicial;
  final int cantidadActual;
  final String? productoId;
  final String? proveedorId;
  final String estado;

  Lote({
    required this.id,
    required this.numero,
    this.fechaFabricacion,
    required this.fechaVencimiento,
    required this.cantidadInicial,
    required this.cantidadActual,
    this.productoId,
    this.proveedorId,
    required this.estado,
  });

  factory Lote.fromJson(Map<String, dynamic> json) {
    return Lote(
      id: json['lot_id']?.toString() ?? '',
      numero: json['lot_numero']?.toString() ?? '',
      fechaFabricacion: json['lot_fecha_fabricacion']?.toString(),
      fechaVencimiento: json['lot_fecha_vencimiento']?.toString() ?? '',
      cantidadInicial: (json['lot_cantidad_inicial'] is int)
          ? json['lot_cantidad_inicial']
          : int.tryParse(json['lot_cantidad_inicial']?.toString() ?? '0') ?? 0,
      cantidadActual: (json['lot_cantidad_actual'] is int)
          ? json['lot_cantidad_actual']
          : int.tryParse(json['lot_cantidad_actual']?.toString() ?? '0') ?? 0,
      productoId: json['lot_pro_id_fk']?.toString(),
      proveedorId: json['lot_prov_id_fk']?.toString(),
      estado: json['lot_estado']?.toString() ?? 'Activo',
    );
  }

  int get porcentajeConsumo {
    if (cantidadInicial == 0) return 100;
    final usado = cantidadInicial - cantidadActual;
    return ((usado / cantidadInicial) * 100).round().clamp(0, 100);
  }

  int get diasRestantes {
    if (fechaVencimiento.isEmpty) return 9999;
    final venc = DateTime.tryParse(fechaVencimiento);
    if (venc == null) return 9999;
    return venc.difference(DateTime.now()).inDays;
  }
}
