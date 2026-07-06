import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiClient _apiClient = ApiClient();

  bool _isLogged = false;
  bool _isLoading = true;
  String _role = '';
  String _userName = '';
  String _userId = '';

  bool get isLogged => _isLogged;
  bool get isLoading => _isLoading;
  String get role => _role;
  String get userName => _userName;
  String get userId => _userId;

  Future<void> checkSession() async {
    try {
      final token = await _apiClient.getToken();
      final userData = await _apiClient.getUserData();

      if (token != null && userData != null) {
        _isLogged = true;
        _userName = userData['usu_nombre']?.toString() ?? '';
        _role = userData['usu_rol']?.toString() ?? '';
        _userId = userData['usu_id']?.toString() ?? '';
      } else {
        _isLogged = false;
      }
    } catch (e) {
      _isLogged = false;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    try {
      final result = await _authService.login(email, password);
      if (result != null) {
        _isLogged = true;
        _userName = result['usu_nombre']?.toString() ?? '';
        _role = result['usu_rol']?.toString() ?? '';
        _userId = result['usu_id']?.toString() ?? '';
        notifyListeners();
        return null;
      }
      return 'Credenciales incorrectas';
    } catch (e) {
      return 'Error de conexión: ${e.toString()}';
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _isLogged = false;
    _userName = '';
    _role = '';
    _userId = '';
    notifyListeners();
  }
}
