import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/dashboard_data.dart';
import '../providers/auth_provider.dart';
import '../services/api_services.dart';
import '../theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ProductoService _service = ProductoService();
  DashboardData? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final data = await _service.getDashboardResumen();
    if (mounted) {
      setState(() {
        _data = data;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final now = DateTime.now();
    final hour = now.hour;
    final greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    final fecha = '${days[now.weekday % 7]}, ${now.day} de ${months[now.month - 1]} de ${now.year}';

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _data == null
                ? _buildError()
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildHeader(greeting, auth.userName, fecha, _data!),
                      const SizedBox(height: 20),
                      _buildMetricsGrid(_data!),
                      const SizedBox(height: 24),
                      _buildSectionTitle(Icons.trending_up, 'Más Vendidos', AppTheme.emerald600),
                      const SizedBox(height: 8),
                      _buildTopVendidos(_data!.topVendidos),
                      const SizedBox(height: 24),
                      _buildSectionTitle(Icons.warning_amber, 'Alertas de Vencimientos', AppTheme.amber600),
                      const SizedBox(height: 8),
                      _buildAlertasCard(_data!),
                    ],
                  ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppTheme.slate400),
          const SizedBox(height: 16),
          const Text('Error al cargar datos', style: TextStyle(color: AppTheme.slate600)),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: _loadData, child: const Text('Reintentar')),
        ],
      ),
    );
  }

  Widget _buildHeader(String greeting, String name, String fecha, DashboardData d) {
    final vCriticos = d.vencimientosCriticos;
    final dotColor = vCriticos == 0 ? const Color(0xFF34D399) : vCriticos <= 3 ? const Color(0xFFFCD34D) : const Color(0xFFFCA5A5);
    final bgColor = vCriticos == 0 ? const Color(0x3310B981) : vCriticos <= 3 ? const Color(0x33F59E0B) : const Color(0x33EF4444);
    final textColor = vCriticos == 0 ? const Color(0xCCD1FAE5) : vCriticos <= 3 ? const Color(0xCCFEF3C7) : const Color(0xCCFEE2E2);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.gradientHeader,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppTheme.blue700.withAlpha(80),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$greeting, $name',
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            '$fecha · Panel de Control',
            style: const TextStyle(color: Color(0xCCDBEAFE), fontSize: 12, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(20)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: dotColor),
                ),
                const SizedBox(width: 6),
                Text(
                  '$vCriticos vencimientos críticos',
                  style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(DashboardData d) {
    final gridWidth = MediaQuery.of(context).size.width - 32;
    final cardWidth = (gridWidth - 10) / 2;
    final cardHeight = cardWidth / 1.45;

    return SizedBox(
      height: (cardHeight + 10) * 2,
      child: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(child: _metricCard('Productos', '${d.totalProductos}', Icons.inventory_2, AppTheme.emerald600, AppTheme.emerald50, '${d.totalProductos} registrados')),
                const SizedBox(width: 10),
                Expanded(child: _metricCard('Stock Total', '${d.stockTotal}', Icons.trending_up, AppTheme.blue600, AppTheme.blue50, d.stockBajo > 0 ? '${d.stockBajo} con stock bajo' : 'Stock estable')),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Row(
              children: [
                Expanded(child: _metricCard('Pedidos Activos', '${d.pedidosActivos}', Icons.shopping_cart, const Color(0xFF6366F1), AppTheme.indigo50, '${d.pedidosPendientes} pendientes')),
                const SizedBox(width: 10),
                Expanded(child: _metricCard('Vencimientos', '${d.vencimientosCriticos}', Icons.schedule, AppTheme.amber600, AppTheme.amber50, '${d.alertasPendientes} alertas pendientes')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static const _cardDecoration = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.all(Radius.circular(12)),
    border: Border.fromBorderSide(BorderSide(color: Color(0x1A000000), width: 0.5)),
    boxShadow: [BoxShadow(color: Color(0x08000000), blurRadius: 4, offset: Offset(0, 2))],
  );

  Widget _metricCard(String title, String value, IconData icon, Color iconColor, Color bgColor, String? trend) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: AppTheme.slate400, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: iconColor),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: iconColor)),
              if (trend != null)
                Text(trend, style: const TextStyle(fontSize: 10, color: AppTheme.slate400, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title, Color color) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slate800)),
      ],
    );
  }

  Widget _buildTopVendidos(List<TopVendido> items) {
    if (items.isEmpty) {
      return _emptyCard('Sin datos de ventas');
    }
    final maxValue = items.map((e) => e.totalVendido).reduce((a, b) => a > b ? a : b);
    const medals = ['🥇', '🥈', '🥉'];
    const rankBgColors = [
      Color(0x33F59E0B), Color(0x33CBD5E1), Color(0x33F97316),
      Color(0x33F1F5F9), Color(0x33F1F5F9),
    ];
    const barColors = [
      Color(0xFFFBBF24), Color(0xFFCBD5E1), Color(0xFFF97316),
      Color(0xFF60A5FA), Color(0xFFA78BFA),
    ];

    final top5 = items.take(5).toList();
    final childCount = top5.length;

    return Container(
      decoration: _cardDecoration,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: List.generate(childCount, (i) {
          final item = top5[i];
          final pct = maxValue > 0 ? (item.totalVendido / maxValue) * 100 : 0.0;
          return Padding(
            padding: EdgeInsets.only(bottom: i < childCount - 1 ? 10 : 0),
            child: Row(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(color: rankBgColors[i], borderRadius: BorderRadius.circular(6)),
                  alignment: Alignment.center,
                  child: Text(
                    i < 3 ? medals[i] : '#${i + 1}',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.nombre,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.slate800),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: pct / 100,
                          backgroundColor: const Color(0xFFE2E8F0),
                          color: barColors[i],
                          minHeight: 4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${item.totalVendido}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slate600),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildAlertasCard(DashboardData d) {
    return Container(
      decoration: _cardDecoration,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                const Icon(Icons.schedule, size: 16, color: AppTheme.emerald600),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: AppTheme.emerald50, borderRadius: BorderRadius.circular(6)),
                    child: const Text('Óptimas', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.emerald600)),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppTheme.red50, borderRadius: BorderRadius.circular(6)),
                  child: Text('${d.vencimientosCriticos} críticas', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.red600)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          _buildAlertRow('Vencimientos ≤ 30 días', '${d.vencimientosCriticos}', isCritical: true),
          _buildAlertRow('Alertas pendientes', '${d.alertasPendientes}', isWarning: true),
          _buildAlertRow('Stock bajo', '${d.stockBajo}', isWarning: true),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildAlertRow(String label, String value, {bool isCritical = false, bool isWarning = false}) {
    final color = isCritical ? AppTheme.red600 : isWarning ? AppTheme.amber600 : AppTheme.emerald600;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.slate600, fontWeight: FontWeight.w500))),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _emptyCard(String message) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: _cardDecoration,
      child: const Center(
        child: Column(
          children: [
            Icon(Icons.inventory_2_outlined, size: 32, color: AppTheme.slate400),
            SizedBox(height: 8),
            Text('Sin datos de ventas', style: TextStyle(fontSize: 13, color: AppTheme.slate400)),
          ],
        ),
      ),
    );
  }
}
