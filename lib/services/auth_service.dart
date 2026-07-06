import 'dart:convert';
import 'api_client.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>?> login(String email, String password) async {
    final response = await _client.post('/login', {
      'usu_correo': email,
      'usu_contrasena': password,
    });

    if (response.statusCode == 200 && response.body.isNotEmpty) {
      final data = jsonDecode(response.body);
      if (data is Map && data['access_token'] != null) {
        await _client.setToken(data['access_token'].toString());
        await _client.saveUserData({
          'usu_id': data['usu_id'],
          'usu_nombre': data['usu_nombre'],
          'usu_rol': data['usu_rol'],
        });
        return data as Map<String, dynamic>;
      }
    }

    if (response.statusCode == 401) return null;
    return null;
  }

  Future<void> logout() async {
    try {
      await _client.post('/logout', {});
    } catch (_) {}
    await _client.clearToken();
  }
}
