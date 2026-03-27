export const ONBOARDING_STEPS = [
    {
        id: "workspace",
        title: "Crea tu primer Workspace",
        description:
            'Los workspaces agrupan tus tareas por proyecto. Haz clic en "Crear nuevo" para comenzar.',
        target: "create-workspace-btn",
        mode: "spotlight",
        waitForTarget: true,
        placement: "right",

        isCompleted: (ctx) => ctx.workspaces.length > 0
    },
    {
        id: "create-task",
        title: "Agrega tu primera tarea",
        description:
            "Usa el botón + o haz doble clic en cualquier parte del tablero para crear una tarea.",
        target: "create-task-btn",
        mode: "spotlight",
        waitForTarget: false,
        placement: "top",

        isCompleted: ({ allTasks }) => allTasks.length > 0,
    },
    {
        id: "edit-task",
        title: "Edita tu tarea",
        description: "Haz doble click en la tarea que creaste para editarla.",
        target: "task-card",
        placement: "right",

        optional: true,
        isCompleted: () => true
    },
    {
        id: "focus-mode",
        title: "Activa el Focus Mode",
        description:
            "Abre una tarea con doble clic, inicia el timer y luego presiona FOCUS MODE en el header para trabajar sin distracciones.",
        target: "focus-mode-btn",
        mode: "spotlight",
        waitForTarget: false,
        placement: "bottom",

        isCompleted: (ctx) => ctx.isFocusMode === true || ctx.hasUsedFocusMode
    },
    {
        id: "stats",
        title: "Revisa tus estadísticas",
        description:
            "En el botón Statistics puedes ver tu tiempo de enfoque, racha de días y tareas completadas.",
        target: "stats-btn",
        mode: "spotlight",
        waitForTarget: false,
        placement: "right",

        optional: true,
        isCompleted: () => true
    },
    {
        id: "move-tasks",
        title: "¡Todo listo!",
        description: "Ahora puedes moverte por el tablero y organizar tus tareas libremente arrastrándolas donde quieras.",
        target: null,
        placement: "right",
        mode: "tooltip",
        optional: true,

        isCompleted: () => true
    }
];