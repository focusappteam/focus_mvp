# FOCUS – MVP Web

FOCUS es una plataforma web enfocada en organización, enfoque y aprendizaje.
Este repositorio corresponde al **MVP web**, cuyo objetivo es validar la idea principal antes de escalar funcionalidades e infraestructura.

---

## Stack tecnológico

- React
- Vite
- JavaScript
- CSS modules
> En esta etapa del MVP no se utiliza backend.  
> Los datos pueden manejarse con mocks o `localStorage`.

---

## Estructura del proyecto

```
src/
│
├── assets/            # Recursos estáticos (imágenes, íconos, fuentes, mocks)
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── mock/
│
├── components/        # Componentes reutilizables y genéricos
│   ├── ui/            # Botones, inputs, modales, etc.
│   └── layout/        # Navbar, sidebar, layouts generales
│
├── features/          # Lógica principal del dominio FOCUS
│   └── board/         # Kanban, columnas, tareas, drag & drop
│       ├── Board.jsx
│       ├── Column.jsx
│       ├── Task.jsx
│       └── board.utils.js
│
├── pages/             # Vistas/páginas completas
│   └── Home.jsx
│
├── hooks/             # Custom hooks reutilizables
│   └── useLocalStorage.js
│
├── services/          # Acceso a datos (APIs, localStorage, backend futuro)
│   └── boardService.js
│
├── utils/             # Funciones utilitarias puras
│   └── generateId.js
│
├── App.jsx            # Composición principal de la aplicación
└── main.jsx           # Punto de entrada de React
```

---

## Cómo correr el proyecto en local

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd focus_mvp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Levantar el servidor de desarrollo
```bash
npm run dev
```

### 4. Abrir en el navegador
```
http://localhost:5173
```

---



