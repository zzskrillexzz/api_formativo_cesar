import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/lote.dart';
import '../models/producto.dart';
import '../models/proveedor.dart';
import '../services/api_services.dart';
import '../theme.dart';

class LotesScreen extends StatefulWidget {
  final int refreshCount;
  const LotesScreen({super.key, this.refreshCount = 0});

  @override
  State<LotesScreen> createState() => _LotesScreenState();
}

class _LotesScreenState extends State<LotesScreen> {
  final LoteService _service = LoteService();
  List<Lote> _lotes = [];
  List<Lote> _filtered = [];
  bool _loading = true;
  String _searchQuery = '';
  String _estadoFilter = '';
  String? _error;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadLotes();
  }

  @override
  void didUpdateWidget(LotesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshCount != oldWidget.refreshCount) {
      _loadLotes();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadLotes() async {
    try {
      final lotes = await _service.getLotes();
      if (mounted) {
        setState(() {
          _lotes = lotes;
          _applyFilters();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    var result = _lotes;
    if (_searchQuery.isNotEmpty) {
      result = result.where((l) =>
          l.id.toLowerCase().contains(_searchQuery) ||
          l.numero.toLowerCase().contains(_searchQuery) ||
          (l.productoId?.toLowerCase().contains(_searchQuery) ?? false)).toList();
    }
    if (_estadoFilter.isNotEmpty) {
      result = result.where((l) => l.estado == _estadoFilter).toList();
    }
    _filtered = result;
  }

  void _onSearchChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 200), () {
      _searchQuery = v.toLowerCase();
      _applyFilters();
      setState(() {});
    });
  }

  void _nuevoLote() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: FormLote(onCreated: () => _loadLotes()),
      ),
    );
  }

  void _editarLote(Lote l) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: FormEditarLote(lote: l, onUpdated: () => _loadLotes()),
      ),
    );
  }

  Future<void> _eliminarLote(Lote l) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar lote'),
        content: Text('¿Eliminar lote ${l.numero} (${l.id})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), style: TextButton.styleFrom(foregroundColor: AppTheme.red600), child: const Text('Eliminar')),
        ],
      ),
    );
    if (ok == true) {
      final err = await _service.eliminarLote(l.id);
      if (mounted) {
        if (err == null) {
          _loadLotes();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: AppTheme.red600));
        }
      }
    }
  }

  Future<void> _activarLote(Lote l) async {
    final err = await _service.activarLote(l.id);
    if (mounted) {
      if (err == null) {
        _loadLotes();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lote activado'), backgroundColor: AppTheme.emerald600));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: AppTheme.red600));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final counts = <String, int>{};
    for (final l in _lotes) {
      final e = l.estado;
      counts[e] = (counts[e] ?? 0) + 1;
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadLotes,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  _buildSearch(),
                  _buildChips(counts),
                  Expanded(child: _buildList()),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _nuevoLote,
        backgroundColor: AppTheme.blue600,
        foregroundColor: Colors.white,
        elevation: 4,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearch() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.all(Radius.circular(8)),
          border: Border.fromBorderSide(BorderSide(color: AppTheme.slate200)),
          boxShadow: [BoxShadow(color: Color(0x06000000), blurRadius: 2)],
        ),
        child: TextField(
          onChanged: _onSearchChanged,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          decoration: const InputDecoration(
            hintText: 'Buscar lotes...',
            hintStyle: TextStyle(color: AppTheme.slate400, fontSize: 13),
            prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.slate400),
            border: InputBorder.none,
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ),
    );
  }

  Widget _buildChips(Map<String, int> counts) {
    final chips = [
      _chip('Todos', _lotes.length, ''),
      _chip('Activos', counts['Activo'] ?? 0, 'Activo'),
      _chip('Pendientes', counts['Pendiente'] ?? 0, 'Pendiente'),
      _chip('Agotados', counts['Agotado'] ?? 0, 'Agotado'),
      _chip('Vencidos', counts['Vencido'] ?? 0, 'Vencido'),
      _chip('Cuarentena', counts['Cuarentena'] ?? 0, 'Cuarentena'),
    ];
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: chips.interleave(const SizedBox(width: 8)).toList()),
      ),
    );
  }

  Widget _chip(String label, int count, String filtro) {
    final selected = _estadoFilter == filtro && filtro.isNotEmpty;
    return GestureDetector(
      onTap: () {
        setState(() {
          _estadoFilter = selected ? '' : filtro;
          _applyFilters();
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? AppTheme.blue600 : AppTheme.slate200, width: selected ? 2 : 1),
          boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 2)],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1), decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(4)), child: Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.blue700))),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slate600)),
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
    if (_filtered.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 80),
        Center(child: Text('No se encontraron lotes', style: TextStyle(color: AppTheme.slate400, fontSize: 14))),
      ]);
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      itemCount: _filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final l = _filtered[i];
        final pct = l.porcentajeConsumo;
        final barColor = pct >= 90 ? AppTheme.red500 : pct >= 50 ? AppTheme.amber500 : AppTheme.emerald500;

        Color estadoColor; Color estadoBg;
        switch (l.estado) {
          case 'Activo': estadoColor = AppTheme.emerald600; estadoBg = AppTheme.emerald50; break;
          case 'Pendiente': estadoColor = AppTheme.blue600; estadoBg = AppTheme.blue50; break;
          case 'Agotado': estadoColor = AppTheme.amber600; estadoBg = AppTheme.amber50; break;
          case 'Vencido': estadoColor = AppTheme.red600; estadoBg = AppTheme.red50; break;
          case 'Cuarentena': estadoColor = AppTheme.purple600; estadoBg = AppTheme.purple50; break;
          default: estadoColor = AppTheme.slate400; estadoBg = AppTheme.slate50;
        }

        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.slate100), boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 4, offset: Offset(0, 2))]),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: const TextStyle(fontSize: 12),
                          children: [
                            TextSpan(text: l.id, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.slate700)),
                            const TextSpan(text: '  |  ', style: TextStyle(color: AppTheme.slate300)),
                            TextSpan(text: l.numero, style: const TextStyle(fontWeight: FontWeight.w500, color: AppTheme.slate600)),
                          ],
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: estadoBg, borderRadius: BorderRadius.circular(6)), child: Text(l.estado, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: estadoColor, letterSpacing: 0.5))),
                    PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      iconSize: 18,
                      icon: const Icon(Icons.more_vert, color: AppTheme.slate400, size: 18),
                      onSelected: (action) {
                        if (action == 'activate') _activarLote(l);
                        if (action == 'edit') _editarLote(l);
                        if (action == 'delete') _eliminarLote(l);
                      },
                      itemBuilder: (_) {
                        final items = <PopupMenuEntry<String>>[];
                        if (l.estado == 'Pendiente') items.add(const PopupMenuItem(value: 'activate', child: Row(children: [Icon(Icons.play_circle, size: 18, color: AppTheme.emerald600), SizedBox(width: 8), Text('Activar')])));
                        items.add(const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 18, color: AppTheme.blue600), SizedBox(width: 8), Text('Editar')])));
                        items.add(const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: AppTheme.red600), SizedBox(width: 8), Text('Eliminar')])));
                        return items;
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (l.productoId != null)
                  Text(l.productoId!, style: const TextStyle(fontSize: 11, color: AppTheme.slate500)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.inventory_2, size: 13, color: AppTheme.slate400),
                    const SizedBox(width: 4),
                    Text('${l.cantidadActual}/${l.cantidadInicial}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.slate700)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(value: pct / 100, backgroundColor: AppTheme.slate100, color: barColor, minHeight: 5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('$pct%', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: barColor)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.event, size: 13, color: AppTheme.slate400),
                    const SizedBox(width: 4),
                    Text('Vence: ${l.fechaVencimiento}', style: TextStyle(fontSize: 11, color: l.diasRestantes <= 30 ? AppTheme.red500 : l.diasRestantes <= 60 ? AppTheme.amber600 : AppTheme.slate500, fontWeight: l.diasRestantes <= 30 ? FontWeight.w600 : FontWeight.normal)),
                    if (l.diasRestantes > 0 && l.diasRestantes < 9999) ...[
                      const SizedBox(width: 8),
                      Text('(${l.diasRestantes} días)', style: TextStyle(fontSize: 10, color: l.diasRestantes <= 30 ? AppTheme.red400 : AppTheme.slate400)),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

extension _Interleave<T> on Iterable<T> {
  Iterable<T> interleave(T separator) sync* {
    var first = true;
    for (final item in this) {
      if (!first) yield separator;
      yield item;
      first = false;
    }
  }
}

// ═══ FORM NUEVO LOTE ═══
class FormLote extends StatefulWidget {
  final VoidCallback onCreated;
  const FormLote({required this.onCreated, super.key});
  @override
  State<FormLote> createState() => _FormLoteState();
}

class _FormLoteState extends State<FormLote> {
  final _form = GlobalKey<FormState>();
  final _lotId = TextEditingController(), _lotNum = TextEditingController(), _cantInicial = TextEditingController(), _fabYear = TextEditingController(), _venYear = TextEditingController();
  String? _error;
  bool _guardando = false, _cargando = true;
  String _prodId = '', _provId = '', _fb = '', _ven = '';
  List<Producto> _productos = [];
  List<Proveedor> _proveedores = [];
  List<Producto> _productosFiltrados = [];

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    final r = await Future.wait([ProductoService().getProductos(), ProductoService().getProveedores()]);
    if (mounted) setState(() { _productos = r[0] as List<Producto>; _proveedores = r[1] as List<Proveedor>; _productosFiltrados = _productos; _cargando = false; });
    _fabYear.text = DateTime.now().year.toString();
    _venYear.text = (DateTime.now().year + 1).toString();
  }

  @override
  void dispose() {
    _lotId.dispose(); _lotNum.dispose(); _cantInicial.dispose(); _fabYear.dispose(); _venYear.dispose(); super.dispose();
  }

  Future<void> _guardar() async {
    if (!_form.currentState!.validate()) return;
    if (_prodId.isEmpty) { setState(() => _error = 'Seleccione un producto'); return; }
    if (_provId.isEmpty) { setState(() => _error = 'Seleccione un proveedor'); return; }
    if (_fb.isEmpty) { setState(() => _error = 'Seleccione fecha de fabricación'); return; }
    if (_ven.isEmpty) { setState(() => _error = 'Seleccione fecha de vencimiento'); return; }
    setState(() { _guardando = true; _error = null; });
    final cant = int.parse(_cantInicial.text.trim());
    final d = <String, dynamic>{
      'lot_id': _lotId.text.trim(),
      'lot_numero': _lotNum.text.trim(),
      'lot_fecha_fabricacion': _fb,
      'lot_fecha_vencimiento': _ven,
      'lot_cantidad_inicial': cant,
      'lot_cantidad_actual': cant,
      'lot_pro_id_fk': _prodId,
      'lot_prov_id_fk': _provId,
      'lot_estado': 'Activo',
    };
    final e = await LoteService().registrarLote(d);
    if (mounted) { if (e == null) { widget.onCreated(); Navigator.pop(context); } else setState(() { _guardando = false; _error = e; }); }
  }

  Future<void> _pickFecha(bool esFabricacion) async {
    final ahora = DateTime.now();
    final p = await showDatePicker(
      context: context,
      initialDate: ahora,
      firstDate: DateTime(ahora.year - 5),
      lastDate: DateTime(ahora.year + 5),
      helpText: esFabricacion ? 'Fecha fabricación' : 'Fecha vencimiento',
    );
    if (p != null) {
      final f = '${p.year}-${p.month.toString().padLeft(2, '0')}-${p.day.toString().padLeft(2, '0')}';
      setState(() { if (esFabricacion) _fb = f; else _ven = f; });
    }
  }

  @override
  Widget build(BuildContext ctx) {
    if (_cargando) return Container(color: Colors.white, padding: const EdgeInsets.all(40), child: const Center(child: CircularProgressIndicator(color: AppTheme.blue600)));
    return Container(
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Form(key: _form, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppTheme.slate300, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 12),
        Row(children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.qr_code, size: 17, color: AppTheme.blue600)), const SizedBox(width: 10), const Text('Nuevo Lote', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slate800))]),
        const SizedBox(height: 12),
        if (_error != null) Container(width: double.infinity, padding: const EdgeInsets.all(8), margin: const EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: AppTheme.red50, borderRadius: BorderRadius.circular(8)), child: Text(_error!, style: const TextStyle(color: AppTheme.red600, fontSize: 11))),
        _t('ID del Lote'), _f(_lotId, 'Ej: LOT001', _req),
        const SizedBox(height: 10),
        _t('N° Lote'), _f(_lotNum, 'Ej: LT-FAB-2026-001', _req, maxChars: 50),
        const SizedBox(height: 10),
        _t('Proveedor'), _dd(_provId, _proveedores.map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() { _provId = v?.split(' - ').first ?? ''; if (_provId.isNotEmpty) { _productosFiltrados = _productos.where((pr) => pr.id.startsWith(_provId.replaceFirst('PROV', 'PRO'))).toList(); } }), hint: 'Seleccionar proveedor...'),
        const SizedBox(height: 10),
        _t('Producto'), _dd(_prodId, _productosFiltrados.where((pr) => pr.estado == 'Activo').map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() => _prodId = v?.split(' - ').first ?? ''), hint: 'Seleccionar producto...'),
        const SizedBox(height: 10),
        _t('Fecha Fabricación'), _campoFecha(_fb, 'YYYY-MM-DD', () => _pickFecha(true)),
        const SizedBox(height: 10),
        _t('Fecha Vencimiento'), _campoFecha(_ven, 'YYYY-MM-DD', () => _pickFecha(false)),
        const SizedBox(height: 10),
        _t('Cantidad'), _f(_cantInicial, 'Mín 1 - Máx 1000', _vCant, keyboardType: TextInputType.number),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardar, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _guardando ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('GUARDAR LOTE', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)))),
        const SizedBox(height: 8),
      ]))),
    );
  }

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null;
  String? _vCant(String? v) { if (v == null || v.trim().isEmpty) return 'Requerido'; final c = int.tryParse(v.trim()); if (c == null) return 'Entero'; if (c < 1) return 'Mín 1'; if (c > 1000) return 'Máx 1000'; return null; }

  Widget _f(TextEditingController c, String h, FormFieldValidator<String>? v, {TextInputType? keyboardType, int maxChars = 100}) => TextFormField(controller: c, keyboardType: keyboardType, validator: v, maxLength: maxChars, buildCounter: (_, {int? currentLength, int? maxLength, bool? isFocused}) => null, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), decoration: _dec(h));

  InputDecoration _dec(String h) => InputDecoration(hintText: h, hintStyle: const TextStyle(color: AppTheme.slate300, fontSize: 13), filled: true, fillColor: AppTheme.slate50, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), errorStyle: const TextStyle(fontSize: 10));

  Widget _t(String l) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(l, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slate600)));

  Widget _dd(String val, List<String> items, ValueChanged<String?> onChanged, {String? hint}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    decoration: BoxDecoration(color: AppTheme.slate50, borderRadius: BorderRadius.circular(8)),
    child: DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: val.isEmpty ? null : val, isExpanded: true, menuMaxHeight: 250,
        hint: Text(hint ?? 'Seleccionar...', style: const TextStyle(color: AppTheme.slate300, fontSize: 13)),
        items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), overflow: TextOverflow.ellipsis))).toList(),
        onChanged: onChanged,
      ),
    ),
  );

  Widget _campoFecha(String valor, String hint, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: AbsorbPointer(
      child: TextFormField(
        style: const TextStyle(fontSize: 13, color: AppTheme.slate800),
        decoration: _dec(hint).copyWith(
          hintText: valor.isEmpty ? hint : valor,
          hintStyle: TextStyle(fontSize: 13, color: valor.isEmpty ? AppTheme.slate300 : AppTheme.slate800),
          suffixIcon: const Icon(Icons.calendar_today, size: 16, color: AppTheme.slate400),
        ),
      ),
    ),
  );
}

