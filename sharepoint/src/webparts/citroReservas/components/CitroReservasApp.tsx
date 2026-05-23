import * as React from 'react';
import { useState } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';

import styles from './CitroReservasApp.module.scss';
import { useSharePointData, NuevaReserva, Sala } from './hooks/useSharePointData';
import { useCurrentUser, esAdminODirector } from './hooks/useCurrentUser';
import UserDashboard from './views/UserDashboard';
import AdminDashboard from './views/AdminDashboard';

export interface ICitroReservasAppProps {
  titulo: string;
  mostrarCalendario: boolean;
  spHttpClient: SPHttpClient;
  siteUrl: string;
  currentUserEmail: string;
  currentUserDisplayName: string;
  isDarkTheme: boolean;
}

type Tab = 'mis-reservas' | 'nueva-reserva' | 'admin';

const CitroReservasApp: React.FC<ICitroReservasAppProps> = (props) => {
  const { titulo, spHttpClient, siteUrl, currentUserEmail, currentUserDisplayName } = props;

  const [tabActiva, setTabActiva] = useState<Tab>('mis-reservas');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const currentUser = useCurrentUser({ spHttpClient, siteUrl, email: currentUserEmail, displayName: currentUserDisplayName });
  const esAdmin = esAdminODirector(currentUser.rol);

  const { salas, reservas, cargando, error, crearReserva, actualizarEstadoReserva, refrescar } =
    useSharePointData({ spHttpClient, siteUrl, currentUserEmail, esAdmin });

  const handleCrearReserva = async (data: NuevaReserva): Promise<void> => {
    await crearReserva(data);
    setMensajeExito('Reserva enviada correctamente. El administrador la revisará pronto.');
    setTabActiva('mis-reservas');
    setTimeout(() => setMensajeExito(null), 5000);
  };

  if (currentUser.cargando || cargando) {
    return (
      <div className={styles.citroApp}>
        <div className={styles.spinner}>⏳ Cargando CITRO Reservas…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.citroApp}>
        <div className={styles.errorAlert}>
          Error al cargar los datos: {error}
          <button className={styles.btnSecondary} style={{ marginLeft: 12 }} onClick={refrescar}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.citroApp}>
      <div className={styles.header}>
        <h1>📅 {titulo}</h1>
        <div className={styles.userInfo}>{currentUser.nombre} · {currentUser.rol.toUpperCase()}</div>
      </div>

      <div className={styles.tabs}>
        <button className={tabActiva === 'mis-reservas' ? styles.active : ''} onClick={() => setTabActiva('mis-reservas')}>
          Mis Reservas
        </button>
        <button className={tabActiva === 'nueva-reserva' ? styles.active : ''} onClick={() => setTabActiva('nueva-reserva')}>
          Nueva Reserva
        </button>
        {esAdmin && (
          <button className={tabActiva === 'admin' ? styles.active : ''} onClick={() => setTabActiva('admin')}>
            Administración
          </button>
        )}
      </div>

      <div className={styles.content}>
        {mensajeExito && <div className={styles.successAlert}>{mensajeExito}</div>}

        {tabActiva === 'mis-reservas' && (
          <UserDashboard reservas={reservas.filter((r) => r.SolicitanteEmail === currentUserEmail)} salas={salas} />
        )}
        {tabActiva === 'nueva-reserva' && (
          <NuevaReservaForm salas={salas} onSubmit={handleCrearReserva} />
        )}
        {tabActiva === 'admin' && esAdmin && (
          <AdminDashboard
            reservas={reservas}
            salas={salas}
            onAprobar={(id) => actualizarEstadoReserva(id, 'APROBADA')}
            onRechazar={(id, razon) => actualizarEstadoReserva(id, 'RECHAZADA', razon)}
          />
        )}
      </div>
    </div>
  );
};

// ── Formulario de nueva reserva ───────────────────────────────────────────────

interface NuevaReservaFormProps {
  salas: Sala[];
  onSubmit: (data: NuevaReserva) => Promise<void>;
}

const NuevaReservaForm: React.FC<NuevaReservaFormProps> = ({ salas, onSubmit }) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<NuevaReserva>({
    salaId: salas[0]?.Id ?? 0,
    fecha: hoy,
    horaInicio: '09:00',
    duracionHoras: 1,
    motivo: '',
    asistentesEstimados: 1,
  });
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const set = (campo: keyof NuevaReserva) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [campo]: val }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    if (!form.motivo.trim()) { setErrorLocal('El motivo es obligatorio.'); return; }
    if (form.fecha < hoy) { setErrorLocal('No puedes reservar en una fecha pasada.'); return; }
    try {
      setEnviando(true);
      await onSubmit(form);
      setForm({ salaId: salas[0]?.Id ?? 0, fecha: hoy, horaInicio: '09:00', duracionHoras: 1, motivo: '', asistentesEstimados: 1 });
    } catch (err) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al crear la reserva.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>Solicitar reserva de sala</h2>
      {errorLocal && <div style={{ color: '#a4262c', marginBottom: 16, fontSize: 14 }}>{errorLocal}</div>}

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label htmlFor="sala">Sala *</label>
          <select id="sala" value={form.salaId} onChange={set('salaId')}>
            {salas.map((s) => (
              <option key={s.Id} value={s.Id}>{s.Title} — {s.Ubicacion} (cap. {s.Capacidad})</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="asistentes">Asistentes estimados *</label>
          <input id="asistentes" type="number" min={1} value={form.asistentesEstimados} onChange={set('asistentesEstimados')} />
        </div>

        <div className={styles.formField}>
          <label htmlFor="fecha">Fecha *</label>
          <input id="fecha" type="date" min={hoy} value={form.fecha} onChange={set('fecha')} />
        </div>

        <div className={styles.formField}>
          <label htmlFor="hora">Hora de inicio *</label>
          <input id="hora" type="time" step="1800" value={form.horaInicio} onChange={set('horaInicio')} />
        </div>

        <div className={styles.formField}>
          <label htmlFor="duracion">Duración (horas) *</label>
          <select id="duracion" value={form.duracionHoras} onChange={set('duracionHoras')}>
            {[0.5, 1, 1.5, 2, 3, 4].map((h) => (
              <option key={h} value={h}>{h} hora{h !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.formField} ${styles.fullWidth}`}>
          <label htmlFor="motivo">Motivo de la reserva *</label>
          <textarea id="motivo" value={form.motivo} onChange={set('motivo')} placeholder="Ej: Clase de Cálculo II, Junta de departamento…" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button type="submit" className={styles.btnPrimary} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Solicitar reserva'}
        </button>
      </div>
    </form>
  );
};

export default CitroReservasApp;
