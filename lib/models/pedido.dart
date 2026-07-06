import 'package:intl/intl.dart';

class Pedido {
  final String pedId;
  final String? fecha;
  final String? metodoPago;
  final String? cuentaBancaria;
  final String? estadoEntrega;
  final double? total;
  final String? clienteId;

  Pedido({
    required this.pedId,
    this.fecha,
    this.metodoPago,
    this.cuentaBancaria,
    this.estadoEntrega,
    this.total,
    this.clienteId,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    String? fechaStr = json['ped_fecha']?.toString();
    if (fechaStr != null && fechaStr.contains(' ')) {
      fechaStr = fechaStr.split(' ')[0];
    }

    return Pedido(
      pedId: json['ped_id']?.toString() ?? '',
      fecha: fechaStr,
      metodoPago: json['ped_metodo_pago']?.toString(),
      cuentaBancaria: json['ped_cuenta_bancaria']?.toString(),
      estadoEntrega: json['ped_estado_entrega']?.toString(),
      total: (json['ped_total'] != null) ? (json['ped_total'] as num).toDouble() : null,
      clienteId: json['ped_cli_id_fk']?.toString(),
    );
  }

  String get fechaFormateada {
    if (fecha == null) return 'Sin fecha';
    try {
      final date = DateTime.parse(fecha!);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (_) {
      return fecha!;
    }
  }

  String get totalFormateado {
    if (total == null) return '\$0';
    return '\$ ${NumberFormat('#,##0').format(total)}';
  }
}
