import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    final error = await auth.login(
      _emailController.text.trim(),
      _passwordController.text,
    );
    if (mounted) {
      setState(() {
        _loading = false;
        _error = error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: true,
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Container(
          decoration: const BoxDecoration(gradient: AppTheme.gradientBg),
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildBluePanel(),
                    _buildFormPanel(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBluePanel() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Image.asset('assets/images/logo.png', width: 80, height: 80),
          const SizedBox(height: 4),
          const Text(
            'LOGISTICS',
            style: TextStyle(
              color: Color(0x66FFFFFF),
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: 4,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (i) =>
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i == 0
                    ? const Color(0xCC93C5FD)
                    : Colors.white.withAlpha(30),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormPanel() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 45,
            offset: Offset(0, 20),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
      child: _buildForm(),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.slate800),
              children: [
                TextSpan(text: 'Iniciar '),
                TextSpan(text: 'Sesión', style: TextStyle(color: AppTheme.blue600)),
              ],
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Ingrese sus credenciales de acceso',
            style: TextStyle(fontSize: 12, color: AppTheme.slate400),
          ),
          const SizedBox(height: 24),
          if (_error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.red50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0x33DC2626)),
              ),
              child: Text(
                _error!,
                style: const TextStyle(
                  color: AppTheme.red600,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          _buildInputField(
            label: 'CORREO ELECTRÓNICO',
            controller: _emailController,
            hint: 'ejemplo@ezlogistics.com',
            keyboardType: TextInputType.emailAddress,
            validator: (v) => v == null || v.trim().isEmpty ? 'El correo es obligatorio' : (!RegExp(r'\S+@\S+\.\S+').hasMatch(v) ? 'Correo no válido' : null),
          ),
          const SizedBox(height: 20),
          _buildInputField(
            label: 'CONTRASEÑA',
            controller: _passwordController,
            hint: '••••••••',
            obscure: _obscurePassword,
            suffix: GestureDetector(
              onTap: () => setState(() => _obscurePassword = !_obscurePassword),
              child: const Icon(Icons.visibility_off_outlined, size: 18, color: AppTheme.slate400),
            ),
            validator: (v) => v == null || v.isEmpty ? 'La contraseña es obligatoria' : null,
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: AppTheme.blue600,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppTheme.slate200,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
                elevation: 6,
                shadowColor: AppTheme.blue600.withAlpha(64),
              ),
              child: _loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'ENTRAR',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 2),
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    String? hint,
    bool obscure = false,
    Widget? suffix,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.slate400, letterSpacing: 2),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.slate800),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.slate200, fontSize: 14),
            suffixIcon: suffix != null ? Padding(padding: const EdgeInsets.only(right: 8), child: suffix) : null,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            isDense: true,
            enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppTheme.slate200)),
            focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppTheme.blue600, width: 1.5)),
            errorBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppTheme.red600)),
            errorStyle: const TextStyle(fontSize: 10, color: AppTheme.red600),
          ),
          validator: validator,
        ),
      ],
    );
  }
}