// ═══ FORM EDITAR LOTE ═══
class FormEditarLote extends StatefulWidget {
  final Lote lote;
  final VoidCallback onUpdated;
  const FormEditarLote({required this.lote, required this.onUpdated, super.key});
  @override
  State<FormEditarLote> createState() => _FormEditarLoteState();
}

class _FormEditarLoteState extends State<FormEditarLote> {
  final _form = GlobalKey<FormState>();
  final _lotId = TextEditingController(), _lotNum = TextEditingController(), _cantInicial = TextEditingController();
  String? _error;
  bool _guardando = false, _cargando = true;
  String _prodId = '', _provId = '', _fb = '', _ven = '', _estado = '';
  List<Producto> _productos = [];
  List<Proveedor> _proveedores = [];
  List<Producto> _productosFiltrados = [];

  static const _estados = ['Activo', 'Pendiente', 'Agotado', 'Vencido', 'Cuarentena'];

  @override
  void initState() {
    super.initState();
    final l = widget.lote;
    _lotId.text = l.id;
    _lotNum.text = l.numero;
    _cantInicial.text = l.cantidadInicial.toString();
    _fb = l.fechaFabricacion ?? '';
    _ven = l.fechaVencimiento;
    _prodId = l.productoId ?? '';
    _provId = l.proveedorId ?? '';
    _estado = l.estado;
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    final r = await Future.wait([ProductoService().getProductos(), ProductoService().getProveedores()]);
    if (mounted) setState(() { _productos = r[0] as List<Producto>; _proveedores = r[1] as List<Proveedor>; _productosFiltrados = _productos; _cargando = false; });
  }

