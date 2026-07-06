import 'dart:async';
import 'package:flutter/material.dart';
import '../models/producto.dart';
import '../models/proveedor.dart';
import '../services/api_services.dart';
import '../theme.dart';

class ProductosScreen extends StatefulWidget {
  final int refreshCount;
  const ProductosScreen({super.key, this.refreshCount = 0});

  @override
  State<ProductosScreen> createState() => _ProductosScreenState();
}

class _ProductosScreenState extends State<ProductosScreen> {
  final ProductoService _service = ProductoService();
  List<Producto> _productos = [];
  List<Producto> _filtered = [];
  bool _loading = true;
  String _searchQuery = '';
  String _estadoFilter = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadProductos();
  }

  @override
  void didUpdateWidget(ProductosScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshCount != oldWidget.refreshCount) {
      _loadProductos();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadProductos() async {
    final productos = await _service.getProductos();
    if (mounted) {
      setState(() {
        _productos = productos;
        _applyFilters();
        _loading = false;
      });
    }
  }

  void _applyFilters() {
    var result = _productos;
    if (_searchQuery.isNotEmpty) {
      result = result.where((p) =>
          p.nombre.toLowerCase().contains(_searchQuery) ||
          p.categoria.toLowerCase().contains(_searchQuery) ||
          p.id.toString().contains(_searchQuery)).toList();
    }
    if (_estadoFilter.isNotEmpty) {
      result = result.where((p) => p.estado == _estadoFilter).toList();
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

  void _editarProducto(Producto p) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: _FormEditarProducto(producto: p, onUpdated: () => setState(() => _loadProductos())),
      ),
    );
  }

  Future<void> _eliminarProducto(Producto p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar producto'),
        content: Text('¿Eliminar ${p.nombre} (${p.id})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.red600),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final err = await _service.eliminarProducto(p.id);
      if (mounted) {
        if (err == null) {
          _loadProductos();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: AppTheme.red600));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activos = _productos.where((p) => p.estado == 'Activo').length;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadProductos,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  _buildSearchAndTabs(activos),
                  Expanded(child: _buildProductTable()),
                ],
              ),
      ),
    );
  }

  Widget _buildSearchAndTabs(int activos) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          Padding(
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
                  hintText: 'Buscar productos...',
                  hintStyle: TextStyle(color: AppTheme.slate400, fontSize: 13),
                  prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.slate400),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Row(
              children: [
                _estadoChip('Todos', _productos.length, ''),
                const SizedBox(width: 8),
                _estadoChip('Activos', activos, 'Activo'),
                const SizedBox(width: 8),
                _estadoChip('Descont.', _productos.where((p) => p.estado == 'Descontinuado').length, 'Descontinuado'),
                const SizedBox(width: 8),
                _estadoChip('Suspen.', _productos.where((p) => p.estado == 'Suspendido').length, 'Suspendido'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _estadoChip(String label, int count, String filtro) {
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
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(4)),
              child: Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.blue700)),
            ),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slate600)),
          ],
        ),
      ),
    );
  }

  Widget _buildProductTable() {
    if (_filtered.isEmpty) {
      final header = Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        child: Row(
          children: [
            const SizedBox(width: 8, height: 8),
            const SizedBox(width: 8),
            Expanded(flex: 3, child: _headerText('PRODUCTO')),
            Expanded(flex: 2, child: _headerText('CATEGORÍA')),
            Expanded(flex: 2, child: _headerText('PRECIO')),
            Expanded(flex: 2, child: _headerText('ESTADO')),
            const SizedBox(width: 36),
          ],
        ),
      );
      final mt = Center(
        child: Column(
          children: [
            header,
            const SizedBox(height: 60),
            const Text('No se encontraron productos', style: TextStyle(color: AppTheme.slate400, fontSize: 14)),
          ],
        ),
      );
      return CustomScrollView(slivers: [SliverFillRemaining(hasScrollBody: false, child: mt)]);
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _filtered.length + 1,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
            child: Row(
              children: [
                const SizedBox(width: 8, height: 8),
                const SizedBox(width: 8),
                Expanded(flex: 3, child: _headerText('PRODUCTO')),
                Expanded(flex: 2, child: _headerText('CATEGORÍA')),
                Expanded(flex: 2, child: _headerText('PRECIO')),
                Expanded(flex: 2, child: _headerText('ESTADO')),
                const SizedBox(width: 36),
              ],
            ),
          );
        }

        final p = _filtered[index - 1];
        return Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.slate300),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: Text(
                  p.nombre,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.slate800),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  p.categoria,
                  style: const TextStyle(fontSize: 11, color: AppTheme.slate500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  '\$ ${p.precio?.toStringAsFixed(0) ?? "0"}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.emerald600),
                ),
              ),
              Expanded(
                flex: 2,
                child: _estadoBadge(p.estado),
              ),
              PopupMenuButton<String>(
                padding: EdgeInsets.zero,
                iconSize: 20,
                icon: const Icon(Icons.more_vert, color: AppTheme.slate400, size: 20),
                onSelected: (action) {
                  if (action == 'edit') _editarProducto(p);
                  if (action == 'delete') _eliminarProducto(p);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 18, color: AppTheme.blue600), SizedBox(width: 8), Text('Editar')])),
                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: AppTheme.red600), SizedBox(width: 8), Text('Eliminar')])),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _headerText(String text) {
    return Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.slate400, letterSpacing: 1.5));
  }

  Widget _estadoBadge(String estado) {
    Color color;
    Color bg;
    switch (estado) {
      case 'Activo':
        color = AppTheme.emerald600;
        bg = AppTheme.emerald50;
        break;
      case 'Descontinuado':
        color = AppTheme.slate600;
        bg = AppTheme.slate100;
        break;
      case 'Suspendido':
        color = AppTheme.red600;
        bg = AppTheme.red50;
        break;
      default:
        color = AppTheme.slate400;
        bg = AppTheme.slate50;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(
        estado,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5),
      ),
    );
  }
}

