import 'dart:convert';
import '../models/producto.dart';
import '../models/dashboard_data.dart';
import '../models/pedido.dart';
import '../models/lote.dart';
import '../models/proveedor.dart';
import '../models/cliente.dart';
import 'api_client.dart';

class ProductoService {
  final ApiClient _client = ApiClient();

  Future<List<Producto>> getProductos() async {
    try {
      final response = await _client.get('/productos/');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        List<dynamic> data;
        if (decoded is Map && decoded.containsKey('data')) {
          data = decoded['data'] as List<dynamic>;
        } else if (decoded is List) {
          data = decoded;
        } else {
          return [];
        }
        return data
            .map((e) => Producto.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<String?> registrarProducto(Map<String, dynamic> data) async {
    try {
      final response = await _client.post('/productos/', data);
      if (response.statusCode == 201) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al crear producto';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<String> getNextProductoId() async {
    try {
      final response = await _client.get('/productos/next-id');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return decoded['next_id']?.toString() ?? '';
      }
    } catch (_) {}
    return '';
  }

  Future<String?> editarProducto(Map<String, dynamic> data) async {
    try {
      final response = await _client.put('/productos/', data);
      if (response.statusCode == 200) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al editar producto';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<String?> eliminarProducto(String id) async {
    try {
      final response = await _client.delete('/productos/$id?force=true');
      if (response.statusCode == 200) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al eliminar producto';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<List<Proveedor>> getProveedores() async {
    try {
      final response = await _client.get('/proveedores/');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        List<dynamic> data;
        if (decoded is Map && decoded.containsKey('data')) {
          data = decoded['data'] as List<dynamic>;
        } else if (decoded is List) {
          data = decoded;
        } else {
          return [];
        }
        return data.map((e) => Proveedor.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<DashboardData?> getDashboardResumen() async {
    try {
      final response = await _client.get('/dashboard/resumen');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return DashboardData.fromJson(decoded as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

class PedidoService {
  final ApiClient _client = ApiClient();

  Future<List<Pedido>> getPedidos() async {
    try {
      final response = await _client.get('/pedidos/');
      if (response.statusCode == 200 && response.body.isNotEmpty) {
        final decoded = jsonDecode(response.body);
        List<dynamic> rawData;
        if (decoded is Map && decoded.containsKey('data')) {
          rawData = decoded['data'] as List<dynamic>;
        } else if (decoded is List) {
          rawData = decoded;
        } else {
          return [];
        }

        final result = <Pedido>[];
        for (final e in rawData) {
          try {
            result.add(Pedido.fromJson(e as Map<String, dynamic>));
          } catch (ex) {
            // skip invalid items
          }
        }
        return result;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<String> getNextPedidoId() async {
    try {
      final response = await _client.get('/pedidos/next-id');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return decoded['next_id']?.toString() ?? '';
      }
    } catch (_) {}
    return '';
  }
}

class LoteService {
  final ApiClient _client = ApiClient();

  Future<List<Lote>> getLotes({Map<String, String>? filtros}) async {
    try {
      String path = '/lotes/';
      if (filtros != null && filtros.isNotEmpty) {
        final params = filtros.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
        path = '/lotes/?$params';
      }
      final response = await _client.get(path);
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        List<dynamic> data;
        if (decoded is Map && decoded.containsKey('data')) {
          data = decoded['data'] as List<dynamic>;
        } else if (decoded is List) {
          data = decoded;
        } else {
          return [];
        }
        return data.map((e) => Lote.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<String?> registrarLote(Map<String, dynamic> data) async {
    try {
      final response = await _client.post('/lotes/', data);
      if (response.statusCode == 201) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al crear lote';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<String?> editarLote(Map<String, dynamic> data) async {
    try {
      final response = await _client.put('/lotes/', data);
      if (response.statusCode == 200) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al editar lote';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<String?> eliminarLote(String id) async {
    try {
      final response = await _client.delete('/lotes/$id?force=true');
      if (response.statusCode == 200) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al eliminar lote';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<String?> activarLote(String id) async {
    try {
      final response = await _client.post('/lotes/$id/activar', {});
      if (response.statusCode == 200) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al activar lote';
    } catch (e) {
      return 'Error de conexión';
    }
  }
}

class ClienteService {
  final ApiClient _client = ApiClient();

  Future<List<Cliente>> getClientes({String? q}) async {
    try {
      String path = '/clientes/';
      if (q != null && q.isNotEmpty) {
        path = '/clientes/?q=${Uri.encodeComponent(q)}&limit=50';
      }
      final response = await _client.get(path);
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        List<dynamic> data;
        if (decoded is Map && decoded.containsKey('data')) {
          data = decoded['data'] as List<dynamic>;
        } else if (decoded is List) {
          data = decoded;
        } else {
          return [];
        }
        return data.map((e) => Cliente.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<String?> registrarCliente(Map<String, dynamic> data) async {
    try {
      final response = await _client.post('/clientes/', data);
      if (response.statusCode == 201) return null;
      final decoded = jsonDecode(response.body);
      return decoded['mensaje']?.toString() ?? 'Error al crear cliente';
    } catch (e) {
      return 'Error de conexión';
    }
  }
}
