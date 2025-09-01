/**
 * Utilidades para manejo de fechas y zonas horarias
 */

// Zona horaria de Bolivia (UTC-4)
const BOLIVIA_TIMEZONE = 'America/La_Paz';

/**
 * Convierte una fecha a la zona horaria de Bolivia
 * @param date - Fecha a convertir
 * @returns Fecha en zona horaria de Bolivia
 */
export function toBoliviaTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Si la fecha ya está en UTC, convertir a Bolivia (UTC-4)
  // Bolivia está 4 horas detrás de UTC
  const boliviaOffset = -4 * 60; // -4 horas en minutos
  
  // Crear nueva fecha ajustando la zona horaria
  const boliviaDate = new Date(dateObj.getTime() + (boliviaOffset * 60 * 1000));
  
  return boliviaDate;
}

/**
 * Obtiene la fecha actual en zona horaria de Bolivia
 * @returns Fecha actual en Bolivia
 */
export function getCurrentBoliviaTime(): Date {
  return toBoliviaTime(new Date());
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param date - Fecha a formatear
 * @param includeTime - Si incluir la hora
 * @returns Fecha formateada
 */
export function formatDate(date: Date | string, includeTime = true): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // La fecha viene en UTC desde la BD, convertir a Bolivia (UTC-4)
  const boliviaOffset = -4 * 60 * 60 * 1000; // -4 horas en milisegundos
  const boliviaDate = new Date(dateObj.getTime() + boliviaOffset);
  
  // Formatear fecha en español
  const fechaStr = boliviaDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  if (includeTime) {
    // Formatear hora
    const horaStr = boliviaDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${fechaStr}, ${horaStr}`;
  }
  
  return fechaStr;
}

/**
 * Obtiene el inicio del día en zona horaria de Bolivia
 * @param date - Fecha base
 * @returns Inicio del día (00:00:00)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const boliviaDate = toBoliviaTime(date);
  const startOfDay = new Date(boliviaDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Obtiene el fin del día en zona horaria de Bolivia
 * @param date - Fecha base
 * @returns Fin del día (23:59:59)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const boliviaDate = toBoliviaTime(date);
  const endOfDay = new Date(boliviaDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Convierte una fecha a ISO string en zona horaria de Bolivia
 * @param date - Fecha a convertir
 * @returns ISO string en zona horaria de Bolivia
 */
export function toBoliviaISOString(date: Date = new Date()): string {
  const boliviaDate = toBoliviaTime(date);
  return boliviaDate.toISOString();
}

/**
 * Obtiene el rango de fechas para un día específico en Bolivia
 * @param date - Fecha del día
 * @returns Objeto con inicio y fin del día
 */
export function getDayRange(date: Date = new Date()) {
  return {
    start: getStartOfDay(date),
    end: getEndOfDay(date)
  };
}

/**
 * Verifica si una fecha es hoy en zona horaria de Bolivia
 * @param date - Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date | string): boolean {
  const boliviaDate = toBoliviaTime(date);
  const today = getCurrentBoliviaTime();
  
  return boliviaDate.toDateString() === today.toDateString();
}

/**
 * Obtiene el nombre del día en español
 * @param date - Fecha
 * @returns Nombre del día
 */
export function getDayName(date: Date | string): string {
  const boliviaDate = toBoliviaTime(date);
  return boliviaDate.toLocaleDateString('es-ES', { 
    weekday: 'long',
    timeZone: BOLIVIA_TIMEZONE
  });
}
