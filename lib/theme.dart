import 'package:flutter/material.dart';

class AppTheme {
  static const primary = Color(0xFF2563EB);
  static const primaryDark = Color(0xFF1E40AF);
  static const blue600 = Color(0xFF2563EB);
  static const blue700 = Color(0xFF1D4ED8);
  static const blue800 = Color(0xFF1E40AF);
  static const indigo600 = Color(0xFF4F46E5);
  static const slate800 = Color(0xFF1E293B);
  static const slate700 = Color(0xFF334155);
  static const slate600 = Color(0xFF475569);
  static const slate500 = Color(0xFF64748B);
  static const slate400 = Color(0xFF94A3B8);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate50 = Color(0xFFF8FAFC);
  static const emerald600 = Color(0xFF059669);
  static const emerald500 = Color(0xFF10B981);
  static const emerald50 = Color(0xFFECFDF5);
  static const amber600 = Color(0xFFD97706);
  static const amber500 = Color(0xFFF59E0B);
  static const amber50 = Color(0xFFFFFBEB);
  static const red600 = Color(0xFFDC2626);
  static const red500 = Color(0xFFEF4444);
  static const red400 = Color(0xFFF87171);
  static const red50 = Color(0xFFFEF2F2);
  static const purple600 = Color(0xFF7C3AED);
  static const purple50 = Color(0xFFF5F3FF);
  static const orange400 = Color(0xFFFB923C);
  static const orange50 = Color(0xFFFFF7ED);
  static const indigo50 = Color(0xFFEEF2FF);
  static const blue50 = Color(0xFFEFF6FF);

  static const gradientBlue = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const gradientHeader = LinearGradient(
    colors: [Color(0xFF1D4ED8), Color(0xFF2563EB), Color(0xFF4F46E5)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const gradientBg = LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF1E293B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0x1A000000), width: 0.5),
        ),
        color: Colors.white,
      ),
    );
  }
}
