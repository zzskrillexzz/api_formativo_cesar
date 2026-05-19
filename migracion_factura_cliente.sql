-- Migración: agregar columna fac_cli_id_fk a t_factura
-- Permite que la factura tenga una referencia directa al cliente,
-- haciendo la tabla compatible con la estructura de t_pedido.
-- Ejecutar contra la base de datos db_drogueria_sandiego

USE `db_drogueria_sandiego`;

ALTER TABLE `t_factura`
  ADD COLUMN IF NOT EXISTS `fac_cli_id_fk` INT(11) DEFAULT NULL COMMENT 'ID del cliente asociado a la factura' AFTER `fac_estado`,
  ADD KEY IF NOT EXISTS `fac_cli_id_fk` (`fac_cli_id_fk`);

-- Poblar fac_cli_id_fk con los datos existentes desde t_pedido
UPDATE `t_factura` f
  INNER JOIN `t_pedido` p ON f.fac_id = p.ped_id
  SET f.fac_cli_id_fk = p.ped_cli_id_fk
  WHERE f.fac_cli_id_fk IS NULL;
