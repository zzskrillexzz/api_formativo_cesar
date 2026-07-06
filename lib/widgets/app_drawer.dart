import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';

class AppDrawer extends StatelessWidget {
  final int currentIndex;
  final void Function(int) onTap;

  const AppDrawer({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Drawer(
      width: 260,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 60,
              left: 20,
              child: Text(
                '+',
                style: TextStyle(color: Colors.white.withAlpha(25), fontSize: 16),
              ),
            ),
            Positioned(
              top: 80,
              right: 30,
              child: Text(
                '+',
                style: TextStyle(color: Colors.white.withAlpha(25), fontSize: 16),
              ),
            ),
            Positioned(
              bottom: 120,
              left: 30,
              child: Text(
                '+',
                style: TextStyle(color: Colors.white.withAlpha(15), fontSize: 16),
              ),
            ),
            SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  Image.asset(
                    'assets/images/logo.png',
                    width: 100,
                    height: 100,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'LOGISTICS',
                    style: TextStyle(
                      color: Color(0x99FFFFFF),
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                    ),
                  ),
                  const SizedBox(height: 24),
              _buildMenuItem(context, Icons.dashboard_outlined, 'Dashboard', 0),
              _buildMenuItem(context, Icons.inventory_2_outlined, 'Productos', 1),
              _buildMenuItem(context, Icons.qr_code_outlined, 'Lotes', 2),
              _buildMenuItem(context, Icons.receipt_long_outlined, 'Pedidos', 3),
                  const Spacer(),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          auth.logout();
                        },
                        icon: const Icon(Icons.logout, size: 14),
                        label: const Text(
                          'SALIR',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0x80FFFFFF),
                          backgroundColor: Colors.white.withAlpha(25),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String label, int index) {
    final selected = currentIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.pop(context);
            onTap(index);
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: BoxDecoration(
              color: selected ? Colors.white.withAlpha(23) : null,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 18,
                  color: selected ? AppTheme.orange400 : const Color(0x99FFFFFF),
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    color: selected ? Colors.white : const Color(0x99FFFFFF),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
