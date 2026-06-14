# Mobile + Desktop Viewer

App de escritorio (Electron) para ver cualquier URL simultáneamente en una
**vista móvil** (con marco de teléfono, viewport de 375 px) y una **vista de
escritorio**, lado a lado. Pensada para grabar el contenido con un grabador de
vídeo externo.

## Por qué Electron y no una web normal

Usa la etiqueta `<webview>` de Electron, que carga las páginas como un navegador
real. Una web con `<iframe>` fallaría con la mayoría de sitios porque bloquean
ser incrustados (cabeceras `X-Frame-Options` / CSP `frame-ancestors`).

## Uso

```bash
pnpm install
pnpm start
```

- Escribe una URL en la barra superior y pulsa **Enter** (o el botón *Cargar*).
  Si no pones `http(s)://`, se añade `https://` automáticamente.
- Ambas vistas (móvil y escritorio) navegan juntas.
- Botones ‹ › ⟳ para atrás / adelante / recargar en las dos vistas.
- Arrastra el **divisor** central para cambiar el ancho de la columna móvil
  (el marco del teléfono se reescala solo para encajar).

## Estructura

| Archivo        | Función                                                   |
|----------------|-----------------------------------------------------------|
| `main.js`      | Proceso principal de Electron, crea la ventana            |
| `index.html`   | Interfaz: barra de URL + split móvil/escritorio           |
| `styles.css`   | Estilos, marco del teléfono, layout                       |
| `renderer.js`  | Lógica: cargar URL, navegación, escalado, divisor         |

## Notas

- El `.npmrc` incluye `verify-deps-before-run-scripts=false` para que
  `pnpm start` no falle por el aviso de build scripts de Electron.
- Para grabar solo la ventana, usa la grabación de ventana de tu grabador
  (OBS, Xbox Game Bar `Win+G`, etc.).
