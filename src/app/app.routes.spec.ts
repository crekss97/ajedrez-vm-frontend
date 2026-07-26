import { routes } from './app.routes';

describe('rutas de solicitudes de publicación', () => {
  it('expone el formulario público y la bandeja editorial protegida', () => {
    const publicRoute = routes.find((route) => route.path === 'solicitar-publicacion');
    const editorRoute = routes.find((route) => route.path === 'editor');
    const editorSolicitudRoute = editorRoute?.children?.find((route) => route.path === 'solicitudes');

    expect(publicRoute?.title).toBe('Solicitar publicación');
    expect(publicRoute?.component).toBeTruthy();
    expect(editorRoute?.canActivate?.length).toBe(1);
    expect(editorSolicitudRoute?.title).toBe('Solicitudes | Editor');
    expect(editorSolicitudRoute?.loadComponent).toEqual(jasmine.any(Function));
  });
});
