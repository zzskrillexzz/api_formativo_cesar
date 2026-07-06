import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  static final _client = http.Client();
  static const _timeout = Duration(seconds: 10);

  String? _token;

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  Future<String?> getToken() async {
    if (_token != null && _token!.isNotEmpty) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('access_token');
    return _token;
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_data');
  }

  Future<void> saveUserData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(data));
  }

  Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('user_data');
    if (data != null) {
      return jsonDecode(data) as Map<String, dynamic>;
    }
    return null;
  }

  Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String path) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}$path');
    return _client.get(url, headers: await _headers()).timeout(_timeout);
  }

  Future<http.Response> post(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}$path');
    return _client.post(url, headers: await _headers(), body: jsonEncode(body)).timeout(_timeout);
  }

  Future<http.Response> put(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}$path');
    return _client.put(url, headers: await _headers(), body: jsonEncode(body)).timeout(_timeout);
  }

  Future<http.Response> delete(String path) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}$path');
    return _client.delete(url, headers: await _headers()).timeout(_timeout);
  }
}
