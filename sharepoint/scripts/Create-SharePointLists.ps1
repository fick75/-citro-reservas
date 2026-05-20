<#
.SYNOPSIS
    Crea las listas SharePoint necesarias para CITRO Reservas.

.DESCRIPTION
    Conecta al sitio SharePoint indicado y crea las listas
    Salas, Reservas y Notificaciones con todas sus columnas.
    Requiere el módulo PnP.PowerShell (v2.x).

.PARAMETER SiteUrl
    URL del sitio SharePoint. Ej: https://contoso.sharepoint.com/sites/citro-reservas

.EXAMPLE
    .\Create-SharePointLists.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/citro-reservas"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl
)

# ── Verificar módulo PnP ───────────────────────────────────────────────────────
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    Write-Host "Instalando PnP.PowerShell..." -ForegroundColor Yellow
    Install-Module PnP.PowerShell -Scope CurrentUser -Force
}

Import-Module PnP.PowerShell

# ── Conexión interactiva ───────────────────────────────────────────────────────
Write-Host "Conectando a $SiteUrl..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

Write-Host "Conexion establecida. Creando listas..." -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════════
# LISTA: Salas
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[1/3] Creando lista 'Salas'..." -ForegroundColor Cyan

$listaSalas = Get-PnPList -Identity "Salas" -ErrorAction SilentlyContinue
if (-not $listaSalas) {
    New-PnPList -Title "Salas" -Template GenericList -EnableVersioning
    Write-Host "  Lista 'Salas' creada." -ForegroundColor Green
} else {
    Write-Host "  Lista 'Salas' ya existe. Omitiendo creacion." -ForegroundColor Yellow
}

# Columnas de Salas
$columnasSalas = @(
    @{ InternalName = "Capacidad";   DisplayName = "Capacidad";   Type = "Number" },
    @{ InternalName = "Ubicacion";   DisplayName = "Ubicacion";   Type = "Text"   },
    @{ InternalName = "Color";       DisplayName = "Color";       Type = "Text"   },
    @{ InternalName = "Activa";      DisplayName = "Activa";      Type = "Boolean" }
)

