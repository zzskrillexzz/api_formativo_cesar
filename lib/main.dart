import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/productos_screen.dart';
import 'screens/pedidos_screen.dart';
import 'screens/lotes_screen.dart';
import 'widgets/app_drawer.dart';
import 'services/api_services.dart';
import 'services/api_client.dart';
import 'models/proveedor.dart';
import 'models/cliente.dart';
import 'models/producto.dart';
import 'models/lote.dart';

void main() => runApp(const AppSanDiego());

class AppSanDiego extends StatelessWidget {
  const AppSanDiego({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..checkSession(),
      child: MaterialApp(title: 'Ez Logistics', debugShowCheckedModeBanner: false, theme: AppTheme.theme, home: const AuthGate()),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.isLoading) return const Scaffold(body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [CircularProgressIndicator(color: AppTheme.blue600), SizedBox(height: 16), Text('Cargando...', style: TextStyle(color: AppTheme.slate400))])));
    if (!auth.isLogged) return const LoginScreen();
    return const MainShell();
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  int _prodRefresh = 0, _loteRefresh = 0, _pedRefresh = 0;
  final _titles = const ['Dashboard', 'Inventario', 'Lotes', 'Pedidos'];

  @override
  Widget build(BuildContext context) {
    final screens = <Widget>[
      const DashboardScreen(),
      ProductosScreen(refreshCount: _prodRefresh),
      LotesScreen(refreshCount: _loteRefresh),
      PedidosScreen(refreshCount: _pedRefresh),
    ];
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: Container(
          decoration: const BoxDecoration(gradient: AppTheme.gradientHeader),
          child: AppBar(title: Text(_titles[_currentIndex]), backgroundColor: Colors.transparent, foregroundColor: Colors.white, elevation: 0),
        ),
      ),
      drawer: AppDrawer(currentIndex: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
      body: IndexedStack(index: _currentIndex, children: screens),
      floatingActionButton: _currentIndex == 1
          ? FloatingActionButton(
              onPressed: () => _showForm(_FormProducto(onCreated: () => setState(() => _prodRefresh++))),
              backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, elevation: 4, child: const Icon(Icons.add),
            )
          : _currentIndex == 3
              ? FloatingActionButton(
                  onPressed: () => _showForm(_FormPedido(onCreated: () => setState(() { _pedRefresh++; _loteRefresh++; }))),
                  backgroundColor: AppTheme.orange400, foregroundColor: Colors.white, elevation: 4, child: const Icon(Icons.add_shopping_cart),
                )
              : null,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(boxShadow: [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 10, offset: const Offset(0, -2))]),
        child: BottomNavigationBar(
          currentIndex: _currentIndex, onTap: (i) => setState(() => _currentIndex = i),
          selectedItemColor: AppTheme.blue600, unselectedItemColor: AppTheme.slate400,
          selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          type: BottomNavigationBarType.fixed, backgroundColor: Colors.white, elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2), label: 'Productos'),
            BottomNavigationBarItem(icon: Icon(Icons.qr_code_outlined), activeIcon: Icon(Icons.qr_code), label: 'Lotes'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Pedidos'),
          ],
        ),
      ),
    );
  }

  void _showForm(Widget form) {
    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => Padding(padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom), child: form));
  }
}

// ═══ FORM PRODUCTO ═══
class _FormProducto extends StatefulWidget {
  final VoidCallback onCreated;
  const _FormProducto({required this.onCreated});
  @override
  State<_FormProducto> createState() => _FormProductoState();
}

class _FormProductoState extends State<_FormProducto> {
  final _form = GlobalKey<FormState>();
  final _nombre = TextEditingController(), _desc = TextEditingController(), _precio = TextEditingController();
  bool _guardando = false, _cargando = true;
  String? _error;
  String _estado = 'Activo', _cat = '', _provSel = '', _nextId = '', _nuevaCat = '';
  bool _addCat = false;
  List<String> _cats = [];
  List<Proveedor> _provs = [];

