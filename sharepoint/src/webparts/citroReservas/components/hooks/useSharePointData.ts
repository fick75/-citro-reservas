import { useState, useEffect, useCallback } from 'react';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export interface Sala {
  Id: number;
  Title: string;
  Capacidad: number;
  Ubicacion: string;
  Color: string;
  Activa: boolean;
}

export interface Reserva {
  Id: number;
  Title: string;
  SalaId: number;
  SalaNombre?: string;
  SolicitanteId: number;
  SolicitanteEmail?: string;
  Fecha: string;
  HoraInicio: string;
  DuracionHoras: number;
  AsistentesEstimados: number;
  Estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  RazonRechazo?: string;
  Created: string;
}

export interface NuevaReserva {
  salaId: number;
  fecha: string;
  horaInicio: string;
  duracionHoras: number;
  motivo: string;
  asistentesEstimados: number;
}

interface UseSharePointDataOptions {
  spHttpClient: SPHttpClient;
  siteUrl: string;
  currentUserEmail: string;
  esAdmin: boolean;
}

export function useSharePointData({
  spHttpClient,
  siteUrl,
  currentUserEmail,
  esAdmin,
}: UseSharePointDataOptions) {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarSalas = useCallback(async () => {
    const url = `${siteUrl}/_api/web/lists/getbytitle('Salas')/items` +
      `?$select=Id,Title,Capacidad,Ubicacion,Color,Activa&$filter=Activa eq 1&$orderby=Title`;
    const res: SPHttpClientResponse = await spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!res.ok) throw new Error(`Error cargando salas: ${res.status}`);
    const json = await res.json();
    setSalas(json.value as Sala[]);
  }, [spHttpClient, siteUrl]);

  const cargarReservas = useCallback(async () => {
    const filtro = esAdmin ? '' : `&$filter=SolicitanteEmail eq '${currentUserEmail}'`;
    const url = `${siteUrl}/_api/web/lists/getbytitle('Reservas')/items` +
      `?$select=Id,Title,SalaId,SalaNombre,SolicitanteEmail,Fecha,HoraInicio,` +
      `DuracionHoras,AsistentesEstimados,Estado,RazonRechazo,Created` +
      `&$orderby=Fecha desc,HoraInicio${filtro}`;
    const res: SPHttpClientResponse = await spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!res.ok) throw new Error(`Error cargando reservas: ${res.status}`);
    const json = await res.json();
    setReservas(json.value as Reserva[]);
  }, [spHttpClient, siteUrl, currentUserEmail, esAdmin]);

  const verificarConflicto = useCallback(
    async (salaId: number, fecha: string, horaInicio: string, duracionHoras: number): Promise<boolean> => {
      const url = `${siteUrl}/_api/web/lists/getbytitle('Reservas')/items` +
        `?$select=Id,HoraInicio,DuracionHoras` +
        `&$filter=SalaId eq ${salaId} and Fecha eq '${fecha}' and (Estado eq 'PENDIENTE' or Estado eq 'APROBADA')`;
      const res: SPHttpClientResponse = await spHttpClient.get(url, SPHttpClient.configurations.v1);
      if (!res.ok) return false;
      const json = await res.json();

      const [h, m] = horaInicio.split(':').map(Number);
      const inicioNueva = h * 60 + m;
      const finNueva = inicioNueva + duracionHoras * 60;

      return (json.value as Array<{ HoraInicio: string; DuracionHoras: number }>).some((r) => {
        const [rh, rm] = r.HoraInicio.split(':').map(Number);
        const inicio = rh * 60 + rm;
        const fin = inicio + r.DuracionHoras * 60;
        return inicioNueva < fin && finNueva > inicio;
      });
    },
    [spHttpClient, siteUrl]
  );

  const crearReserva = useCallback(
    async (data: NuevaReserva): Promise<void> => {
      const conflicto = await verificarConflicto(data.salaId, data.fecha, data.horaInicio, data.duracionHoras);
      if (conflicto) throw new Error('Conflicto de horario: la sala ya está reservada en ese horario.');

      const sala = salas.find((s) => s.Id === data.salaId);
      const body = JSON.stringify({
        __metadata: { type: 'SP.Data.ReservasListItem' },
        Title: data.motivo,
        SalaId: data.salaId,
        SalaNombre: sala?.Title ?? '',
        SolicitanteEmail: currentUserEmail,
        Fecha: data.fecha,
        HoraInicio: data.horaInicio,
        DuracionHoras: data.duracionHoras,
        AsistentesEstimados: data.asistentesEstimados,
        Estado: 'PENDIENTE',
      });

      const res: SPHttpClientResponse = await spHttpClient.post(
        `${siteUrl}/_api/web/lists/getbytitle('Reservas')/items`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-type': 'application/json;odata=verbose',
          },
          body,
        }
      );
      if (!res.ok) throw new Error(`Error al crear reserva: ${res.status}`);
      await cargarReservas();
    },
    [spHttpClient, siteUrl, currentUserEmail, salas, verificarConflicto, cargarReservas]
  );

  const actualizarEstadoReserva = useCallback(
    async (id: number, estado: 'APROBADA' | 'RECHAZADA', razonRechazo?: string): Promise<void> => {
      const body = JSON.stringify({
        __metadata: { type: 'SP.Data.ReservasListItem' },
        Estado: estado,
        ...(razonRechazo ? { RazonRechazo: razonRechazo } : {}),
      });

      const res: SPHttpClientResponse = await spHttpClient.fetch(
        `${siteUrl}/_api/web/lists/getbytitle('Reservas')/items(${id})`,
        SPHttpClient.configurations.v1,
        {
          method: 'MERGE',
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-type': 'application/json;odata=verbose',
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE',
          },
          body,
        }
      );
      if (!res.ok) throw new Error(`Error al actualizar reserva: ${res.status}`);
      await cargarReservas();
    },
    [spHttpClient, siteUrl, cargarReservas]
  );

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setCargando(true);
        setError(null);
        await Promise.all([cargarSalas(), cargarReservas()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [cargarSalas, cargarReservas]);

  return {
    salas,
    reservas,
    cargando,
    error,
    crearReserva,
    actualizarEstadoReserva,
    refrescar: () => Promise.all([cargarSalas(), cargarReservas()]),
  };
}
