import { supabase } from '../utils/supabase'

import { createContext, useContext, useState, useCallback, useMemo } from "react";

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
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

    // --- Workspace actions ---
    const createWorkspace = useCallback(async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;

        let newWs = { id: `ws-${Date.now()}`, name: trimmed };

        try {
            const { data, error } = await supabase
                .from("workspaces")
                .insert({
                    name: trimmed,
                    sort_order: workspaces.length,
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
    }, [workspaces]);

    const renameWorkspace = useCallback((id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

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
    }, [workspaces]);

    const deleteWorkspace = useCallback((id) => {
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
    }, [workspaces, allTasks, activeWorkspaceId]);

    const reorderWorkspaces = useCallback((reordered) => {
        persistWorkspaces(reordered);
    }, []);

    const selectWorkspace = useCallback((id) => {
        persistActiveWorkspace(id);
    }, []);

    // --- Task actions ---
    const addTask = useCallback((task) => {
        const taskWithWorkspace = { ...task, workspaceId: activeWorkspaceId };
        persistTasks([...allTasks, taskWithWorkspace]);

        if (!taskWithWorkspace.workspaceId) return;

        const payload = {
            id: taskWithWorkspace.id,
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
    }, [allTasks, activeWorkspaceId]);

    const updateTask = useCallback((updatedTask) => {
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
    }, [allTasks, activeWorkspaceId]);

    const deleteTask = useCallback((taskId) => {
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
    }, [allTasks]);

    const completeTask = useCallback((taskId) => {
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
    }, [allTasks]);

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