  @override
  void dispose() {
    _lotId.dispose(); _lotNum.dispose(); _cantInicial.dispose(); super.dispose();
  }

  Future<void> _guardar() async {
    if (!_form.currentState!.validate()) return;
    if (_prodId.isEmpty) { setState(() => _error = 'Seleccione un producto'); return; }
    if (_provId.isEmpty) { setState(() => _error = 'Seleccione un proveedor'); return; }
    setState(() { _guardando = true; _error = null; });
    final d = <String, dynamic>{
      'lot_id': _lotId.text.trim(),
      'lot_numero': _lotNum.text.trim(),
      'lot_fecha_fabricacion': _fb,
      'lot_fecha_vencimiento': _ven,
      'lot_cantidad_inicial': int.parse(_cantInicial.text.trim()),
      'lot_cantidad_actual': int.parse(_cantInicial.text.trim()),
      'lot_pro_id_fk': _prodId,
      'lot_prov_id_fk': _provId,
      'lot_estado': _estado,
    };
    final e = await LoteService().editarLote(d);
    if (mounted) { if (e == null) { widget.onUpdated(); Navigator.pop(context); } else setState(() { _guardando = false; _error = e; }); }
  }

  Future<void> _pickFecha(bool esFabricacion) async {
    final ahora = DateTime.now();
    final p = await showDatePicker(
      context: context, initialDate: ahora, firstDate: DateTime(ahora.year - 5), lastDate: DateTime(ahora.year + 5),
      helpText: esFabricacion ? 'Fecha fabricación' : 'Fecha vencimiento',
    );
    if (p != null) {
      final f = '${p.year}-${p.month.toString().padLeft(2, '0')}-${p.day.toString().padLeft(2, '0')}';
      setState(() { if (esFabricacion) _fb = f; else _ven = f; });
    }
  }

