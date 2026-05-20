import * as React from 'react';
import { useState } from 'react';
import { Reserva, Sala } from '../hooks/useSharePointData';
import styles from '../CitroReservasApp.module.scss';

interface AdminDashboardProps {
  reservas: Reserva[];
  salas: Sala[];
  onAprobar: (id: number) => Promise<void>;
  onRechazar: (id: number, razon: string) => Promise<void>;
}

type FiltroEstado = 'TODAS' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reservas,
  salas,
  onAprobar,
  onRechazar,
}) => {
  const [filtro, setFiltro] = useState<FiltroEstado>('PENDIENTE');
  const [procesando, setProcesando] = useState<number | null>(null);
  const [razonRechazo, setRazonRechazo] = useState('');
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);

  const salaMap = new Map(salas.map((s) => [s.Id, s]));

  const reservasFiltradas = filtro === 'TODAS'
    ? reservas
    : reservas.filter((r) => r.Estado === filtro);

  const pendientes = reservas.filter((r) => r.Estado === 'PENDIENTE').length;

  const handleAprobar = async (id: number) => {
    setProcesando(id);
    try {
      await onAprobar(id);
    } finally {
      setProcesando(null);
    }
  };

  const handleConfirmarRechazo = async () => {
    if (!rechazandoId || !razonRechazo.trim()) return;
    setProcesando(rechazandoId);
    try {
      await onRechazar(rechazandoId, razonRechazo.trim());
      setRechazandoId(null);
      setRazonRechazo('');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Panel de administración
          {pendientes > 0 && (
            <span style={{
              background: '#d83b01', color: 'white',
              borderRadius: 10, padding: '2px 8px',
              fontSize: 12, marginLeft: 8,
            }}>
              {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {/* Filtro de estado */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'TODAS'] as FiltroEstado[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 2, cursor: 'pointer',
                border: '1px solid',
                borderColor: filtro === f ? '#0078d4' : '#8a8886',
                background: filtro === f ? '#0078d4' : 'white',
                color: filtro === f ? 'white' : '#323130',
                fontWeight: filtro === f ? 600 : 400,
              }}
            >
              {f === 'TODAS' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de rechazo */}
      {rechazandoId !== null && (
        <div style={{
          background: '#fde7e9', border: '1px solid #a4262c',
          borderRadius: 4, padding: 16, marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#a4262c' }}>
            Motivo del rechazo (obligatorio)
          </p>
          <textarea
            value={razonRechazo}
            onChange={(e) => setRazonRechazo(e.target.value)}
            style={{ width: '100%', minHeight: 70, padding: 8, fontSize: 13, boxSizing: 'border-box' }}
            placeholder="Explica brevemente el motivo del rechazo…"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className={styles.btnDanger}
              disabled={!razonRechazo.trim() || procesando !== null}
              onClick={handleConfirmarRechazo}
            >
              Confirmar rechazo
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { setRechazandoId(null); setRazonRechazo(''); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de reservas */}
      {reservasFiltradas.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <p><strong>Sin reservas {filtro !== 'TODAS' ? filtro.toLowerCase() + 's' : ''}</strong></p>
        </div>
      ) : (
        reservasFiltradas.map((r) => {
          const sala = salaMap.get(r.SalaId);
          const color = sala?.Color ?? '#0078d4';
          const fechaFormateada = new Date(r.Fecha + 'T00:00:00').toLocaleDateString(
            'es-MX', { day: '2-digit', month: 'short', year: 'numeric' }
          );

          return (
            <div key={r.Id} className={styles.reservaCard}>
              <div className={styles.colorBar} style={{ background: color }} />

              <div className={styles.reservaInfo}>
                <div className={styles.titulo}>{r.Title}</div>
                <div className={styles.detalles}>
                  <strong>{r.SolicitanteEmail}</strong>
                  <br />
                  {r.SalaNombre ?? sala?.Title ?? `Sala #${r.SalaId}`}
                  {sala && ` — ${sala.Ubicacion}`}
                  <br />
                  {fechaFormateada} · {r.HoraInicio} ({r.DuracionHoras}h)
                  {r.AsistentesEstimados > 0 && ` · ${r.AsistentesEstimados} asistentes`}
                </div>
                {r.Estado === 'RECHAZADA' && r.RazonRechazo && (
                  <div style={{ color: '#a4262c', fontSize: 12, marginTop: 4 }}>
                    Rechazada: {r.RazonRechazo}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: r.Estado === 'PENDIENTE' ? '#fff4ce'
                    : r.Estado === 'APROBADA' ? '#dff6dd'
                    : r.Estado === 'RECHAZADA' ? '#fde7e9' : '#edebe9',
                  color: r.Estado === 'PENDIENTE' ? '#835b00'
                    : r.Estado === 'APROBADA' ? '#107c10'
                    : r.Estado === 'RECHAZADA' ? '#a4262c' : '#605e5c',
                }}>
                  {r.Estado}
                </span>

                {r.Estado === 'PENDIENTE' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      disabled={procesando !== null}
                      onClick={() => handleAprobar(r.Id)}
                    >
                      {procesando === r.Id ? '…' : '✓ Aprobar'}
                    </button>
                    <button
                      className={styles.btnDanger}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      disabled={procesando !== null}
                      onClick={() => setRechazandoId(r.Id)}
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminDashboard;
