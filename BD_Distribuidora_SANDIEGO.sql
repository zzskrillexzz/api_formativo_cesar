/*
SQLyog Trial v13.1.9 (64 bit)
MySQL - 10.4.32-MariaDB : Database - db_drogueria_sandiego
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`db_drogueria_sandiego` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `db_drogueria_sandiego`;

/*Table structure for table `t_cliente` */

DROP TABLE IF EXISTS `t_cliente`;

CREATE TABLE `t_cliente` (
  `cli_id` varchar(20) NOT NULL COMMENT 'ID del cliente',
  `cli_nombre` varchar(50) DEFAULT NULL COMMENT 'Nombre del cliente',
  `cli_apellido` varchar(50) DEFAULT NULL COMMENT 'Apellido del cliente',
  `cli_telefono` varchar(20) DEFAULT NULL COMMENT 'Teléfono del cliente',
  `cli_direccion` varchar(100) DEFAULT NULL COMMENT 'Dirección del cliente',
  `cli_correo` varchar(100) DEFAULT NULL COMMENT 'Correo del cliente',
  PRIMARY KEY (`cli_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_cliente` */

insert  into `t_cliente`(`cli_id`,`cli_nombre`,`cli_apellido`,`cli_telefono`,`cli_direccion`,`cli_correo`) values 
('1023456789','Carlos','Gomez','3157894561','Cl 80 #20-35','cgomez@hotmail.com'),
('1065432198','Maria','Salcedo','3143216547','Cl 45 #8-15','msalcedo@gmail.com'),
('1076543219','Jhon','Rios','3209876543','Cra 7 #12-50','jhonrios@gmail.com'),
('1087654321','Ana','Torres','3012345678','Av 68 #55-20','ana.torres@yahoo.com'),
('1098765432','Laura','Martinez','3104567890','Cra 15 #42-10','l.martinez@gmail.com');

/*Table structure for table `t_detalle_pedido` */

DROP TABLE IF EXISTS `t_detalle_pedido`;

CREATE TABLE `t_detalle_pedido` (
  `det_id` varchar(20) NOT NULL COMMENT 'ID de los detalles del pedido',
  `det_cantidad` int(11) DEFAULT NULL COMMENT 'Cantidad de productos',
  `det_subtotal` decimal(12,2) DEFAULT NULL COMMENT 'Subtotal de los productos',
  PRIMARY KEY (`det_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_detalle_pedido` */

insert  into `t_detalle_pedido`(`det_id`,`det_cantidad`,`det_subtotal`) values 
('DET001',5,4250.00),
('DET002',3,3600.00),
('DET003',4,3920.00),
('DET004',2,7000.00),
('DET005',1,4200.00);

/*Table structure for table `t_factura` */

DROP TABLE IF EXISTS `t_factura`;

CREATE TABLE `t_factura` (
  `fac_id` varchar(20) NOT NULL COMMENT 'ID de la factura',
  `fac_fecha_emision` date DEFAULT NULL COMMENT 'Fecha de emisión de la factura',
  `fac_email_enviado` tinyint(1) DEFAULT NULL COMMENT 'Confirmación de envío (1=Sí / 0=No)',
  `fac_forma_pago` varchar(50) DEFAULT NULL COMMENT 'Forma de pago',
  `fac_total` decimal(12,2) DEFAULT NULL COMMENT 'Total de la factura',
  `fac_usu_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del usuario',
  PRIMARY KEY (`fac_id`),
  KEY `fac_usu_id_fk` (`fac_usu_id_fk`),
  CONSTRAINT `factura_ibfk_1` FOREIGN KEY (`fac_id`) REFERENCES `t_pedido` (`ped_id`),
  CONSTRAINT `factura_ibfk_2` FOREIGN KEY (`fac_usu_id_fk`) REFERENCES `t_usuario` (`usu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_factura` */

insert  into `t_factura`(`fac_id`,`fac_fecha_emision`,`fac_email_enviado`,`fac_forma_pago`,`fac_total`,`fac_usu_id_fk`) values 
('PED001','2025-03-15',1,'Efectivo',8450.00,'USU002'),
('PED002','2025-03-16',1,'Tarjeta',12700.00,'USU003'),
('PED003','2025-03-17',0,'Nequi',5880.00,'USU002'),
('PED004','2025-03-18',0,'Efectivo',4200.00,'USU003'),
('PED005','2025-03-19',1,'Daviplata',9800.00,'USU002');

/*Table structure for table `t_inventario_movimiento` */

DROP TABLE IF EXISTS `t_inventario_movimiento`;

CREATE TABLE `t_inventario_movimiento` (
  `inm_id` varchar(20) NOT NULL COMMENT 'ID del movimiento',
  `inm_tipo_movimiento` varchar(20) DEFAULT NULL COMMENT 'Tipo: Entrada / Salida',
  `inm_pro_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del producto',
  `inm_cantidad` int(11) DEFAULT NULL COMMENT 'Cantidad del movimiento',
  `inm_fecha` date DEFAULT NULL COMMENT 'Fecha del movimiento',
  `inm_motivo` varchar(255) DEFAULT NULL COMMENT 'Motivo del movimiento',
  `inm_usu_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del usuario responsable',
  PRIMARY KEY (`inm_id`),
  KEY `inm_pro_id_fk` (`inm_pro_id_fk`),
  KEY `inm_usu_id_fk` (`inm_usu_id_fk`),
  CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`inm_pro_id_fk`) REFERENCES `t_producto` (`pro_id`),
  CONSTRAINT `inventario_ibfk_2` FOREIGN KEY (`inm_usu_id_fk`) REFERENCES `t_usuario` (`usu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_inventario_movimiento` */

insert  into `t_inventario_movimiento`(`inm_id`,`inm_tipo_movimiento`,`inm_pro_id_fk`,`inm_cantidad`,`inm_fecha`,`inm_motivo`,`inm_usu_id_fk`) values 
('INM001','Entrada','PRO001',100,'2025-03-10','Compra proveedor','USU004'),
('INM002','Salida','PRO001',5,'2025-03-15','Venta PED001','USU002'),
('INM003','Salida','PRO002',3,'2025-03-16','Venta PED002','USU003'),
('INM004','Entrada','PRO003',50,'2025-03-12','Compra proveedor','USU004'),
('INM005','Salida','PRO005',1,'2025-03-18','Venta PED004','USU003');

/*Table structure for table `t_pedido` */

DROP TABLE IF EXISTS `t_pedido`;

CREATE TABLE `t_pedido` (
  `ped_id` varchar(20) NOT NULL COMMENT 'ID del pedido',
  `ped_fecha` date DEFAULT NULL COMMENT 'Fecha del pedido',
  `ped_metodo_pago` varchar(50) DEFAULT NULL COMMENT 'Método de pago',
  `ped_estado_entrega` varchar(50) DEFAULT NULL COMMENT 'Estado de entrega',
  `ped_total` decimal(12,2) DEFAULT NULL COMMENT 'Total del pedido',
  `ped_cli_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del cliente',
  `ped_det_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del detalle de pedido',
  PRIMARY KEY (`ped_id`),
  KEY `ped_cli_id_fk` (`ped_cli_id_fk`),
  KEY `ped_det_id_fk` (`ped_det_id_fk`),
  CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`ped_cli_id_fk`) REFERENCES `t_cliente` (`cli_id`),
  CONSTRAINT `pedido_ibfk_2` FOREIGN KEY (`ped_det_id_fk`) REFERENCES `t_detalle_pedido` (`det_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_pedido` */

insert  into `t_pedido`(`ped_id`,`ped_fecha`,`ped_metodo_pago`,`ped_estado_entrega`,`ped_total`,`ped_cli_id_fk`,`ped_det_id_fk`) values 
('PED001','2025-03-15','Efectivo','Entregado',8450.00,'1098765432','DET001'),
('PED002','2025-03-16','Tarjeta','En camino',12700.00,'1023456789','DET002'),
('PED003','2025-03-17','Nequi','Entregado',5880.00,'1087654321','DET003'),
('PED004','2025-03-18','Efectivo','No entregado',4200.00,'1076543219','DET004'),
('PED005','2025-03-19','Daviplata','En camino',9800.00,'1065432198','DET005');

/*Table structure for table `t_producto` */

DROP TABLE IF EXISTS `t_producto`;

CREATE TABLE `t_producto` (
  `pro_id` varchar(20) NOT NULL COMMENT 'ID del producto',
  `pro_categoria` varchar(50) DEFAULT NULL COMMENT 'Categoría del producto',
  `pro_cantidad_disponible` int(11) DEFAULT NULL COMMENT 'Cantidad disponible en stock',
  `pro_precio` decimal(12,2) DEFAULT NULL COMMENT 'Precio unitario del producto',
  `pro_nombre` varchar(100) DEFAULT NULL COMMENT 'Nombre del producto',
  `pro_fecha_caducidad` date DEFAULT NULL COMMENT 'Fecha de caducidad del producto',
  `pro_descripcion` varchar(255) DEFAULT NULL COMMENT 'Descripción del producto',
  `pro_prov_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del proveedor',
  `pro_det_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID de detalle de pedido',
  PRIMARY KEY (`pro_id`),
  KEY `pro_prov_id_fk` (`pro_prov_id_fk`),
  KEY `pro_det_id_fk` (`pro_det_id_fk`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`pro_prov_id_fk`) REFERENCES `t_proveedor` (`prov_id`),
  CONSTRAINT `producto_ibfk_2` FOREIGN KEY (`pro_det_id_fk`) REFERENCES `t_detalle_pedido` (`det_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_producto` */

insert  into `t_producto`(`pro_id`,`pro_categoria`,`pro_cantidad_disponible`,`pro_precio`,`pro_nombre`,`pro_fecha_caducidad`,`pro_descripcion`,`pro_prov_id_fk`,`pro_det_id_fk`) values 
('PRO001','Analgesico',200,850.00,'Acetaminofen 500','2026-08-31','Caja x 10 tab','PROV002','DET001'),
('PRO002','Antiinflamatorio',150,1200.00,'Ibuprofeno 400','2026-06-30','Caja x 10 tab','PROV001','DET002'),
('PRO003','Antihistaminico',80,980.00,'Loratadina 10mg','2027-01-31','Caja x 10 tab','PROV003','DET003'),
('PRO004','Hidratacion',60,3500.00,'Suero oral 500ml','2026-12-15','Electrolitos','PROV004','DET004'),
('PRO005','Antiseptico',45,4200.00,'Alcohol 70% 250ml','2027-05-20','Uso externo','PROV005','DET005');

/*Table structure for table `t_proveedor` */

DROP TABLE IF EXISTS `t_proveedor`;

CREATE TABLE `t_proveedor` (
  `prov_id` varchar(20) NOT NULL COMMENT 'ID del proveedor',
  `prov_nombre` varchar(100) DEFAULT NULL COMMENT 'Nombre del proveedor',
  `prov_contacto` varchar(20) DEFAULT NULL COMMENT 'Teléfono del proveedor',
  `prov_direccion` varchar(100) DEFAULT NULL COMMENT 'Dirección del proveedor',
  `prov_email` varchar(100) DEFAULT NULL COMMENT 'Email del proveedor',
  `prov_pro_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del producto principal',
  PRIMARY KEY (`prov_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_proveedor` */

insert  into `t_proveedor`(`prov_id`,`prov_nombre`,`prov_contacto`,`prov_direccion`,`prov_email`,`prov_pro_id_fk`) values 
('PROV001','Bayer Colombia','6012345678','Bogota Zona Industrial','ventas@bayer.co','PRO002'),
('PROV002','Tecnoquimicas','6027654321','Cali Yumbo','pedidos@tq.com','PRO001'),
('PROV003','Genfar S.A.','6038765432','Bogota Autopista Sur','dist@genfar.co','PRO003'),
('PROV004','Lab. La Sante','6019876543','Bogota Chia','info@lasante.co','PRO004'),
('PROV005','Cofarma Ltda','6054321987','Medellin El Poblado','pedidos@cofarma.com','PRO005');

/*Table structure for table `t_proveedor_producto` */

DROP TABLE IF EXISTS `t_proveedor_producto`;

CREATE TABLE `t_proveedor_producto` (
  `ppp_prov_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del proveedor',
  `ppp_pro_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del producto',
  KEY `ppp_prov_id_fk` (`ppp_prov_id_fk`),
  KEY `ppp_pro_id_fk` (`ppp_pro_id_fk`),
  CONSTRAINT `prov_pro_ibfk_1` FOREIGN KEY (`ppp_prov_id_fk`) REFERENCES `t_proveedor` (`prov_id`),
  CONSTRAINT `prov_pro_ibfk_2` FOREIGN KEY (`ppp_pro_id_fk`) REFERENCES `t_producto` (`pro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_proveedor_producto` */

insert  into `t_proveedor_producto`(`ppp_prov_id_fk`,`ppp_pro_id_fk`) values 
('PROV002','PRO001'),
('PROV001','PRO002'),
('PROV003','PRO003'),
('PROV004','PRO004'),
('PROV005','PRO005');

/*Table structure for table `t_usuario` */

DROP TABLE IF EXISTS `t_usuario`;

CREATE TABLE `t_usuario` (
  `usu_id` varchar(20) NOT NULL COMMENT 'ID del usuario',
  `usu_nombre` varchar(100) DEFAULT NULL COMMENT 'Nombre del usuario',
  `usu_rol` varchar(50) DEFAULT NULL COMMENT 'Rol del usuario',
  `usu_correo` varchar(100) DEFAULT NULL COMMENT 'Correo electrónico del usuario',
  `usu_contrasena` varchar(100) DEFAULT NULL COMMENT 'Contraseña del usuario',
  `usu_fac_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID de la factura asociada',
  PRIMARY KEY (`usu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_usuario` */

insert  into `t_usuario`(`usu_id`,`usu_nombre`,`usu_rol`,`usu_correo`,`usu_contrasena`,`usu_fac_id_fk`) values 
('USU001','Diana Lopez','Administrador','d.lopez@sd.com','Admin#2025',NULL),
('USU002','Pedro Vargas','Vendedor','p.vargas@sd.com','Vend#Pedro1','FAC001'),
('USU003','Sandra Nino','Vendedor','s.nino@sd.com','Vend#Sandra2','FAC002'),
('USU004','Camilo Ruiz','Bodeguero','c.ruiz@sd.com','Bodeg#Cam3',NULL),
('USU005','Luisa Mora','Contador','l.mora@sd.com','Cont#Luisa4',NULL);

/*Table structure for table `t_usuario_factura` */

DROP TABLE IF EXISTS `t_usuario_factura`;

CREATE TABLE `t_usuario_factura` (
  `usa_usu_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID del usuario',
  `usa_fac_id_fk` varchar(20) DEFAULT NULL COMMENT 'ID de la factura',
  KEY `usa_usu_id_fk` (`usa_usu_id_fk`),
  KEY `usa_fac_id_fk` (`usa_fac_id_fk`),
  CONSTRAINT `usu_fac_ibfk_1` FOREIGN KEY (`usa_usu_id_fk`) REFERENCES `t_usuario` (`usu_id`),
  CONSTRAINT `usu_fac_ibfk_2` FOREIGN KEY (`usa_fac_id_fk`) REFERENCES `t_factura` (`fac_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Data for the table `t_usuario_factura` */

insert  into `t_usuario_factura`(`usa_usu_id_fk`,`usa_fac_id_fk`) values 
('USU002','PED001'),
('USU003','PED002'),
('USU002','PED003'),
('USU003','PED004'),
('USU002','PED005');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
