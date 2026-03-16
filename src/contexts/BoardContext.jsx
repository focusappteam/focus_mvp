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
    const createWorkspace = useCallback((name) => {
        const newWs = { id: `ws-${Date.now()}`, name };
        const updated = [...workspaces, newWs];
        persistWorkspaces(updated);
        return newWs;
    }, [workspaces]);

    const renameWorkspace = useCallback((id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        persistWorkspaces(workspaces.map(ws => ws.id === id ? { ...ws, name: trimmed } : ws));
    }, [workspaces]);

    const deleteWorkspace = useCallback((id) => {
        const updated = workspaces.filter(ws => ws.id !== id);
        persistWorkspaces(updated);
        // Remove all tasks belonging to that workspace
        persistTasks(allTasks.filter(t => t.workspaceId !== id));
        // If deleted workspace was active, switch to first available
        if (activeWorkspaceId === id) {
            const next = updated[0]?.id ?? null;
            persistActiveWorkspace(next);
        }
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
    }, [allTasks, activeWorkspaceId]);

    const updateTask = useCallback((updatedTask) => {
        persistTasks(allTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    }, [allTasks]);

    const deleteTask = useCallback((taskId) => {
        persistTasks(allTasks.filter(t => t.id !== taskId));
    }, [allTasks]);

    const completeTask = useCallback((taskId) => {
        persistTasks(allTasks.map(t =>
            t.id === taskId && t.status !== "completed"
                ? { ...t, status: "completed", tags: [...(t.tags || []), "COMPLETED"] }
                : t
        ));
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