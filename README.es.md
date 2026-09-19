# false-green

### Rompe el producto. Pon a prueba el verde.

Un ejecutor de pruebas de fallos sobre recorridos de navegador. Aplica un defecto configurado, repite el recorrido y comprueba si las verificaciones lo detectan. **No confunde un fallo que nunca se aplicó con un defecto que la prueba dejó pasar.**

**Alfa · TypeScript · Playwright Chromium · MIT · [English](README.md)**

## Pruébalo

```bash
npm ci
npx playwright-core install chromium
npm run demo
```

Abre `false-green-report/index.html`. También se generan `report.json` y `summary.md`.

La demo predeterminada es un checkout sintético montado en memoria: no cobra, no guarda pedidos y no necesita un servidor HTTP después de instalar dependencias y Chromium. Usa un navegador real.

**Resultado comprobado de la demo:** cinco defectos sobreviven a las comprobaciones débiles; los mismos cinco son detectados por las comprobaciones de comportamiento. Cada caso se repite dos veces. Hay controles sin mutación antes y después.

## Lo que contiene

CLI y API; siete tipos de fallo; evidencia de aplicación por repetición; contextos de navegador nuevos; controles previos y posteriores; informes autónomos; pruebas automatizadas; ejemplo HTTP adicional; workflow de CI y documentación técnica.

Esta versión es un **ejecutor complementario**, no un plugin automático de `@playwright/test`. Se reutilizan recorridos mediante `exercise` y `verify`. El adaptador nativo queda en la hoja de ruta.

## Interpretar los resultados

`detected`: el defecto se aplicó y una aserción en `verify` falló en cada repetición. `survived`: el defecto se aplicó y todas las verificaciones pasaron. `not-exercised`: no hay evidencia de aplicación. `unstable`: las repeticiones discrepan. `inconclusive`: hay errores de ejecución, del inyector o de infraestructura. `baseline-invalid`: los controles sin mutación no son estables.

Un fallo de navegación o un timeout global **no** se cuenta como detección. Una aserción dentro de `exercise` tampoco: las verificaciones atribuibles deben estar en `verify`. Se admiten `check`, `eventually` y `node:assert/strict`.

Código de salida `0`: todos detectados. `1`: hay supervivientes estables. `2`: experimento inválido, incompleto o error. La demo retorna éxito únicamente después de comprobar su contraste esperado; no oculta a ciegas un código `1`.

## Alcance honesto

La tasa de detección se calcula sobre los casos medibles y no demuestra calidad general del producto. Un defecto equivalente o tolerado puede sobrevivir sin revelar un problema del test. La eliminación del `aria-label` en la demo comprueba un contrato explícito; no afirma que el botón se quede necesariamente sin nombre accesible.

Usa solo entornos autorizados y desechables. Un contexto nuevo no reinicia la base de datos. El filtrado de solicitudes del navegador no es un sandbox para código Node, WebSockets, servidores ni procesos externos. Los mensajes personalizados de error pueden contener información sensible.

Consulta [API](docs/API.md), [arquitectura](docs/ARCHITECTURE.md), [verificación de construcción](docs/BUILD_VERIFICATION.md), [publicación](docs/PUBLISHING.md) y [roadmap](docs/ROADMAP.md). El código sigue una licencia MIT. No está publicado en npm.

## Verificación del 19 de septiembre de 2026

CI remota aprobada en Ubuntu con Node 22 y 24, incluida la suite HTTP. [Ejecución verificada, intento 2](https://github.com/ixequiluna-source/false-green/actions/runs/35465080383/attempts/2). El bloqueo inicial de facturación quedó resuelto antes de esta ejecución.

Instalación limpia con lockfile: 71 pruebas unitarias, 18 de navegador offline y 20 HTTP aprobadas en Windows con Node 24.15.0 y las versiones fijadas. Demo: cinco supervivientes y cinco detecciones. [Detalle y límites](docs/VERIFICATION-2026-09-19.md).
