import { supabase } from '../utils/supabase'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";

import { useAuth } from './AuthContext';
const BoardContext = createContext(null);
// Convierte una fila de Supabase al shape que usa la app
function mapTaskFromDB(row) {
    return {
        id: row.id,
        workspaceId: row.workspace_id,
        title: row.title ?? "",
        description: row.description ?? "",
        status: row.status ?? "pending",
        category: row.category ?? "General",
        priority: row.priority ?? "Medium",
        tags: row.tags ?? [],
        checklist: row.checklist ?? [],
        style: { color: row.color ?? "#4a5e52" },
        position: { x: row.position_x ?? 0, y: row.position_y ?? 0 },
        timeActive: row.time_active ?? 0,
        createdAt: row.created_at,
        dueDate: row.due_date ?? null, // ← AGREGADO
    };
}

export function BoardProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    // Limpiar localStorage cuando no hay usuario (logout o cambio de cuenta)
    // Esto evita que datos de un usuario aparezcan en otro
    useEffect(() => {
        if (!authLoading && !user) {
            setWorkspaces([]);
            setActiveWorkspaceId(null);
            setAllTasks([]);
            localStorage.removeItem("workspaces");
            localStorage.removeItem("activeWorkspaceId");
            localStorage.removeItem("tasks");
            syncedWorkspacesRef.current.clear();
        }
    }, [user, authLoading]);
    // --- Workspaces ---
    const [workspaces, setWorkspaces] = useState(() => {
        const saved = localStorage.getItem("workspaces");
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return [];
    });

    // --- Active workspace ---
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
        return localStorage.getItem("activeWorkspaceId") ?? null;
    });

    const [allTasks, setAllTasks] = useState(() => {
        const saved = localStorage.getItem("tasks");
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return [];
    });

    const syncedWorkspacesRef = useRef(new Set());
    // --- Persist helpers ---
    function persistWorkspaces(updated) {
        setWorkspaces(updated);
        localStorage.setItem("workspaces", JSON.stringify(updated));
    }

    function persistTasks(updated) {
        setAllTasks(updated);
        localStorage.setItem("tasks", JSON.stringify(updated));
    }

    function persistActiveWorkspace(id) {
        setActiveWorkspaceId(id);
        localStorage.setItem("activeWorkspaceId", id ?? "");
    }

    // --- Tasks filtered by active workspace ---
    const tasks = useMemo(
        () => allTasks.filter(t => t.workspaceId === activeWorkspaceId),
        [allTasks, activeWorkspaceId]
    );

    // --- Sync inicial: carga workspaces desde Supabase ---
    useEffect(() => {
        if (authLoading || !user) return;
        async function loadWorkspaces() {
            const { data, error } = await supabase
                .from("workspaces")
                .select("id, name, sort_order")
                .eq("user_id", user.id)
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("Failed to load workspaces:", error);
                return;
            }

            const mapped = (data ?? []).map(ws => ({ id: ws.id, name: ws.name }));
            persistWorkspaces(mapped);

            // Si el activeWorkspaceId guardado en localStorage ya no existe en Supabase,
            // selecciona el primero
            const stillExists = mapped.some(ws => ws.id === activeWorkspaceId);
            if (!stillExists) {
                persistActiveWorkspace(mapped[0]?.id ?? null);
            }

            // Si no hay workspaces, evitar tasks huérfanas en estado/localStorage
            if (mapped.length === 0) {
                persistTasks([]);
            }
        }

        loadWorkspaces();
    }, [user, authLoading, activeWorkspaceId]);


    useEffect(() => {
        if (!activeWorkspaceId) return;
        // Si ya lo sincronizamos con Supabase en esta sesión, no consultamos de nuevo.
        // Los cambios dentro de la sesión ya los manejan addTask/updateTask/deleteTask.
        if (syncedWorkspacesRef.current.has(activeWorkspaceId)) return;

        async function loadTasks() {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("workspace_id", activeWorkspaceId);

            if (error) {
                console.error("Failed to load tasks:", error);
                return;
            }

            // Marcar como sincronizado ANTES de procesar,
            // para evitar doble fetch si el efecto se dispara dos veces
            syncedWorkspacesRef.current.add(activeWorkspaceId);

            if (!data) return;

            const fromDB = data.map(mapTaskFromDB);

            setAllTasks(prev => {
                const otherWorkspaceTasks = prev.filter(
                    t => t.workspaceId !== activeWorkspaceId
                );
                const merged = [...otherWorkspaceTasks, ...fromDB];
                localStorage.setItem("tasks", JSON.stringify(merged));
                return merged;
            });
        }

        loadTasks();
        return () => {
            // Permite que StrictMode vuelva a cargar correctamente en dev
            syncedWorkspacesRef.current.delete(activeWorkspaceId);
        };
    }, [activeWorkspaceId]);

    // --- Realtime: workspaces ---
    useEffect(() => {
        const channel = supabase
            .channel("realtime-workspaces")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "workspaces" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newWs = { id: payload.new.id, name: payload.new.name };
                        setWorkspaces(prev => {
                            // Evitar duplicado si ya lo insertamos nosotros mismos
                            if (prev.some(ws => ws.id === newWs.id)) return prev;
                            const updated = [...prev, newWs];
                            localStorage.setItem("workspaces", JSON.stringify(updated));
                            return updated;
                        });
                    }

                    if (payload.eventType === "UPDATE") {
                        setWorkspaces(prev => {
                            const updated = prev.map(ws =>
                                ws.id === payload.new.id ? { ...ws, name: payload.new.name } : ws
                            );
                            localStorage.setItem("workspaces", JSON.stringify(updated));
                            return updated;
                        });
                    }

                    if (payload.eventType === "DELETE") {
                        setWorkspaces(prev => {
                            const updated = prev.filter(ws => ws.id !== payload.old.id);
                            localStorage.setItem("workspaces", JSON.stringify(updated));
                            return updated;
                        });
                        // Limpiar tasks del workspace borrado
                        setAllTasks(prev => {
                            const updated = prev.filter(t => t.workspaceId !== payload.old.id);
                            localStorage.setItem("tasks", JSON.stringify(updated));
                            return updated;
                        });
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // --- Realtime: tasks del workspace activo ---
    useEffect(() => {
        if (!activeWorkspaceId) return;

        const channel = supabase
            .channel(`realtime-tasks-${activeWorkspaceId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `workspace_id=eq.${activeWorkspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newTask = mapTaskFromDB(payload.new);
                        setAllTasks(prev => {
                            if (prev.some(t => t.id === newTask.id)) return prev;
                            const updated = [...prev, newTask];
                            localStorage.setItem("tasks", JSON.stringify(updated));
                            return updated;
                        });
                    }

                    if (payload.eventType === "UPDATE") {
                        const updatedTask = mapTaskFromDB(payload.new);
                        setAllTasks(prev => {
                            const updated = prev.map(t =>
                                t.id === updatedTask.id ? updatedTask : t
                            );
                            localStorage.setItem("tasks", JSON.stringify(updated));
                            return updated;
                        });
                    }

                    if (payload.eventType === "DELETE") {
                        setAllTasks(prev => {
                            const updated = prev.filter(t => t.id !== payload.old.id);
                            localStorage.setItem("tasks", JSON.stringify(updated));
                            return updated;
                        });
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [activeWorkspaceId]);



    // --- Workspace actions ---
    const createWorkspace = useCallback(async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        if (!user?.id) return null;

        let newWs = { id: `ws-${Date.now()}`, name: trimmed };

        try {
            const { data, error } = await supabase
                .from("workspaces")
                .insert({
                    name: trimmed,
                    sort_order: workspaces.length,
                    user_id: user.id,
                })
                .select("id, name")
                .single();

            if (error) throw error;

            if (data?.id) {
                newWs = { id: data.id, name: data.name ?? trimmed };
            }
        } catch (error) {
            console.error("Failed to create workspace in Supabase:", error);
        }

        const updated = [...workspaces, newWs];
        persistWorkspaces(updated);
        return newWs;
    }, [workspaces, user]);

    const renameWorkspace = useCallback((id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (!user?.id) return;

        const currentWorkspace = workspaces.find(ws => ws.id === id);
        if (!currentWorkspace) return;
        if (currentWorkspace.name === trimmed) return;

        persistWorkspaces(workspaces.map(ws => ws.id === id ? { ...ws, name: trimmed } : ws));

        void (async () => {
            const { error } = await supabase
                .from("workspaces")
                .update({ name: trimmed })
                .eq("id", id);

            if (error) {
                console.error("Failed to rename workspace in Supabase:", error);
            }
        })();
    }, [workspaces, user]);

    const deleteWorkspace = useCallback((id) => {
        if (!user?.id) return;
        const workspaceExists = workspaces.some(ws => ws.id === id);
        if (!workspaceExists) return;

        const updated = workspaces.filter(ws => ws.id !== id);
        persistWorkspaces(updated);
        // Remove all tasks belonging to that workspace
        persistTasks(allTasks.filter(t => t.workspaceId !== id));
        // If deleted workspace was active, switch to first available
        if (activeWorkspaceId === id) {
            const next = updated[0]?.id ?? null;
            persistActiveWorkspace(next);
        }

        void (async () => {
            const { error } = await supabase
                .from("workspaces")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("Failed to delete workspace in Supabase:", error);
            }
        })();
    }, [workspaces, allTasks, activeWorkspaceId, user]);

    const reorderWorkspaces = useCallback((reordered) => {
        if (!user?.id) return;
        persistWorkspaces(reordered);

        void (async () => {
            const updates = reordered.map((ws, index) =>
                supabase.from("workspaces").update({ sort_order: index }).eq("id", ws.id)
            );
            await Promise.all(updates);
        })();
    }, [user]);


    const selectWorkspace = useCallback((id) => {
        persistActiveWorkspace(id);
    }, []);

    // --- Task actions ---
    const addTask = useCallback((task) => {
        if (!user?.id) return;
        const taskWithWorkspace = { ...task, workspaceId: activeWorkspaceId };
        persistTasks([...allTasks, taskWithWorkspace]);

        if (!taskWithWorkspace.workspaceId) return;

        const payload = {
            id: taskWithWorkspace.id,
            user_id: user.id,
            workspace_id: taskWithWorkspace.workspaceId,
            title: taskWithWorkspace.title ?? "",
            description: taskWithWorkspace.description ?? "",
            status: taskWithWorkspace.status ?? "todo",
            category: taskWithWorkspace.category ?? "General",
            priority: taskWithWorkspace.priority ?? "Medium",
            tags: Array.isArray(taskWithWorkspace.tags) ? taskWithWorkspace.tags : [],
            checklist: Array.isArray(taskWithWorkspace.checklist) ? taskWithWorkspace.checklist : [],
            color: taskWithWorkspace.style?.color ?? taskWithWorkspace.color ?? null,
            position_x: Number(taskWithWorkspace.position?.x ?? 0),
            position_y: Number(taskWithWorkspace.position?.y ?? 0),
            time_active: Number(taskWithWorkspace.timeActive ?? 0),
            due_date: taskWithWorkspace.dueDate ?? null, // ← AGREGADO
            created_at: taskWithWorkspace.createdAt ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        void (async () => {
            const { error } = await supabase
                .from("tasks")
                .insert(payload);

            if (error) {
                console.error("Failed to create task in Supabase:", error);
            }
        })();
    }, [allTasks, activeWorkspaceId, user]);

    const updateTask = useCallback((updatedTask) => {
        if (!user?.id) return;
        persistTasks(allTasks.map(t => t.id === updatedTask.id ? updatedTask : t));

        if (!updatedTask?.id) return;

        const payload = {
            workspace_id: updatedTask.workspaceId ?? activeWorkspaceId,
            title: updatedTask.title ?? "",
            description: updatedTask.description ?? "",
            status: updatedTask.status ?? "todo",
            category: updatedTask.category ?? "General",
            priority: updatedTask.priority ?? "Medium",
            tags: Array.isArray(updatedTask.tags) ? updatedTask.tags : [],
            checklist: Array.isArray(updatedTask.checklist) ? updatedTask.checklist : [],
            color: updatedTask.style?.color ?? updatedTask.color ?? null,
            position_x: Number(updatedTask.position?.x ?? 0),
            position_y: Number(updatedTask.position?.y ?? 0),
            time_active: Number(updatedTask.timeActive ?? 0),
            due_date: updatedTask.dueDate ?? null, // ← AGREGADO
            updated_at: new Date().toISOString(),
        };

        void (async () => {
            const { error } = await supabase
                .from("tasks")
                .update(payload)
                .eq("id", updatedTask.id);

            if (error) {
                console.error("Failed to update task in Supabase:", error);
            }
        })();
    }, [allTasks, activeWorkspaceId, user]);

    const deleteTask = useCallback((taskId) => {
        if (!user?.id) return;
        const taskExists = allTasks.some(t => t.id === taskId);
        if (!taskExists) return;

        persistTasks(allTasks.filter(t => t.id !== taskId));

        void (async () => {
            const { error } = await supabase
                .from("tasks")
                .delete()
                .eq("id", taskId);

            if (error) {
                console.error("Failed to delete task in Supabase:", error);
            }
        })();
    }, [allTasks, user]);

    const completeTask = useCallback((taskId) => {
        if (!user?.id) return;
        const currentTask = allTasks.find(t => t.id === taskId);
        if (!currentTask || currentTask.status === "completed") return;

        const nextTags = Array.isArray(currentTask.tags)
            ? currentTask.tags.includes("COMPLETED")
                ? currentTask.tags
                : [...currentTask.tags, "COMPLETED"]
            : ["COMPLETED"];

        persistTasks(allTasks.map(t =>
            t.id === taskId
                ? { ...t, status: "completed", tags: nextTags }
                : t
        ));

        void (async () => {
            const { error } = await supabase
                .from("tasks")
                .update({
                    status: "completed",
                    tags: nextTags,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", taskId);

            if (error) {
                console.error("Failed to complete task in Supabase:", error);
            }
        })();
    }, [allTasks, user]);

    // --- Value ---
    const value = useMemo(() => ({
        // workspaces
        workspaces,
        activeWorkspaceId,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        reorderWorkspaces,
        selectWorkspace,
        // tasks
        tasks,
        allTasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
    }), [
        workspaces,
        activeWorkspaceId,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        reorderWorkspaces,
        selectWorkspace,
        tasks,
        allTasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
    ]);

    return (
        <BoardContext.Provider value={value}>
            {children}
        </BoardContext.Provider>
    );
}

export const useBoard = () => {
    const ctx = useContext(BoardContext);
    if (!ctx) throw new Error("useBoard must be used within a BoardProvider");
    return ctx;
};