import React, { useState, useEffect, createContext, useContext } from 'react';
import { Calendar, LogOut, Plus, Check, X, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import * as supabaseLib from './supabase';

const AppContext = createContext();

export default function AppReservas() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarSalas();
  }, []);

  const cargarSalas = async () => {
    try {
      const data = await supabaseLib.obtenerSalas();
      setSalas(data);
    } catch (err) {
      setError('Error cargando salas');
      console.error(err);
    }
  };

  const login = async (nombre, email, rol) => {
    setLoading(true);
    try {
      let usuario = await supabaseLib.obtenerUsuario(email);
      
      if (!usuario) {
        usuario = await supabaseLib.crearUsuario({
          nombre,
          email,
          rol: rol === 'admin' ? 'admin' : 'usuario'
        });
      }
      
      setUser({ ...usuario, rol });
      setView(rol === 'admin' ? 'admin' : 'user');
      
      if (usuario.rol !== 'usuario') {
        const todas = await supabaseLib.obtenerTodasReservas();
        setReservas(todas);
      }
    } catch (err) {
      setError('Error en login: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setView('login');
    setReservas([]);
  };

  const refrescarReservas = async () => {
    try {
      if (user.rol === 'usuario') {
        const mis = await supabaseLib.obtenerReservasUsuario(user.id);
        setReservas(mis);
      } else {
        const todas = await supabaseLib.obtenerTodasReservas();
        setReservas(todas);
      }
    } catch (err) {
      console.error('Error refrescando:', err);
    }
  };

  const contextValue = {
    user,
    salas,
    reservas,
    login,
    logout,
    refrescarReservas,
    setReservas,
    loading,
    error,
    setError
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        {error && (
          <div className="fixed top-4 right-4 bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {view === 'login' && <LoginView />}
        {view === 'user' && <UserDashboard />}
        {view === 'admin' && <AdminDashboard />}
      </div>
    </AppContext.Provider>
  );
}

function LoginView() {
  const { login, loading } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('user');

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">CITRO</h1>
            <p className="text-blue-200">Sistema de Reserva de Espacios</p>
          </div>

          <div className="space-y-4">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre Completo" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@citro.edu.mx" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
            <select value={rol} onChange={(e) => setRol(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer">
              <option value="user" className="bg-slate-900">Usuario (Solicitante)</option>
              <option value="admin" className="bg-slate-900">Administrador</option>
            </select>
          </div>

          <button onClick={() => nombre.trim() && email.trim() && login(nombre, email, rol)}
            disabled={!nombre.trim() || !email.trim() || loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition">
            {loading ? 'Cargando...' : 'Acceder'}
          </button>

          <div className="text-center text-xs text-gray-300 border-t border-white/10 pt-4">
            <p>Conectado a Supabase Cloud | Base de datos: PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDashboard() {
  const { user, logout } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('nueva');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">CITRO Reservas</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200 text-sm">{user?.nombre}</span>
            <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto">
          <button onClick={() => setActiveTab('nueva')}
            className={`py-4 px-1 font-semibold border-b-2 whitespace-nowrap ${activeTab === 'nueva' ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400'}`}>
            Nueva Solicitud
          </button>
          <button onClick={() => setActiveTab('mis-reservas')}
            className={`py-4 px-1 font-semibold border-b-2 whitespace-nowrap ${activeTab === 'mis-reservas' ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400'}`}>
            Mis Reservas
          </button>
          <button onClick={() => setActiveTab('disponibilidad')}
            className={`py-4 px-1 font-semibold border-b-2 whitespace-nowrap ${activeTab === 'disponibilidad' ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400'}`}>
            Disponibilidad
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'nueva' && <FormularioNuevaReserva />}
        {activeTab === 'mis-reservas' && <MisReservas />}
        {activeTab === 'disponibilidad' && <DisponibilidadCalendario />}
      </main>
    </div>
  );
}

function FormularioNuevaReserva() {
  const { user, salas, refrescarReservas, loading, setError } = useContext(AppContext);
  const [formData, setFormData] = useState({
    salaId: salas[0]?.id || 1, fecha: '', horaInicio: 9,
    motivo: 'Clase', descripcion: '', asistentes: 10, telefono: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [reservaId, setReservaId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['salaId', 'horaInicio', 'asistentes'].includes(name) ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const reserva = await supabaseLib.crearReserva({
        sala_id: formData.salaId,
        usuario_id: user.id,
        fecha: formData.fecha,
        hora_inicio: formData.horaInicio,
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        asistentes_estimados: formData.asistentes
      });
      
      setReservaId(reserva.id);
      setEnviado(true);
      await refrescarReservas();
      
      // Crear notificación
      await supabaseLib.crearNotificacion(
        user.id,
        'CONFIRMACION',
        'Solicitud recibida',
        `Tu solicitud de reserva ha sido recibida. ID: #${reserva.id}`,
        reserva.id
      );
    } catch (err) {
      setError('Error al crear reserva: ' + err.message);
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-8 text-center">
          <Check className="w-8 h-8 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h2>
          <p className="text-green-200 mb-6">Tu solicitud ha sido registrada en la base de datos. ID: <span className="font-mono">#{reservaId}</span></p>
          <button onClick={() => { setEnviado(false); setFormData({ salaId: salas[0]?.id || 1, fecha: '', horaInicio: 9, motivo: 'Clase', descripcion: '', asistentes: 10, telefono: '' }); }}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg">
            Nueva Solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Nueva Solicitud de Reserva</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <select name="salaId" value={formData.salaId} onChange={handleChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer">
            {salas.map(sala => (<option key={sala.id} value={sala.id} className="bg-slate-900">{sala.nombre}</option>))}
          </select>

          <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
          />

          <select name="horaInicio" value={formData.horaInicio} onChange={handleChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer">
            {[...Array(11)].map((_, i) => { const h = 9 + i; return (
              <option key={h} value={h} className="bg-slate-900">
                {String(h).padStart(2, '0')}:00 - {String(h + 1).padStart(2, '0')}:00
              </option>
            ); })}
          </select>

          <select name="motivo" value={formData.motivo} onChange={handleChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer">
            {['Clase', 'Seminario', 'Reunión', 'Evento', 'Otro'].map(m => (
              <option key={m} value={m} className="bg-slate-900">{m}</option>
            ))}
          </select>

          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}
            placeholder="Detalles adicionales..." rows="3"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="asistentes" value={formData.asistentes} onChange={handleChange} min="1"
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>

          <button type="submit" disabled={!formData.fecha || enviando}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            {enviando ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MisReservas() {
  const { user, loading } = useContext(AppContext);
  const [misReservas, setMisReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarReservas();
  }, [user]);

  const cargarReservas = async () => {
    try {
      const data = await supabaseLib.obtenerReservasUsuario(user.id);
      setMisReservas(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <div className="text-center text-gray-400">Cargando...</div>;

  if (!misReservas.length) return (
    <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
      <p className="text-gray-400">No tienes reservas todavía</p>
    </div>
  );

  return (
    <div className="grid gap-6 max-w-3xl mx-auto">
      {misReservas.map(r => <ReservaCard key={r.id} reserva={r} />)}
    </div>
  );
}

function ReservaCard({ reserva }) {
  const config = {
    PENDIENTE: { bg: 'from-yellow-500/20', border: 'border-yellow-400/30', badge: 'bg-yellow-400/20 text-yellow-300', icon: Clock },
    APROBADA: { bg: 'from-green-500/20', border: 'border-green-400/30', badge: 'bg-green-400/20 text-green-300', icon: Check },
    RECHAZADA: { bg: 'from-red-500/20', border: 'border-red-400/30', badge: 'bg-red-400/20 text-red-300', icon: X }
  };
  const cfg = config[reserva.estado];
  const Icono = cfg.icon;

  const sala = typeof reserva.salas === 'object' ? reserva.salas.nombre : 'Sala';

  return (
    <div className={`bg-gradient-to-br ${cfg.bg} to-transparent border ${cfg.border} rounded-xl p-6`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{sala}</h3>
          <p className="text-blue-200">{reserva.motivo}</p>
        </div>
        <span className={`${cfg.badge} px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2`}>
          <Icono className="w-4 h-4" />
          {reserva.estado}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Fecha</p>
          <p className="text-white font-semibold">{new Date(reserva.fecha).toLocaleDateString('es-MX')}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Hora</p>
          <p className="text-white font-semibold">{String(reserva.hora_inicio).padStart(2, '0')}:00</p>
        </div>
      </div>
      {reserva.descripcion && <p className="text-sm text-gray-300 mt-3">"{reserva.descripcion}"</p>}
    </div>
  );
}

function DisponibilidadCalendario() {
  const { salas } = useContext(AppContext);
  const [vistaActual, setVistaActual] = useState('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [disponibilidad, setDisponibilidad] = useState({});

  useEffect(() => {
    cargarDisponibilidad();
  }, [fechaSeleccionada]);

  const cargarDisponibilidad = async () => {
    try {
      const disp = {};
      for (const sala of salas) {
        const horas = await supabaseLib.obtenerDisponibilidadSala(sala.id, fechaSeleccionada);
        disp[sala.id] = horas;
      }
      setDisponibilidad(disp);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8">
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button onClick={() => setVistaActual('dia')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${vistaActual === 'dia' ? 'bg-blue-500/20 border border-blue-400/50 text-blue-400' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
            Por Día
          </button>
          <button onClick={() => setVistaActual('semana')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${vistaActual === 'semana' ? 'bg-blue-500/20 border border-blue-400/50 text-blue-400' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
            Por Semana
          </button>
          <button onClick={() => setVistaActual('mes')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${vistaActual === 'mes' ? 'bg-blue-500/20 border border-blue-400/50 text-blue-400' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
            Por Mes
          </button>
        </div>

        {vistaActual === 'dia' && (
          <VistaDia fechaSeleccionada={fechaSeleccionada} setFechaSeleccionada={setFechaSeleccionada} disponibilidad={disponibilidad} />
        )}

        {vistaActual === 'semana' && (
          <VistaSemana fechaSeleccionada={fechaSeleccionada} setFechaSeleccionada={setFechaSeleccionada} />
        )}

        {vistaActual === 'mes' && (
          <VistaMes />
        )}
      </div>
    </div>
  );
}

function VistaDia({ fechaSeleccionada, setFechaSeleccionada, disponibilidad }) {
  const { salas } = useContext(AppContext);

  return (
    <div className="space-y-6">
      <input type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
      />

      {salas.map(sala => (
        <div key={sala.id}>
          <h3 className="font-semibold text-white mb-3 text-lg">{sala.nombre}</h3>
          <div className="grid grid-cols-11 gap-2">
            {[...Array(11)].map((_, i) => {
              const h = 9 + i;
              const disponible = (disponibilidad[sala.id] || []).includes(h);
              return (
                <div key={h} className={`p-3 rounded-lg text-center text-xs font-semibold transition ${
                  disponible ? 'bg-green-500/30 border border-green-400/50 text-green-200' : 'bg-red-500/30 border border-red-400/50 text-red-200'
                }`}>
                  <div>{String(h).padStart(2, '0')}:00</div>
                  <div className="text-xs mt-1">{disponible ? 'LIBRE' : 'OCUPADA'}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function VistaSemana() {
  return <div className="text-center text-gray-400 p-8">Vista de semana - En desarrollo</div>;
}

function VistaMes() {
  return <div className="text-center text-gray-400 p-8">Vista de mes - En desarrollo</div>;
}

function AdminDashboard() {
  const { user, logout } = useContext(AppContext);
  const [tab, setTab] = useState('pendientes');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          <button onClick={() => setTab('pendientes')}
            className={`py-4 px-1 font-semibold border-b-2 ${tab === 'pendientes' ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400'}`}>
            Pendientes
          </button>
          <button onClick={() => setTab('todas')}
            className={`py-4 px-1 font-semibold border-b-2 ${tab === 'todas' ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400'}`}>
            Todas
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'pendientes' && <Pendientes />}
        {tab === 'todas' && <Todas />}
      </main>
    </div>
  );
}

function Pendientes() {
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { refrescarReservas } = useContext(AppContext);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      const data = await supabaseLib.obtenerSolicitudesPendientes();
      setPendientes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <div className="text-center text-gray-400">Cargando...</div>;
  if (!pendientes.length) return <div className="text-center text-gray-400">Sin solicitudes pendientes</div>;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {pendientes.map(r => <SolicitudCard key={r.id} reserva={r} onUpdate={() => { cargarPendientes(); refrescarReservas(); }} />)}
    </div>
  );
}

function SolicitudCard({ reserva, onUpdate }) {
  const [procesando, setProcesando] = useState(false);

  const handleAprobación = async (estado) => {
    setProcesando(true);
    try {
      await supabaseLib.actualizarEstadoReserva(reserva.id, estado);
      onUpdate();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const sala = typeof reserva.salas === 'object' ? reserva.salas.nombre : 'Sala';
  const usuario = typeof reserva.usuarios === 'object' ? reserva.usuarios : {};

  return (
    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">SOLICITANTE</p>
          <p className="text-white font-bold">{usuario.nombre}</p>
          <p className="text-blue-200 text-sm">{usuario.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">SALA</p>
          <p className="text-white font-bold">{sala}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">FECHA Y HORA</p>
          <p className="text-white font-bold">{new Date(reserva.fecha).toLocaleDateString('es-MX')}</p>
          <p className="text-blue-200 text-sm">{String(reserva.hora_inicio).padStart(2, '0')}:00</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleAprobación('APROBADA')} disabled={procesando}
          className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
          <Check className="w-5 h-5" />
          {procesando ? 'Procesando...' : 'Aprobar'}
        </button>
        <button onClick={() => handleAprobación('RECHAZADA')} disabled={procesando}
          className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
          <X className="w-5 h-5" />
          {procesando ? 'Procesando...' : 'Rechazar'}
        </button>
      </div>
    </div>
  );
}

function Todas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const data = await supabaseLib.obtenerTodasReservas();
      setReservas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <div className="text-center text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {reservas.map(r => (
        <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-semibold">{typeof r.usuarios === 'object' ? r.usuarios.nombre : 'Usuario'}</h3>
            <p className="text-gray-400 text-sm">{typeof r.salas === 'object' ? r.salas.nombre : 'Sala'}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{new Date(r.fecha).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
