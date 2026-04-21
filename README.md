# Tauros Front Web

Frontend React para administracion del sistema Tauros conectado al backend NestJS.

## Caracteristicas implementadas

- Login conectado a `POST /auth/login`.
- Acceso restringido solo a usuarios con rol `admin` o `coach`.
- JWT persistido en `localStorage` para consumo de rutas protegidas.
- Layout basado en el diseno del TXT: SideNav, TopBar, dashboard, tablas y formularios.
- Pantallas conectadas: panel principal, usuarios, composicion corporal, ejercicios, maquinas, categorias, tipos, planes de entrenamiento, rutina dia, rutina ejercicio, eventos, horarios y sugerencias.
- Formularios listos para crear registros en endpoints principales.
- Eliminacion de registros por seleccion para modulos habilitados.

## Estructura del frontend

```text
src/
	App.js
	features/
		tauros/
			components/
				AuthScreen.js
				DashboardScreen.js
				ModuleScreen.js
				Sidebar.js
				Topbar.js
			layouts/
				MainLayout.js
			config/
				modules.js
			hooks/
				useTaurosApp.js
			pages/
				AuthPage.js
				DashboardPage.js
				ModulePage.js
				NotFoundPage.js
			services/
				api.js
			utils/
				form.js
```

- `App.js`: composicion general de pantallas.
- `App.js`: router principal con rutas reales por pantalla.
- `layouts/MainLayout.js`: estructura comun de sidebar y topbar.
- `hooks/useTaurosApp.js`: toda la logica de estado, carga y acciones CRUD.
- `config/modules.js`: definicion de modulos/pantallas.
- `pages/*`: pantallas reales conectadas a rutas URL.
- `components/*`: vistas separadas por tipo de pantalla.
- `services/api.js`: cliente HTTP al backend.
- `utils/form.js`: helpers de formularios y render de valores.

## Variables de entorno

Crear archivo `.env` usando `.env.example`:

```bash
REACT_APP_API_URL=http://localhost:3000
```

## Ejecucion

```bash
npm install
npm start
```

Frontend: `http://localhost:3000`

Rutas principales:

```text
/login
/dashboard
/usuarios
/composicion-corporal
/ejercicios
/maquinas
/categorias
/tipos
/planes
/rutina-dia
/rutina-ejercicio
/eventos
/horarios
/sugerencias
```

## Requisitos del backend

- El backend debe estar corriendo.
- CORS ya se encuentra habilitado en Nest.
- Para endpoints de administracion (create/update/delete en varios modulos), debes iniciar sesion con rol `admin` o `coach`.
- Un usuario registrado desde el front se crea por defecto con rol `user`.

## Build

```bash
npm run build
```
