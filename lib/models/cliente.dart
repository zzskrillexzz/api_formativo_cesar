class Cliente {
  final int id;
  final String tipoDocumento;
  final String nombre;
  final String apellido;
  final String? correo;
  final String? telefono;
  final String? direccion;

  Cliente({
    required this.id,
    required this.tipoDocumento,
    required this.nombre,
    required this.apellido,
    this.correo,
    this.telefono,
    this.direccion,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      id: (json['cli_id'] is int)
          ? json['cli_id']
          : int.tryParse(json['cli_id']?.toString() ?? '0') ?? 0,
      tipoDocumento: json['cli_tipo_documento']?.toString() ?? 'CC',
      nombre: json['cli_nombre']?.toString() ?? '',
      apellido: json['cli_apellido']?.toString() ?? '',
      correo: json['cli_correo']?.toString(),
      telefono: json['cli_telefono']?.toString(),
      direccion: json['cli_direccion']?.toString(),
    );
  }

  String get nombreCompleto => '$nombre $apellido'.trim();
}
