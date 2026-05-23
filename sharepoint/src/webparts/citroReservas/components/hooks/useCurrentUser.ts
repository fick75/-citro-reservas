import { useState, useEffect } from 'react';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

export type Rol = 'usuario' | 'admin' | 'director';

export interface CurrentUser {
  email: string;
  nombre: string;
  rol: Rol;
  cargando: boolean;
}

interface UseCurrentUserOptions {
  spHttpClient: SPHttpClient;
  siteUrl: string;
  email: string;
  displayName: string;
}

export function useCurrentUser({
  spHttpClient,
  siteUrl,
  email,
  displayName,
}: UseCurrentUserOptions): CurrentUser {
  const [rol, setRol] = useState<Rol>('usuario');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const detectarRol = async () => {
      try {
        const url = `${siteUrl}/_api/web/currentuser/groups?$select=Title`;
        const res: SPHttpClientResponse = await spHttpClient.get(
          url,
          SPHttpClient.configurations.v1
        );

        if (!res.ok) { setRol('usuario'); return; }

        const json = await res.json();
        const grupos: string[] = (json.value as Array<{ Title: string }>).map((g) => g.Title);

        if (grupos.includes('CITRO-Directores')) {
          setRol('director');
        } else if (grupos.includes('CITRO-Admins')) {
          setRol('admin');
        } else {
          setRol('usuario');
        }
      } catch {
        setRol('usuario');
      } finally {
        setCargando(false);
      }
    };

    void detectarRol();
  }, [spHttpClient, siteUrl]);

  return { email, nombre: displayName, rol, cargando };
}

export const esAdminODirector = (rol: Rol): boolean =>
  rol === 'admin' || rol === 'director';