class _FormEditarProducto extends StatefulWidget {
  final Producto producto;
  final VoidCallback onUpdated;
  const _FormEditarProducto({required this.producto, required this.onUpdated});
  @override
  State<_FormEditarProducto> createState() => _FormEditarProductoState();
}

class _FormEditarProductoState extends State<_FormEditarProducto> {
  final _form = GlobalKey<FormState>();
  final _nombre = TextEditingController(), _desc = TextEditingController(), _precio = TextEditingController();
  bool _guardando = false, _cargando = true;
  String? _error;
  String _estado = '', _cat = '', _provSel = '', _nuevaCat = '';
  bool _addCat = false;
  List<String> _cats = [];
  List<Proveedor> _provs = [];

  static const _estados = ['Activo', 'Descontinuado', 'Suspendido'];

  @override
  void initState() {
    super.initState();
    final p = widget.producto;
    _nombre.text = p.nombre;
    _desc.text = p.descripcion;
    _precio.text = p.precio?.toStringAsFixed(0) ?? '0';
    _estado = p.estado;
    _cargarCats();
  }

  Future<void> _cargarCats() async {
    final s = ProductoService();
    final r = await Future.wait([s.getProductos(), s.getProveedores()]);
    if (mounted) {
      final cats = (r[0] as List).map((p) => p.categoria as String).where((c) => c.isNotEmpty).toSet().toList()..sort();
      _provs = r[1] as List<Proveedor>;
      final pCat = widget.producto.categoria;
      if (pCat.isNotEmpty && !cats.contains(pCat)) {
        cats.add(pCat);
        cats.sort();
      }
      _cats = cats;
      _cat = pCat;
      _cargando = false;
      setState(() {});
    }
  }

  @override
  void dispose() {
    _nombre.dispose(); _desc.dispose(); _precio.dispose(); super.dispose();
  }

