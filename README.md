# Portfolio de Valentín

Portfolio con un personaje ilustrado de Valen: se inclina hacia el mouse, respira, saluda, se mueve cuando "habla" en el chat y aparece en la portada, el escritorio, los proyectos y el contacto.

Hecho con **React + Vite**, sin librerías 3D, así que la página es liviana.

## Cómo correrlo

Necesitás **Node.js 20.19 o más nuevo** (recomendado: 22 LTS). Para ver tu versión: `node -v`.

Abrí una terminal en esta carpeta y corré:

```bash
npm install
npm run dev
```

Después abrí el link que aparece (normalmente http://localhost:5173).

Para generar la versión final para subir a internet:

```bash
npm run build
```

Eso crea la carpeta `dist/`, que podés subir a Vercel, Netlify o GitHub Pages.

## Qué tenés que completar

Todo el texto está en **`src/data.js`**:

- `CONTACT`: tu WhatsApp, email, GitHub y LinkedIn.
- `PROJECTS`: links de demo y código de cada proyecto, y el `[STACK]` de Administración Relax y G.A.I.A.
- `QA`: las respuestas del chat. Reemplazá `[TU PRECIO]` / `[YOUR PRICE]`.
- Capturas de los proyectos: guardalas en `public/projects/` (ej. `el-sello.jpg`) y poné la ruta en `image: '/projects/el-sello.jpg'`.

## Casos de estudio

Cada proyecto tiene su página en `/proyectos/<id>` (ej. `/proyectos/sello`). Los textos están en `src/data.js`, dentro de cada proyecto: `problem`, `solution`, `features`, `result`, `role`, `kind`, `year` y `shots`.

- Lo que está [ENTRE CORCHETES] se ve resaltado en amarillo hasta que lo completes.
- Capturas: guardalas en `public/projects/` con el nombre que muestra cada recuadro (ej. `sello-2.jpg`) y poné `src: '/projects/sello-2.jpg'`.
- Para que las rutas funcionen al recargar la página ya están `vercel.json` (Vercel) y `public/_redirects` (Netlify).

## Estructura

```
src/data.js                      textos, proyectos, skills y chat (ES / EN)
src/App.jsx                      arma la página según la ruta
src/pages/Home.jsx               la portada, sección por sección
src/pages/CaseStudy.jsx          la página de cada proyecto
src/router.js                    rutas sin librerías (/ y /proyectos/:id)
public/avatar/valen.webp         el personaje parado (fondo transparente)
public/avatar/valen-saludo.webp  el personaje saludando
src/components/CharacterView.jsx muestra el personaje: inclinación hacia el mouse, saludo y "hablar"
src/components/DeskScene.jsx     el escritorio isométrico con los accesos
src/components/Chat.jsx          el chat "Preguntale a Valen"
src/styles.css                   todos los estilos (incluye las animaciones del personaje)
```

## Detalles

- Para agregar otra pose, poné la imagen en `public/avatar/` y sumala en `AVATAR_IMG` (`CharacterView.jsx`).
- Las animaciones (respirar, saltito al saludar, moverse al hablar) están en `styles.css`, sección "Personaje".
- Si el visitante tiene activado "reducir movimiento" en su sistema, el personaje no se mueve.
