import * as React from 'react';
import { Reserva, Sala } from '../hooks/useSharePointData';
import styles from '../CitroReservasApp.module.scss';

interface UserDashboardProps {
  reservas: Reserva[];
  salas: Sala[];
}

const ESTADO_CLASE: Record<string, string> = {
  PENDIENTE: styles.pendiente,
  APROBADA:  styles.aprobada,
  RECHAZADA: styles.rechazada,
  CANCELADA: styles.cancelada,
};

const ESTADO_ETIQUETA: Record<string, string> = {
  PENDIENTE: '⏳ Pendiente',
  APROBADA:  '✅ Aprobada',
  RECHAZADA: '❌ Rechazada',
  CANCELADA: '🚫 Cancelada',
};

const UserDashboard: React.FC<UserDashboardProps> = ({ reservas, salas }) => {
  const salaMap = new Map(salas.map((s) => [s.Id, s]));

  if (reservas.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📭</div>
        <p><strong>No tienes reservas aún</strong></p>
        <p>Usa la pestaña "Nueva Reserva" para solicitar un espacio.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
        Mis reservas ({reservas.length})
      </h2>

      {reservas.map((r) => {
        const sala = salaMap.get(r.SalaId);
        const color = sala?.Color ?? '#0078d4';
        const fechaFormateada = new Date(r.Fecha + 'T00:00:00').toLocaleDateString(
          'es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        );

        return (
          <div key={r.Id} className={styles.reservaCard}>
            {/* Barra de color de la sala */}
            <div className={styles.colorBar} style={{ background: color }} />

            {/* Info principal */}
            <div className={styles.reservaInfo}>
              <div className={styles.titulo}>{r.Title}</div>
              <div className={styles.detalles}>
                <strong>{r.SalaNombre ?? sala?.Title ?? `Sala #${r.SalaId}`}</strong>
                {sala && ` — ${sala.Ubicacion}`}
                <br />
                {fechaFormateada} · {r.HoraInicio} ({r.DuracionHoras}h)
                {r.AsistentesEstimados > 0 && ` · ${r.AsistentesEstimados} asistentes`}
              </div>
              {r.Estado === 'RECHAZADA' && r.RazonRechazo && (
                <div style={{ color: '#a4262c', fontSize: 12, marginTop: 4 }}>
                  Motivo: {r.RazonRechazo}
                </div>
              )}
            </div>

            {/* Badge de estado */}
            <span className={`${styles.estadoBadge} ${ESTADO_CLASE[r.Estado] ?? ''}`}>
              {ESTADO_ETIQUETA[r.Estado] ?? r.Estado}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default UserDashboard;
