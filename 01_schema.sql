-- ========================================
-- SISTEMA DE GESTIÓN DE RESERVAS CITRO
-- Schema SQL para Supabase (PostgreSQL)
-- ========================================

-- 1. Tabla de Salas
CREATE TABLE salas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  capacidad INTEGER NOT NULL,
  ubicacion VARCHAR(255),
  color VARCHAR(7) DEFAULT '#4472C4',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol VARCHAR(50) NOT NULL DEFAULT 'usuario', -- 'usuario', 'admin', 'director'
  departamento VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Reservas
CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE RESTRICT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio INTEGER NOT NULL, -- 9-19
  duracion_horas INTEGER DEFAULT 1,
  motivo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  asistentes_estimados INTEGER,
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'
  rechazada_razon TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  aprobada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  aprobada_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Auditoría (historial de cambios)
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(255) NOT NULL,
  registro_id INTEGER NOT NULL,
  accion VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Notificaciones
CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'CONFIRMACION', 'APROBACION', 'RECHAZO', 'RECORDATORIO'
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

CREATE INDEX idx_reservas_sala_fecha ON reservas(sala_id, fecha);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ========================================
-- INSERTS DE DATOS INICIALES
-- ========================================

-- Salas
INSERT INTO salas (nombre, descripcion, capacidad, ubicacion, color) VALUES
('Salón de Usos Múltiples CITRO', 'Espacio versátil para clases y eventos', 50, 'Edificio A - Planta 2', '#70AD47'),
('Auditorio Orquidario', 'Auditorio principal con equipo audiovisual', 100, 'Edificio B - Planta 1', '#4472C4'),
('Salón Orquidario', 'Sala de seminarios y reuniones', 30, 'Edificio A - Planta 1', '#FFC000');

-- Usuarios iniciales
INSERT INTO usuarios (email, nombre, rol, departamento) VALUES
('admin@citro.edu.mx', 'Rosa García', 'admin', 'Administración'),
('director@citro.edu.mx', 'Dr. Miguel López', 'director', 'Dirección'),
('carlos@citro.edu.mx', 'Dr. Carlos López', 'usuario', 'Investigación'),
('maria@citro.edu.mx', 'Dra. María García', 'usuario', 'Docencia');

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista: Disponibilidad por sala y fecha
CREATE VIEW v_disponibilidad_salas AS
SELECT 
  s.id,
  s.nombre,
  s.capacidad,
  DATE(r.fecha) as fecha,
  r.hora_inicio,
  CASE 
    WHEN r.id IS NOT NULL AND r.estado = 'APROBADA' THEN 'OCUPADA'
    ELSE 'LIBRE'
  END as estado
FROM salas s
CROSS JOIN (
  SELECT DATE(NOW() + INTERVAL '1 day' * generate_series(0, 90))::date as fecha,
         generate_series(9, 18)::integer as hora_inicio
) dates
LEFT JOIN reservas r ON s.id = r.sala_id 
  AND DATE(r.fecha) = dates.fecha 
  AND r.hora_inicio = dates.hora_inicio
  AND r.estado = 'APROBADA'
WHERE s.activa = true
ORDER BY s.id, dates.fecha, dates.hora_inicio;

-- Vista: Estadísticas de reservas
CREATE VIEW v_estadisticas_reservas AS
SELECT 
  s.id as sala_id,
  s.nombre as sala_nombre,
  COUNT(*) as total_reservas,
  COUNT(CASE WHEN r.estado = 'APROBADA' THEN 1 END) as aprobadas,
  COUNT(CASE WHEN r.estado = 'PENDIENTE' THEN 1 END) as pendientes,
  COUNT(CASE WHEN r.estado = 'RECHAZADA' THEN 1 END) as rechazadas,
  ROUND(AVG(r.asistentes_estimados), 0) as promedio_asistentes
FROM salas s
LEFT JOIN reservas r ON s.id = r.sala_id
WHERE DATE(r.fecha) >= DATE(NOW() - INTERVAL '1 month')
GROUP BY s.id, s.nombre;

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función: Validar conflictos de horario
CREATE OR REPLACE FUNCTION validar_conflicto_horario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'APROBADA' THEN
    IF EXISTS (
      SELECT 1 FROM reservas
      WHERE sala_id = NEW.sala_id
        AND fecha = NEW.fecha
        AND hora_inicio = NEW.hora_inicio
        AND estado = 'APROBADA'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Ya existe una reserva aprobada en ese horario para esta sala';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validar conflictos antes de insertar/actualizar
CREATE TRIGGER trigger_validar_conflicto
BEFORE INSERT OR UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION validar_conflicto_horario();

-- Función: Registrar auditoría
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auditoría en reservas
CREATE TRIGGER trigger_auditoria_reservas
AFTER INSERT OR UPDATE OR DELETE ON reservas
FOR EACH ROW
EXECUTE FUNCTION registrar_auditoria();

-- Función: Actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Actualizar updated_at
CREATE TRIGGER trigger_timestamp_salas BEFORE UPDATE ON salas
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_timestamp_usuarios BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_timestamp_reservas BEFORE UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