foreach ($col in $columnasSalas) {
    $existe = Get-PnPField -List "Salas" -Identity $col.InternalName -ErrorAction SilentlyContinue
    if (-not $existe) {
        Add-PnPField -List "Salas" -InternalName $col.InternalName `
                     -DisplayName $col.DisplayName -Type $col.Type
        Write-Host "  Columna '$($col.DisplayName)' agregada." -ForegroundColor Gray
    }
}

# Datos iniciales de salas
$salasIniciales = @(
    @{ Title = "Aula Magna";       Capacidad = 200; Ubicacion = "Edificio A, PB"; Color = "#1565c0"; Activa = $true },
    @{ Title = "Sala de Juntas 1"; Capacidad = 20;  Ubicacion = "Edificio B, P1"; Color = "#2e7d32"; Activa = $true },
    @{ Title = "Laboratorio 301";  Capacidad = 35;  Ubicacion = "Edificio C, P3"; Color = "#e65100"; Activa = $true },
    @{ Title = "Sala Polivalente"; Capacidad = 50;  Ubicacion = "Edificio A, P2"; Color = "#6a1b9a"; Activa = $true }
)

$salasExistentes = Get-PnPListItem -List "Salas" -Fields "Title"
if ($salasExistentes.Count -eq 0) {
    foreach ($sala in $salasIniciales) {
        Add-PnPListItem -List "Salas" -Values $sala | Out-Null
        Write-Host "  Sala '$($sala.Title)' agregada." -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# LISTA: Reservas
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[2/3] Creando lista 'Reservas'..." -ForegroundColor Cyan

$listaReservas = Get-PnPList -Identity "Reservas" -ErrorAction SilentlyContinue
if (-not $listaReservas) {
    New-PnPList -Title "Reservas" -Template GenericList -EnableVersioning
    Write-Host "  Lista 'Reservas' creada." -ForegroundColor Green
} else {
    Write-Host "  Lista 'Reservas' ya existe. Omitiendo creacion." -ForegroundColor Yellow
}

# Columnas de Reservas
$columnasReservas = @(
    @{ InternalName = "SalaId";               DisplayName = "SalaId";               Type = "Number"  },
    @{ InternalName = "SalaNombre";           DisplayName = "SalaNombre";           Type = "Text"    },
    @{ InternalName = "SolicitanteEmail";     DisplayName = "SolicitanteEmail";     Type = "Text"    },
    @{ InternalName = "Fecha";                DisplayName = "Fecha";                Type = "DateTime" },
    @{ InternalName = "HoraInicio";           DisplayName = "HoraInicio";           Type = "Text"    },
    @{ InternalName = "DuracionHoras";        DisplayName = "DuracionHoras";        Type = "Number"  },
    @{ InternalName = "AsistentesEstimados";  DisplayName = "AsistentesEstimados";  Type = "Number"  },
    @{ InternalName = "Estado";               DisplayName = "Estado";               Type = "Choice"  },
    @{ InternalName = "RazonRechazo";         DisplayName = "RazonRechazo";         Type = "Note"    }
)

foreach ($col in $columnasReservas) {
    $existe = Get-PnPField -List "Reservas" -Identity $col.InternalName -ErrorAction SilentlyContinue
    if (-not $existe) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "Reservas" -InternalName $col.InternalName `
                         -DisplayName $col.DisplayName -Type $col.Type `
                         -Choices @("PENDIENTE", "APROBADA", "RECHAZADA", "CANCELADA")
        } else {
            Add-PnPField -List "Reservas" -InternalName $col.InternalName `
                         -DisplayName $col.DisplayName -Type $col.Type
        }
        Write-Host "  Columna '$($col.DisplayName)' agregada." -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# LISTA: Notificaciones
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[3/3] Creando lista 'Notificaciones'..." -ForegroundColor Cyan

$listaNotif = Get-PnPList -Identity "Notificaciones" -ErrorAction SilentlyContinue
if (-not $listaNotif) {
    New-PnPList -Title "Notificaciones" -Template GenericList
    Write-Host "  Lista 'Notificaciones' creada." -ForegroundColor Green
} else {
    Write-Host "  Lista 'Notificaciones' ya existe. Omitiendo creacion." -ForegroundColor Yellow
}

$columnasNotif = @(
    @{ InternalName = "UsuarioEmail";  DisplayName = "UsuarioEmail";  Type = "Text"    },
    @{ InternalName = "ReservaId";     DisplayName = "ReservaId";     Type = "Number"  },
    @{ InternalName = "Tipo";          DisplayName = "Tipo";          Type = "Choice"  },
    @{ InternalName = "Leida";         DisplayName = "Leida";         Type = "Boolean" }
)

foreach ($col in $columnasNotif) {
    $existe = Get-PnPField -List "Notificaciones" -Identity $col.InternalName -ErrorAction SilentlyContinue
    if (-not $existe) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "Notificaciones" -InternalName $col.InternalName `
                         -DisplayName $col.DisplayName -Type $col.Type `
                         -Choices @("CONFIRMACION", "APROBACION", "RECHAZO", "RECORDATORIO")
        } else {
            Add-PnPField -List "Notificaciones" -InternalName $col.InternalName `
                         -DisplayName $col.DisplayName -Type $col.Type
        }
        Write-Host "  Columna '$($col.DisplayName)' agregada." -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# GRUPOS DE PERMISOS
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`nCreando grupos de permisos..." -ForegroundColor Cyan

$grupos = @(
    @{ Nombre = "CITRO-Usuarios";   Descripcion = "Usuarios que pueden solicitar reservas"    },
    @{ Nombre = "CITRO-Admins";     Descripcion = "Administradores que aprueban/rechazan"      },
    @{ Nombre = "CITRO-Directores"; Descripcion = "Directores con acceso completo de lectura"  }
)

foreach ($g in $grupos) {
    $grupoExiste = Get-PnPGroup -Identity $g.Nombre -ErrorAction SilentlyContinue
    if (-not $grupoExiste) {
        New-PnPGroup -Title $g.Nombre -Description $g.Descripcion | Out-Null
        Write-Host "  Grupo '$($g.Nombre)' creado." -ForegroundColor Gray
    } else {
        Write-Host "  Grupo '$($g.Nombre)' ya existe." -ForegroundColor Yellow
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " CITRO Reservas — Configuracion completa" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Sitio  : $SiteUrl"
Write-Host "  Listas : Salas, Reservas, Notificaciones"
Write-Host "  Grupos : CITRO-Usuarios, CITRO-Admins, CITRO-Directores"
Write-Host ""
Write-Host "Pasos siguientes:"
Write-Host "  1. Agrega miembros a los grupos CITRO-* en la configuracion del sitio."
Write-Host "  2. Despliega el .sppkg en el App Catalog del tenant."
Write-Host "  3. Instala la app 'CITRO Reservas' en este sitio."
Write-Host "  4. Agrega el web part a la pagina de inicio del sitio."
Write-Host ""

Disconnect-PnPOnline