  static const _grad = LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF1E40AF)]);

  @override
  void initState() { super.initState(); _cargar(); }

  Future<void> _cargar() async {
    final s = ProductoService();
    final r = await Future.wait([s.getNextProductoId(), s.getProductos(), s.getProveedores()]);
    if (mounted) setState(() { _nextId = r[0] as String; _cats = (r[1] as List).map((p) => p.categoria as String).where((c) => c.isNotEmpty).toSet().toList()..sort(); _provs = r[2] as List<Proveedor>; _cargando = false; });
  }

  Future<void> _guardar() async {
    if (!_form.currentState!.validate()) return;
    if (_cat.isEmpty) { setState(() => _error = 'Seleccione una categoría'); return; }
    setState(() { _guardando = true; _error = null; });
    final d = <String, dynamic>{'nombre': _nombre.text.trim(), 'categoria': _cat, 'descripcion': _desc.text.trim(), 'precio': double.parse(_precio.text.trim())};
    if (_estado.isNotEmpty) d['estado'] = _estado;
    if (_provSel.isNotEmpty) d['proveedor_id'] = _provSel.split(' - ').first;
    final e = await ProductoService().registrarProducto(d);
    if (mounted) { if (e == null) { widget.onCreated(); Navigator.pop(context); } else setState(() { _guardando = false; _error = e; }); }
  }

  @override
  void dispose() { _nombre.dispose(); _desc.dispose(); _precio.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext ctx) {
    if (_cargando) return Container(color: Colors.white, padding: const EdgeInsets.all(40), child: const Center(child: CircularProgressIndicator(color: AppTheme.blue600)));
    return Container(
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Form(key: _form, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppTheme.slate300, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 12),
        Row(children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.inventory_2, size: 17, color: AppTheme.blue600)), const SizedBox(width: 10), const Text('Nuevo Producto', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slate800))]),
        const SizedBox(height: 12),
        if (_nextId.isNotEmpty) Container(width: double.infinity, padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppTheme.emerald50, borderRadius: BorderRadius.circular(8)), child: Row(children: [const Icon(Icons.auto_awesome, size: 14, color: AppTheme.emerald600), const SizedBox(width: 6), const Text('ID: ', style: TextStyle(fontSize: 12, color: AppTheme.emerald600)), Text(_nextId, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.emerald600))])),
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
            ElevatedButton(
              onPressed: () { final c = _nuevaCat.trim(); if (c.isNotEmpty) setState(() { if (!_cats.contains(c)) _cats = [..._cats, c]..sort(); _cat = c; _addCat = false; }); },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              child: const Text('Crear', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ]),
        ],
        const SizedBox(height: 10),
        _t('Descripción'), _f(_desc, 'Breve descripción', (v) => _req(v), maxLines: 2),
        const SizedBox(height: 10),
        _t('Precio'), _f(_precio, 'Mín \$100 - Máx \$999,999', _validarPrecio, keyboardType: const TextInputType.numberWithOptions(decimal: true)),
        const SizedBox(height: 10),
        _t('Estado'), _dd(_estado, ['Activo'], (v) => setState(() => _estado = v ?? 'Activo')),
        const SizedBox(height: 2),
        const Text('Descontinuar/Suspender → use Editar', style: TextStyle(fontSize: 10, color: AppTheme.slate400)),
        const SizedBox(height: 4),
        _t('Proveedor'), _dd(_provSel, _provs.map((p) => '${p.id} - ${p.nombre}').toList(), (v) => setState(() => _provSel = v ?? ''), hint: 'Opcional'),
        const SizedBox(height: 18),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardar, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _guardando ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('GUARDAR PRODUCTO', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)))),
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

// ═══ FORM PEDIDO ═══
class _FormPedido extends StatefulWidget {
  final VoidCallback onCreated;
  const _FormPedido({required this.onCreated});
  @override
  State<_FormPedido> createState() => _FormPedidoState();
}

class _ProdsSel {
  final String proId;
  final String proNombre;
  int cantidad;
  double precioUnitario;
  _ProdsSel({required this.proId, required this.proNombre, this.cantidad = 1, this.precioUnitario = 0});
  double get subtotal => cantidad * precioUnitario;
}

