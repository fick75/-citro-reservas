// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// FUNCIONES DE UTILIDAD PARA LA BASE DE DATOS
// ========================================

/**
 * Obtener todas las salas
 */
export async function obtenerSalas() {
  try {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .eq('activa', true)
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo salas:', error.message);
    return [];
  }
}

/**
 * Obtener usuario por email
 */
export async function obtenerUsuario(email) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error.message);
    return null;
  }
}

/**
 * Crear nuevo usuario
 */
export async function crearUsuario(userData) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email: userData.email,
        nombre: userData.nombre,
        telefono: userData.telefono || null,
        rol: userData.rol || 'usuario',
        departamento: userData.departamento || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando usuario:', error.message);
    throw error;
  }
}

/**
 * Crear nueva reserva
 */
export async function crearReserva(reservaData) {
  try {
    const { data, error } = await supabase
      .from('reservas')
      .insert([{
        sala_id: reservaData.sala_id,
        usuario_id: reservaData.usuario_id,
        fecha: reservaData.fecha,
        hora_inicio: reservaData.hora_inicio,
        motivo: reservaData.motivo,
        descripcion: reservaData.descripcion || null,
        asistentes_estimados: reservaData.asistentes_estimados || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando reserva:', error.message);
    throw error;
  }
}

/**
 * Obtener reservas del usuario
 */
export async function obtenerReservasUsuario(usuarioId) {
  try {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        *,
        salas:sala_id(nombre, capacidad),
        usuarios:usuario_id(nombre, email)
      `)
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo reservas:', error.message);
    return [];
  }
}

/**
 * Obtener todas las reservas (admin)
 */
export async function obtenerTodasReservas(filtros = {}) {
  try {
    let query = supabase
      .from('reservas')
      .select(`
        *,
        salas:sala_id(nombre, capacidad),
        usuarios:usuario_id(nombre, email, telefono)
      `);
    
    // Aplicar filtros
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros.sala_id) {
      query = query.eq('sala_id', filtros.sala_id);
    }
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      query = query.gte('fecha', filtros.fecha_desde)
                   .lte('fecha', filtros.fecha_hasta);
    }
    
    const { data, error } = await query.order('fecha', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo reservas:', error.message);
    return [];
  }
}

/**
 * Obtener solicitudes pendientes
 */
export async function obtenerSolicitudesPendientes() {
  return obtenerTodasReservas({ estado: 'PENDIENTE' });
}

/**
 * Actualizar estado de reserva
 */
export async function actualizarEstadoReserva(reservaId, nuevoEstado, usuarioAdminId = null, razon = null) {
  try {
    const updateData = {
      estado: nuevoEstado
    };
    
    if (nuevoEstado === 'APROBADA') {
      updateData.aprobada_por = usuarioAdminId;
      updateData.aprobada_at = new Date().toISOString();
    }
    
    if (nuevoEstado === 'RECHAZADA') {
      updateData.rechazada_razon = razon;
    }
    
    const { data, error } = await supabase
      .from('reservas')
      .update(updateData)
      .eq('id', reservaId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error actualizando reserva:', error.message);
    throw error;
  }
}

/**
 * Obtener disponibilidad de una sala en una fecha
 */
export async function obtenerDisponibilidadSala(salaId, fecha) {
  try {
    const { data, error } = await supabase
      .from('reservas')
      .select('hora_inicio')
      .eq('sala_id', salaId)
      .eq('fecha', fecha)
      .eq('estado', 'APROBADA');
    
    if (error) throw error;
    
    const horasOcupadas = (data || []).map(r => r.hora_inicio);
    const horasDisponibles = [];
    
    for (let hora = 9; hora < 19; hora++) {
      if (!horasOcupadas.includes(hora)) {
        horasDisponibles.push(hora);
      }
    }
    
    return horasDisponibles;
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error.message);
    return [];
  }
}

/**
 * Obtener estadísticas
 */
export async function obtenerEstadisticas() {
  try {
    const { data, error } = await supabase
      .from('v_estadisticas_reservas')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    return [];
  }
}

/**
 * Crear notificación
 */
export async function crearNotificacion(usuarioId, tipo, titulo, mensaje, reservaId = null) {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([{
        usuario_id: usuarioId,
        reserva_id: reservaId,
        tipo,
        titulo,
        mensaje
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando notificación:', error.message);
    throw error;
  }
}

/**
 * Obtener notificaciones del usuario
 */
export async function obtenerNotificaciones(usuarioId, noLeidas = true) {
  try {
    let query = supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId);
    
    if (noLeidas) {
      query = query.eq('leida', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error.message);
    return [];
  }
}

/**
 * Marcar notificación como leída
 */
export async function marcarNotificacionLeida(notificacionId) {
  try {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificacionId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error marcando notificación:', error.message);
    throw error;
  }
}
