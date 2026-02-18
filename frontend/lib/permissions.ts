// 📖 Qué roles pueden acceder a cada ruta
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/clientes':       ['ADMIN', 'VENDEDOR', 'SUPER_ADMIN'],
  '/dashboard/vendedores':     ['ADMIN', 'COMPRADOR', 'SUPER_ADMIN'],
  '/dashboard/configuracion':  ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard/envios':         ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN'],
  '/dashboard/reportes':       ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN'],
};

export function canAccess(pathname: string, role: string): boolean {
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
    pathname.startsWith(route)
  );
  // Si la ruta no está en la lista, es accesible para todos los logueados
  if (!matchedRoute) return true;
  return ROUTE_PERMISSIONS[matchedRoute].includes(role);
}