class _FormPedidoState extends State<_FormPedido> {
  final _form = GlobalKey<FormState>();
  final _fechaCtrl = TextEditingController();
  String _pedId = '', _fecha = '', _metodo = 'Efectivo', _estadoEntrega = 'Pendiente', _banco = '', _cliSel = '';
  int? _cliId;
  bool _guardando = false, _cargando = true, _creandoCliente = false;
  String? _error;

  // productos
  String _prodSel = '';
  final _cantCtrl = TextEditingController(text: '1'), _precioCtrl = TextEditingController(text: '0');
  final List<_ProdsSel> _productos = [];

  // datos externos
  List<Cliente> _clientes = [];
  List<Producto> _productosDisponibles = [];
  Map<String, int> _stockPorProducto = {};

  // crear cliente
  final _newCliId = TextEditingController(), _newCliNombre = TextEditingController(), _newCliApellido = TextEditingController(), _newCliCorreo = TextEditingController(), _newCliTel = TextEditingController();
  String _newCliTipo = 'CC';

  static const _metodos = ['Efectivo', 'Tarjeta', 'Transferencia'];
  static const _estados = ['Pendiente', 'En preparación', 'En camino', 'Entregado'];
  static const _bancos = ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia', 'Banco de Occidente', 'Banco Popular', 'Banco Agrario', 'Banco Caja Social', 'Banco Falabella', 'Scotiabank Colpatria', 'Itaú Colombia', 'Banco Pichincha', 'Bancamía', 'Bancoomeva', 'AV Villas', 'Nequi', 'Daviplata', 'Movii', 'Dale'];
  static const _tiposDoc = ['CC', 'NIT', 'CE'];

  @override
  void initState() {
    super.initState();
    final n = DateTime.now();
    _fecha = '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
    _fechaCtrl.text = _fecha;
    _cargar();
  }

  Future<void> _cargar() async {
    final r = await Future.wait([
      PedidoService().getNextPedidoId(),
      ClienteService().getClientes(),
      ProductoService().getProductos(),
      LoteService().getLotes(),
    ]);
    if (mounted) {
      final lotes = r[3] as List<Lote>;
      final stock = <String, int>{};
      for (final l in lotes) {
        if (l.productoId != null && l.estado == 'Activo') {
          stock[l.productoId!] = (stock[l.productoId] ?? 0) + l.cantidadActual;
        }
      }
      setState(() {
        _pedId = r[0] as String;
        _clientes = r[1] as List<Cliente>;
        _productosDisponibles = (r[2] as List<Producto>).where((p) => p.estado == 'Activo').toList();
        _stockPorProducto = stock;
        _cargando = false;
      });
    }
  }

  @override
  void dispose() {
    _fechaCtrl.dispose(); _cantCtrl.dispose(); _precioCtrl.dispose();
    _newCliId.dispose(); _newCliNombre.dispose(); _newCliApellido.dispose(); _newCliCorreo.dispose(); _newCliTel.dispose();
    super.dispose();
  }