  @override
  Widget build(BuildContext ctx) {
    if (_cargando) return Container(color: Colors.white, padding: const EdgeInsets.all(40), child: const Center(child: CircularProgressIndicator(color: AppTheme.blue600)));
    return Container(
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Form(key: _form, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppTheme.slate300, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 12),
        Row(children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.edit, size: 17, color: AppTheme.blue600)), const SizedBox(width: 10), const Text('Editar Lote', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slate800))]),
        const SizedBox(height: 6),
        Text(widget.lote.id, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.emerald600)),
        const SizedBox(height: 10),
        if (_error != null) Container(width: double.infinity, padding: const EdgeInsets.all(8), margin: const EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: AppTheme.red50, borderRadius: BorderRadius.circular(8)), child: Text(_error!, style: const TextStyle(color: AppTheme.red600, fontSize: 11))),
        _t('ID del Lote'), Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppTheme.slate50, borderRadius: BorderRadius.circular(8)), child: Text(_lotId.text, style: const TextStyle(fontSize: 13, color: AppTheme.slate400))),
        const SizedBox(height: 10),
        _t('N° Lote'), _f(_lotNum, 'Número de lote', _req, maxChars: 50),
        const SizedBox(height: 10),
        _t('Proveedor'), _dd(_provId, _proveedores.map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() { _provId = v?.split(' - ').first ?? ''; }), hint: 'Seleccionar proveedor...'),
        const SizedBox(height: 10),
        _t('Producto'), _dd(_prodId, _productosFiltrados.where((pr) => pr.estado == 'Activo').map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() => _prodId = v?.split(' - ').first ?? ''), hint: 'Seleccionar producto...'),
        const SizedBox(height: 10),
        _t('Fecha Fabricación'), _campoFecha(_fb, 'YYYY-MM-DD', () => _pickFecha(true)),
        const SizedBox(height: 10),
        _t('Fecha Vencimiento'), _campoFecha(_ven, 'YYYY-MM-DD', () => _pickFecha(false)),
        const SizedBox(height: 10),
        _t('Cantidad'), _f(_cantInicial, 'Mín 1 - Máx 1000', _vCant, keyboardType: TextInputType.number),
        const SizedBox(height: 10),
        _t('Estado'), _dd(_estado, _estados, (v) => setState(() => _estado = v ?? 'Activo')),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardar, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _guardando ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ACTUALIZAR LOTE', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)))),
        const SizedBox(height: 8),
      ]))),
    );
  }

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null;
  String? _vCant(String? v) { if (v == null || v.trim().isEmpty) return 'Requerido'; final c = int.tryParse(v.trim()); if (c == null) return 'Entero'; if (c < 1) return 'Mín 1'; if (c > 1000) return 'Máx 1000'; return null; }

  Widget _f(TextEditingController c, String h, FormFieldValidator<String>? v, {TextInputType? keyboardType, int maxChars = 100}) => TextFormField(controller: c, keyboardType: keyboardType, validator: v, maxLength: maxChars, buildCounter: (_, {int? currentLength, int? maxLength, bool? isFocused}) => null, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), decoration: _dec(h));

  InputDecoration _dec(String h) => InputDecoration(hintText: h, hintStyle: const TextStyle(color: AppTheme.slate300, fontSize: 13), filled: true, fillColor: AppTheme.slate50, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), errorStyle: const TextStyle(fontSize: 10));

  Widget _t(String l) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(l, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slate600)));

  Widget _dd(String val, List<String> items, ValueChanged<String?> onChanged, {String? hint}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    decoration: BoxDecoration(color: AppTheme.slate50, borderRadius: BorderRadius.circular(8)),
    child: DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: val.isEmpty ? null : val, isExpanded: true, menuMaxHeight: 250,
        hint: Text(hint ?? 'Seleccionar...', style: const TextStyle(color: AppTheme.slate300, fontSize: 13)),
        items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), overflow: TextOverflow.ellipsis))).toList(),
        onChanged: onChanged,
      ),
    ),
  );

  Widget _campoFecha(String valor, String hint, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: AbsorbPointer(
      child: TextFormField(
        style: const TextStyle(fontSize: 13, color: AppTheme.slate800),
        decoration: _dec(hint).copyWith(
          hintText: valor.isEmpty ? hint : valor,
          hintStyle: TextStyle(fontSize: 13, color: valor.isEmpty ? AppTheme.slate300 : AppTheme.slate800),
          suffixIcon: const Icon(Icons.calendar_today, size: 16, color: AppTheme.slate400),
        ),
      ),
    ),
  );
}
