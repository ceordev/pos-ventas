/**
 * Utilidades para manejo de fechas y zonas horarias
 */

// Zona horaria de Bolivia (UTC-4)
export const BOLIVIA_TIMEZONE = 'America/La_Paz';

/**
 * Convierte una fecha a la zona horaria de Bolivia
 * (Mantenemos la firma de la función para compatibilidad, pero un Date object
 * en JS siempre es un instante en el tiempo universal. No debemos restar el Epoch.)
 * @param date - Fecha a convertir
 * @returns La misma fecha (el formateo depende de toLocaleString)
 */
export function toBoliviaTime(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Obtiene la fecha actual
 */
export function getCurrentBoliviaTime(): Date {
  return new Date();
}

/**
 * Formatea una fecha para mostrar en la interfaz en la zona horaria correcta
 */
export function formatDate(date: Date | string, includeTime = true): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: BOLIVIA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleString('es-ES', options);
}

/**
 * Obtiene el inicio del día en zona horaria de Bolivia
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BOLIVIA_TIMEZONE,
    year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(date);
  
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  
  // Creamos un string ISO con el offset de Bolivia (-04:00) a las 00:00:00
  return new Date(`${y}-${m?.padStart(2, '0')}-${d?.padStart(2, '0')}T00:00:00-04:00`);
}

/**
 * Obtiene el fin del día en zona horaria de Bolivia
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BOLIVIA_TIMEZONE,
    year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(date);
  
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  
  // Creamos un string ISO con el offset de Bolivia (-04:00) a las 23:59:59
  return new Date(`${y}-${m?.padStart(2, '0')}-${d?.padStart(2, '0')}T23:59:59.999-04:00`);
}

/**
 * Convierte una fecha a ISO string
 */
export function toBoliviaISOString(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Obtiene el rango de fechas para un día específico
 */
export function getDayRange(date: Date = new Date()) {
  return {
    start: getStartOfDay(date),
    end: getEndOfDay(date)
  };
}

/**
 * Verifica si una fecha es hoy en zona horaria de Bolivia
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOLIVIA_TIMEZONE,
    year: 'numeric', month: 'numeric', day: 'numeric'
  });
  
  return formatter.format(dateObj) === formatter.format(today);
}

/**
 * Obtiene el nombre del día en español
 */
export function getDayName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-ES', { 
    weekday: 'long',
    timeZone: BOLIVIA_TIMEZONE
  });
}
