import 'package:flutter/material.dart';
import '../models/pedido.dart';
import '../models/cliente.dart';
import '../services/api_services.dart';
import '../theme.dart';

class PedidosScreen extends StatefulWidget {
  final int refreshCount;
  const PedidosScreen({super.key, this.refreshCount = 0});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  final PedidoService _service = PedidoService();
  List<Pedido>? _pedidos;
  List<Cliente> _clientes = [];

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  @override
  void didUpdateWidget(PedidosScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshCount != oldWidget.refreshCount) {
      _cargar();
    }
  }

  Future<void> _cargar() async {
    final r = await Future.wait([_service.getPedidos(), ClienteService().getClientes()]);
    if (mounted) setState(() { _pedidos = r[0] as List<Pedido>; _clientes = r[1] as List<Cliente>; });
  }

  String _nombreCliente(String? id) {
    if (id == null) return 'N/A';
    final c = _clientes.cast<Cliente?>().firstWhere((c) => c!.id.toString() == id, orElse: () => null);
    return c?.nombreCompleto ?? 'Cliente $id';
  }

  @override
  Widget build(BuildContext context) {
    final pedidos = _pedidos;
    if (pedidos == null) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.blue600));
    }
    return RefreshIndicator(
      onRefresh: () async {
        final fresh = await _service.getPedidos();
        if (mounted) setState(() => _pedidos = fresh);
      },
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
        itemCount: pedidos.length,
        itemBuilder: (ctx, i) {
          final p = pedidos[i];
          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            margin: const EdgeInsets.only(bottom: 8),
            child: Container(
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(14),
                  bottomLeft: Radius.circular(14),
                ),
                border: Border(left: BorderSide(color: AppTheme.orange400, width: 4)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Pedido #${p.pedId}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slate800)),
                              const SizedBox(height: 4),
                              Text(p.fechaFormateada,
                                style: const TextStyle(fontSize: 12, color: AppTheme.slate400)),
                            ],
                          ),
                        ),
                        _badge(p.estadoEntrega),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.payment_outlined, size: 15, color: AppTheme.slate400),
                        const SizedBox(width: 4),
                        Text(p.metodoPago ?? 'N/A', style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
                        const SizedBox(width: 18),
                        const Icon(Icons.person_outline, size: 15, color: AppTheme.slate400),
                        const SizedBox(width: 4),
                        Expanded(child: Text(_nombreCliente(p.clienteId), style: const TextStyle(fontSize: 12, color: AppTheme.slate500), overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(p.totalFormateado,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.emerald600)),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _badge(String? estado) {
    Color color;
    Color bg;
    switch (estado) {
      case 'Entregado': color = AppTheme.emerald600; bg = AppTheme.emerald50; break;
      case 'Pendiente': color = const Color(0xFFD97706); bg = const Color(0xFFFEF3C7); break;
      case 'En camino': color = AppTheme.blue700; bg = AppTheme.blue50; break;
      case 'En preparación': color = const Color(0xFF7C3AED); bg = const Color(0xFFF5F3FF); break;
      case 'Anulado': color = AppTheme.red600; bg = AppTheme.red50; break;
      default: color = AppTheme.slate400; bg = AppTheme.slate50;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 7, height: 7, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
          const SizedBox(width: 5),
          Text(estado ?? 'N/A', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
