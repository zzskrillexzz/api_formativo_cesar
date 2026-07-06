class DashboardData {
  final int totalProductos;
  final int stockTotal;
  final int stockBajo;
  final int pedidosActivos;
  final int pedidosPendientes;
  final int vencimientosCriticos;
  final int alertasPendientes;
  final List<TopVendido> topVendidos;

  DashboardData({
    required this.totalProductos,
    required this.stockTotal,
    required this.stockBajo,
    required this.pedidosActivos,
    required this.pedidosPendientes,
    required this.vencimientosCriticos,
    required this.alertasPendientes,
    required this.topVendidos,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      totalProductos: json['productos']?['total'] ?? 0,
      stockTotal: json['productos']?['stock_total'] ?? 0,
      stockBajo: json['productos']?['stock_bajo'] ?? 0,
      pedidosActivos: json['pedidos']?['activos'] ?? 0,
      pedidosPendientes: json['pedidos']?['pendientes'] ?? 0,
      vencimientosCriticos: json['vencimientos']?['criticos'] ?? 0,
      alertasPendientes: json['alertas_pendientes'] ?? 0,
      topVendidos: (json['top_vendidos'] as List<dynamic>?)
              ?.map((e) => TopVendido.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class TopVendido {
  final String proId;
  final String nombre;
  final int totalVendido;

  TopVendido({
    required this.proId,
    required this.nombre,
    required this.totalVendido,
  });

  factory TopVendido.fromJson(Map<String, dynamic> json) {
    return TopVendido(
      proId: json['pro_id']?.toString() ?? '',
      nombre: json['nombre']?.toString() ?? '',
      totalVendido: (json['total_vendido'] as num?)?.toInt() ?? 0,
    );
  }
}