  Future<void> _guardar() async {
    if (!_form.currentState!.validate()) return;
    if (_cat.isEmpty) { setState(() => _error = 'Seleccione una categoría'); return; }
    setState(() { _guardando = true; _error = null; });
    final d = <String, dynamic>{
      'id': widget.producto.id,
      'nombre': _nombre.text.trim(),
      'categoria': _cat,
      'descripcion': _desc.text.trim(),
      'precio': double.parse(_precio.text.trim()),
      'estado': _estado,
    };
    if (_provSel.isNotEmpty) d['proveedor_id'] = _provSel.split(' - ').first;
    final e = await ProductoService().editarProducto(d);
    if (mounted) {
      if (e == null) { widget.onUpdated(); Navigator.pop(context); }
      else setState(() { _guardando = false; _error = e; });
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
        Row(children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.edit, size: 17, color: AppTheme.blue600)), const SizedBox(width: 10), const Text('Editar Producto', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slate800))]),
        const SizedBox(height: 6),
        Text(widget.producto.id, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.emerald600)),
        const SizedBox(height: 10),
        if (_error != null) Container(width: double.infinity, padding: const EdgeInsets.all(8), margin: const EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: AppTheme.red50, borderRadius: BorderRadius.circular(8)), child: Text(_error!, style: const TextStyle(color: AppTheme.red600, fontSize: 11))),
        _t('Nombre'), _f(_nombre, 'Nombre comercial', (v) => _req(v)),
        const SizedBox(height: 10),
        _t('Categoría'), _dd(_cat, _cats, (v) { if (v == '__new__') setState(() { _addCat = true; _nuevaCat = ''; }); else setState(() { _cat = v ?? ''; _addCat = false; }); }, addNew: true),
        if (_addCat) ...[
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: TextFormField(autofocus: true, style: const TextStyle(fontSize: 13), decoration: _dec('Nueva categoría...'), onChanged: (v) => _nuevaCat = v)),
            const SizedBox(width: 8),
            ElevatedButton(onPressed: () { final c = _nuevaCat.trim(); if (c.isNotEmpty) setState(() { if (!_cats.contains(c)) _cats = [..._cats, c]..sort(); _cat = c; _addCat = false; }); }, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), child: const Text('Crear', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
          ]),
        ],
        const SizedBox(height: 10),
        _t('Descripción'), _f(_desc, 'Breve descripción', (v) => _req(v), maxLines: 2),
        const SizedBox(height: 10),
        _t('Precio'), _f(_precio, 'Mín \$100 - Máx \$999,999', _validarPrecio, keyboardType: const TextInputType.numberWithOptions(decimal: true)),
        const SizedBox(height: 10),
        _t('Estado'), _dd(_estado, _estados, (v) => setState(() => _estado = v ?? 'Activo')),
        const SizedBox(height: 10),
        _t('Proveedor'), _dd(_provSel, _provs.map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() => _provSel = v ?? ''), hint: 'Opcional'),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardar, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _guardando ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ACTUALIZAR PRODUCTO', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)))),
        const SizedBox(height: 8),
      ]))),
    );
  }

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null;
  String? _validarPrecio(String? v) { if (v == null || v.trim().isEmpty) return 'Requerido'; final p = double.tryParse(v.trim()); if (p == null) return 'Número inválido'; if (p < 100) return 'Mín \$100'; if (p > 999999.99) return 'Máx \$999,999.99'; return null; }

  Widget _f(TextEditingController c, String h, FormFieldValidator<String>? v, {TextInputType? keyboardType, int maxLines = 1}) => TextFormField(controller: c, keyboardType: keyboardType, maxLines: maxLines, validator: v, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), decoration: _dec(h));

  InputDecoration _dec(String h) => InputDecoration(hintText: h, hintStyle: const TextStyle(color: AppTheme.slate300, fontSize: 13), filled: true, fillColor: AppTheme.slate50, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), errorStyle: const TextStyle(fontSize: 10));

  Widget _t(String l) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(l, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.slate600)));

  Widget _dd(String val, List<String> items, ValueChanged<String?> onChanged, {bool addNew = false, String? hint}) {
    final all = [...items];
    if (addNew) all.add('__new__');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: AppTheme.slate50, borderRadius: BorderRadius.circular(8)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: val.isEmpty ? null : val, isExpanded: true,
          hint: Text(hint ?? 'Seleccionar...', style: const TextStyle(color: AppTheme.slate300, fontSize: 13)),
          menuMaxHeight: 250,
          items: all.map((e) {
            if (e == '__new__') return const DropdownMenuItem(value: '__new__', child: Row(children: [Icon(Icons.add, size: 15, color: AppTheme.blue600), SizedBox(width: 5), Text('Crear nueva categoría', style: TextStyle(fontSize: 13, color: AppTheme.blue600))]));
            return DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), overflow: TextOverflow.ellipsis));
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