  Future<void> _pickFecha() async {
    final p = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)), helpText: 'Fecha del pedido');
    if (p != null) {
      final f = '${p.year}-${p.month.toString().padLeft(2, '0')}-${p.day.toString().padLeft(2, '0')}';
      setState(() { _fecha = f; _fechaCtrl.text = f; });
    }
  }

  void _agregarProducto() {
    final prodId = _prodSel.split(' - ').first;
    final idx = _productosDisponibles.indexWhere((p) => p.id == prodId);
    if (idx == -1) { setState(() => _error = 'Seleccione un producto'); return; }
    final p = _productosDisponibles[idx];
    final cant = int.tryParse(_cantCtrl.text.trim());
    if (cant == null || cant <= 0) { setState(() => _error = 'Cantidad debe ser > 0'); return; }
    final precio = double.tryParse(_precioCtrl.text.trim());
    if (precio == null || precio < 0) { setState(() => _error = 'Precio inválido'); return; }
    if (_productos.any((x) => x.proId == p.id)) { setState(() => _error = 'Producto ya agregado'); return; }
    setState(() {
      _productos.add(_ProdsSel(proId: p.id, proNombre: p.nombre, cantidad: cant, precioUnitario: precio));
      _prodSel = '';
      _cantCtrl.text = '1';
      _precioCtrl.text = '0';
      _error = null;
    });
  }

  double get _total => _productos.fold(0.0, (s, p) => s + p.subtotal);

  Future<void> _guardarCrearCliente() async {
    final idTxt = _newCliId.text.trim();
    if (idTxt.isEmpty) { setState(() => _error = 'ID del cliente requerido'); return; }
    final id = int.tryParse(idTxt);
    if (id == null || id <= 0) { setState(() => _error = 'ID inválido'); return; }
    if (_newCliNombre.text.trim().isEmpty || _newCliApellido.text.trim().isEmpty) { setState(() => _error = 'Nombre y apellido requeridos'); return; }
    setState(() { _guardando = true; _error = null; });
    final d = <String, dynamic>{
      'cli_id': id, 'cli_tipo_documento': _newCliTipo,
      'cli_nombre': _newCliNombre.text.trim(), 'cli_apellido': _newCliApellido.text.trim(),
      'cli_correo': _newCliCorreo.text.trim(), 'cli_telefono': _newCliTel.text.trim(),
    };
    final e = await ClienteService().registrarCliente(d);
    if (mounted) {
      if (e == null) {
        _clientes = await ClienteService().getClientes();
        setState(() { _cliId = id; _cliSel = '$id - ${_newCliNombre.text.trim()} ${_newCliApellido.text.trim()}'; _creandoCliente = false; _guardando = false; });
      } else {
        setState(() { _guardando = false; _error = e; });
      }
    }
  }

  Future<void> _guardar() async {
    if (!_form.currentState!.validate()) return;
    if (_pedId.isEmpty) { setState(() => _error = 'ID de pedido no disponible. Cierre y abra de nuevo.'); return; }
    if (_cliId == null) { setState(() => _error = 'Seleccione un cliente'); return; }
    if (_metodo == 'Transferencia' && _banco.isEmpty) { setState(() => _error = 'Seleccione banco para Transferencia'); return; }
    if (_productos.isEmpty) { setState(() => _error = 'Agregue al menos un producto'); return; }
    setState(() { _guardando = true; _error = null; });

    final api = ApiClient();

    final d = <String, dynamic>{
      'ped_id': _pedId,
      'ped_fecha': _fecha, 'ped_metodo_pago': _metodo, 'ped_estado_entrega': _estadoEntrega,
      'ped_total': _total, 'ped_cli_id_fk': _cliId,
    };
    if (_banco.isNotEmpty) d['ped_cuenta_bancaria'] = _banco;

    try {
      final r = await api.post('/pedidos/', d);
      if (r.statusCode != 201) {
        var msg = 'Error al crear pedido';
        try { final dec = jsonDecode(r.body); msg = dec['mensaje']?.toString() ?? msg; } catch (_) {}
        if (mounted) setState(() { _guardando = false; _error = msg; });
        return;
      }

      for (var i = 0; i < _productos.length; i++) {
        final p = _productos[i];
        final detId = '${_pedId}-DET${(i + 1).toString().padLeft(3, '0')}';
        final detData = <String, dynamic>{
          'det_id': detId, 'det_ped_id_fk': _pedId, 'det_pro_id_fk': p.proId,
          'det_cantidad': p.cantidad, 'det_precio_unitario': p.precioUnitario, 'det_subtotal': p.subtotal,
        };
        final dr = await api.post('/detalles_pedidos/', detData);
        if (dr.statusCode != 201) {
          var msg = 'Error en detalle';
          try { final dec = jsonDecode(dr.body); msg = dec['mensaje']?.toString() ?? msg; } catch (_) {}
          if (mounted) setState(() { _guardando = false; _error = 'Detalle ${i + 1}: $msg'; });
          return;
        }
      }

      if (mounted) { widget.onCreated(); Navigator.pop(context); }
    } catch (e) {
      if (mounted) setState(() { _guardando = false; _error = 'Error: ${e.toString()}'; });
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
        Row(children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppTheme.orange50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.receipt_long, size: 17, color: AppTheme.orange400)), const SizedBox(width: 10), const Text('Nuevo Pedido', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.slate800))]),
        const SizedBox(height: 12),
        if (_pedId.isNotEmpty) Container(width: double.infinity, padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppTheme.emerald50, borderRadius: BorderRadius.circular(8)), child: Row(children: [const Icon(Icons.auto_awesome, size: 14, color: AppTheme.emerald600), const SizedBox(width: 6), const Text('ID: ', style: TextStyle(fontSize: 12, color: AppTheme.emerald600)), Text(_pedId, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.emerald600))])),
        const SizedBox(height: 10),
        if (_error != null) Container(width: double.infinity, padding: const EdgeInsets.all(8), margin: const EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: AppTheme.red50, borderRadius: BorderRadius.circular(8)), child: Text(_error!, style: const TextStyle(color: AppTheme.red600, fontSize: 11))),
        _t('Fecha'), _campoFecha(),
        const SizedBox(height: 10),
        _t('Cliente'), _creandoCliente ? _buildCrearCliente() : _dd(_cliSel, [..._clientes.map((c) => '${c.id} - ${c.nombreCompleto}'), '__new__'], (v) {
          if (v == '__new__') { setState(() => _creandoCliente = true); }
          else if (v != null) {
            final parts = v.split(' - ');
            setState(() { _cliId = int.tryParse(parts.first); _cliSel = v; });
          }
        }, addNew: true, hint: 'Seleccionar cliente...'),
        if (!_creandoCliente) ...[
          const SizedBox(height: 10),
          _t('Método de Pago'), _dd(_metodo, _metodos, (v) => setState(() => _metodo = v ?? 'Efectivo')),
          if (_metodo == 'Transferencia') ...[const SizedBox(height: 10), _t('Cuenta Bancaria'), _dd(_banco.isEmpty ? '' : _banco, _bancos, (v) => setState(() => _banco = v ?? ''), hint: 'Seleccionar banco...')],
          const SizedBox(height: 10),
          _t('Estado de Entrega'), _dd(_estadoEntrega, _estados, (v) => setState(() => _estadoEntrega = v ?? 'Pendiente')),
          const SizedBox(height: 12),
          _t('Productos'),
          ..._buildProductosSection(),
          const SizedBox(height: 18),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardar, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.orange400, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _guardando ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('GUARDAR PEDIDO', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)))),
        ],
        const SizedBox(height: 8),
      ]))),
    );
  }

  Widget _buildCrearCliente() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.blue50, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.blue600.withAlpha(40))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [const Icon(Icons.person_add, size: 16, color: AppTheme.blue600), const SizedBox(width: 6), const Text('Nuevo Cliente', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.blue600)), const Spacer(), GestureDetector(onTap: () => setState(() => _creandoCliente = false), child: const Icon(Icons.close, size: 18, color: AppTheme.slate400))]),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _fTiny(_newCliId, 'ID', keyboardType: TextInputType.number)),
          const SizedBox(width: 8),
          Expanded(child: _ddSimple(_newCliTipo, _tiposDoc, (v) => setState(() => _newCliTipo = v ?? 'CC'))),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          Expanded(child: _fTiny(_newCliNombre, 'Nombre')),
          const SizedBox(width: 8),
          Expanded(child: _fTiny(_newCliApellido, 'Apellido')),
        ]),
        const SizedBox(height: 6),
        _fTiny(_newCliCorreo, 'Correo (opcional)'),
        const SizedBox(height: 6),
        _fTiny(_newCliTel, 'Teléfono (opcional)', keyboardType: TextInputType.phone),
        const SizedBox(height: 8),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _guardando ? null : _guardarCrearCliente, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), child: _guardando ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('GUARDAR CLIENTE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)))),
      ]),
    );
  }

  List<Widget> _buildProductosSection() {
    final activos = _productosDisponibles.map((p) {
      final s = _stockPorProducto[p.id] ?? 0;
      return '${p.id} - ${p.nombre} (${s} und.)';
    }).toList();
    return [
      _dd(_prodSel, activos, (v) {
        setState(() => _prodSel = v ?? '');
        if (v != null && v.isNotEmpty) {
          final pid = v.split(' - ').first;
          for (final p in _productosDisponibles) {
            if (p.id == pid && p.precio != null) {
              _precioCtrl.text = p.precio!.toStringAsFixed(0);
              break;
            }
          }
        }
      }, hint: 'Seleccionar producto...'),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(flex: 2, child: _fTiny(_cantCtrl, 'Cant.', keyboardType: TextInputType.number)),
        const SizedBox(width: 8),
        Expanded(flex: 3, child: _fTiny(_precioCtrl, 'Precio Unit.', keyboardType: const TextInputType.numberWithOptions(decimal: true))),
        const SizedBox(width: 8),
        SizedBox(width: 36, height: 36, child: ElevatedButton(onPressed: _agregarProducto, style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, foregroundColor: Colors.white, padding: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), child: const Icon(Icons.add, size: 18))),
      ]),
      if (_productos.isNotEmpty) ...[
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(border: Border.all(color: AppTheme.slate200), borderRadius: BorderRadius.circular(8)),
          child: Column(children: [
            ..._productos.asMap().entries.map((e) {
              final i = e.key; final p = e.value;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: i < _productos.length - 1 ? const BoxDecoration(border: Border(bottom: BorderSide(color: AppTheme.slate100))) : null,
                child: Row(children: [
                  Expanded(child: Text(p.proNombre, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.slate800), overflow: TextOverflow.ellipsis)),
                  Text('${p.cantidad} x \$${p.precioUnitario.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: AppTheme.slate500)),
                  const SizedBox(width: 8),
                  Text('\$${p.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.emerald600)),
                  const SizedBox(width: 4),
                  GestureDetector(onTap: () => setState(() => _productos.removeAt(i)), child: const Icon(Icons.close, size: 16, color: AppTheme.slate400)),
                ]),
              );
            }),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: const BoxDecoration(color: AppTheme.slate50, borderRadius: BorderRadius.vertical(bottom: Radius.circular(7))),
              child: Row(children: [
                const Text('Total (antes de IVA):', style: TextStyle(fontSize: 11, color: AppTheme.slate500)),
                const Spacer(),
                Text('\$${_total.toStringAsFixed(0)} COP', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.orange400)),
              ]),
            ),
          ]),
        ),
      ],
    ];
  }

  Widget _campoFecha() => GestureDetector(
    onTap: _pickFecha,
    child: AbsorbPointer(
      child: TextFormField(
        controller: _fechaCtrl, validator: (v) => v == null || v.trim().isEmpty ? 'Requerido' : null,
        style: const TextStyle(fontSize: 13, color: AppTheme.slate800),
        decoration: _dec('YYYY-MM-DD').copyWith(suffixIcon: const Icon(Icons.calendar_today, size: 16, color: AppTheme.slate400)),
      ),
    ),
  );

  Widget _fTiny(TextEditingController c, String h, {TextInputType? keyboardType}) => TextFormField(controller: c, keyboardType: keyboardType, style: const TextStyle(fontSize: 12, color: AppTheme.slate800), decoration: InputDecoration(hintText: h, hintStyle: const TextStyle(color: AppTheme.slate300, fontSize: 12), filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppTheme.slate200)), contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8), isDense: true));

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
          value: val.isEmpty ? null : val, isExpanded: true, menuMaxHeight: 250,
          hint: Text(hint ?? 'Seleccionar...', style: const TextStyle(color: AppTheme.slate300, fontSize: 13)),
          items: all.map((e) {
            if (e == '__new__') return const DropdownMenuItem(value: '__new__', child: Row(children: [Icon(Icons.person_add, size: 15, color: AppTheme.blue600), SizedBox(width: 5), Text('Crear nuevo cliente', style: TextStyle(fontSize: 13, color: AppTheme.blue600))]));
            return DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, color: AppTheme.slate800), overflow: TextOverflow.ellipsis));
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _ddSimple(String val, List<String> items, ValueChanged<String?> onChanged) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6), border: Border.all(color: AppTheme.slate200)),
    child: DropdownButtonHideUnderline(child: DropdownButton<String>(value: val, isExpanded: true, items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12, color: AppTheme.slate800)))).toList(), onChanged: onChanged)),
  );
}
