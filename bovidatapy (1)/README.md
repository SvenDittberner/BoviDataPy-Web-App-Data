# BoviDataPy

Base de datos histórica y dashboard analítico de la **faena bovina del Paraguay**, enero 2006 → presente.
Datos: SENACSA / MGAP — cabezas faenadas por mes y categoría (novillos, toros, vacas, vaquillas).

Sitio 100 % estático: HTML + CSS + JavaScript + Chart.js (incluido localmente, sin CDN). Sin build, sin backend. Los datos viven en `data.js`.

## Pestañas

- **Resumen** — KPIs, faena anual, crecimiento interanual, faena mensual, tendencia (suma móvil 12 m), acumulado por año, récords.
- **Categorías** — composición, participación %, índice de evolución base 2019, tabla anual.
- **Machos vs Hembras** — % de hembras (MM 12 m) con umbral de liquidación, ratio macho/hembra, vaquillas dentro de las hembras.
- **Estacionalidad** — índice estacional, dispersión mensual (banda mín–máx), comparación de años, mapa de calor.
- **Comparar** — elegí dos años y comparalos mes a mes y por categoría.
- **Datos** — tabla completa con filtro por año y exportación CSV.

## Pestañas

Resumen · Categorías · Machos vs Hembras · Estacionalidad (con probabilidades mensuales) · **Estadísticas** (proyección del año en curso, CAGR, distribución interanual, detección de meses atípicos, lecturas automáticas) · Comparar · Datos.

## Estructura

```
index.html      interfaz
styles.css      estilos
app.js          lógica de análisis y gráficos
data.js         LA BASE DE DATOS — el único archivo que se toca cada mes
chartjs.umd.js  Chart.js 4.4.4 (local, sin dependencia de internet)
```

## Nota metodológica

- Hasta **diciembre 2018** SENACSA reportaba vacas y vaquillas juntas como «Vacas». Desde **enero 2019** son dos categorías. En `data.js` los meses previos a 2019 tienen `vaquillas: null`.
- La serie **machos vs. hembras** es consistente en todo el período (machos = novillos + toros; hembras = vacas + vaquillas).

## Actualización mensual (≈ 1 minuto)

1. Abrir `data.js` y agregar el nuevo mes **al final** del array, copiando el formato:

```js
{fecha:"2026-05",novillos:99999,toros:9999,vacas:99999,vaquillas:99999,total:999999},
```

2. Verificar que `total = novillos + toros + vacas + vaquillas`.
3. Guardar, commit y push:

```bash
git add data.js && git commit -m "Datos mayo 2026" && git push
```

Vercel redespliega solo en ~30 s y todos los KPIs, gráficos y tablas se recalculan. También se puede editar `data.js` directamente en github.com (ícono de lápiz → Commit changes).

## Deploy inicial

```bash
cd bovidatapy
git init && git add . && git commit -m "BoviDataPy v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/bovidatapy.git
git push -u origin main
```

En [vercel.com](https://vercel.com): **Add New → Project** → importar el repo → Framework Preset **Other** (sin build command ni output directory) → **Deploy**. Queda en `https://bovidatapy.vercel.app`. Cada `git push` a `main` publica automáticamente.

## Local

Abrir `index.html` en el navegador, o `npx serve .`
