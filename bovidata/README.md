# BoviData

Base de datos histórica y dashboard de análisis de la **faena bovina del Paraguay**, enero 2006 → presente.
Datos: SENACSA / MGAP, cabezas faenadas por mes y categoría (novillos, toros, vacas, vaquillas).

Sitio 100 % estático: HTML + CSS + JavaScript + Chart.js (CDN). Sin build, sin backend, sin base de datos — los datos viven en `data.js`.

## Estructura

```
index.html    interfaz (pestañas: Resumen, Categorías, Machos vs Hembras, Estacionalidad, Datos)
styles.css    estilos
app.js        toda la lógica de análisis y los gráficos
data.js       LA BASE DE DATOS — el único archivo que se toca cada mes
```

## Nota metodológica

- Hasta **diciembre 2018** SENACSA reportaba vacas y vaquillas juntas como «Vacas». Desde **enero 2019** son dos categorías. En `data.js` los meses anteriores a 2019 tienen `vaquillas: null`.
- La serie **machos vs. hembras** es consistente en todo el período (machos = novillos + toros; hembras = vacas + vaquillas).

## Actualización mensual (≈ 1 minuto)

1. Abrir `data.js`.
2. Agregar el nuevo mes **al final** del array, copiando el formato de la línea anterior:

```js
{fecha:"2026-05",novillos:99999,toros:9999,vacas:99999,vaquillas:99999,total:999999},
```

3. Verificar que `total = novillos + toros + vacas + vaquillas`.
4. Guardar, commit y push:

```bash
git add data.js
git commit -m "Datos mayo 2026"
git push
```

Vercel redespliega automáticamente en ~30 segundos. Todos los KPIs, gráficos y tablas se recalculan solos.

También se puede editar `data.js` directamente en github.com (ícono de lápiz → Commit changes) sin tocar la terminal.

## Deploy inicial

### 1. Subir a GitHub

```bash
cd bovidata
git init
git add .
git commit -m "BoviData v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/bovidata.git
git push -u origin main
```

### 2. Conectar a Vercel

1. Entrar a [vercel.com](https://vercel.com) → **Add New → Project**.
2. Importar el repositorio `bovidata`.
3. Framework Preset: **Other**. No hace falta build command ni output directory (sitio estático).
4. **Deploy**. Listo: `https://bovidata.vercel.app` (o dominio propio).

A partir de ahí, cada `git push` a `main` publica automáticamente.

## Desarrollo local

No requiere nada especial — abrir `index.html` en el navegador, o:

```bash
npx serve .
```
