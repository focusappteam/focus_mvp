import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { ONBOARDING_STEPS } from "../config/onboardingSteps";
import { useBoard } from "./BoardContext";
import { useTimer } from "./TimerContext";

const STORAGE_KEY = "onboarding_completed";
const STORAGE_STEP_KEY = "onboarding_step";

export const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
    const [status, setStatus] = useState(() =>
        localStorage.getItem(STORAGE_KEY) === "true" ? "completed" : "active"
    );

    const [stepIndex, setStepIndex] = useState(() => {
        if (localStorage.getItem(STORAGE_KEY) === "true") return 0;
        const saved = parseInt(localStorage.getItem(STORAGE_STEP_KEY) ?? "0", 10);
        return isNaN(saved) ? 0 : saved;
    });

    const targetsMapRef = useRef({});
    const [targetsVersion, setTargetsVersion] = useState(0);

    const { workspaces, tasks, allTasks } = useBoard();
    const { state: timerState } = useTimer();

    const [isEditingTaskOpen, setIsEditingTaskOpen] = useState(false);

    const isFocusMode = !!(
        timerState.taskId &&
        timerState.timers[timerState.taskId]?.isRunning
    );

    const [hasUsedFocusMode, setHasUsedFocusMode] = useState(false);

    useEffect(() => {
        if (isFocusMode) {
            setHasUsedFocusMode(true);
        }
    }, [isFocusMode]);

    const currentStep = ONBOARDING_STEPS[stepIndex] ?? null;
    const currentStepTarget = currentStep?.target ?? null;

    const [isCreatingTaskOpen, setIsCreatingTaskOpen] = useState(false);

    const evaluationContext = useMemo(() => ({
        workspaces,
        allTasks,
        isFocusMode,
        hasUsedFocusMode,
        isEditingTaskOpen,
    }), [workspaces, allTasks, isFocusMode, hasUsedFocusMode, isEditingTaskOpen]);

    const isCurrentStepCompleted = useMemo(() => {
        if (!currentStep || typeof currentStep.isCompleted !== "function") {
            return true;
        }
        return currentStep.isCompleted(evaluationContext);
    }, [currentStep, evaluationContext]);

    const registerTarget = useCallback((id, node) => {
        const prev = targetsMapRef.current[id];

        if (node == null) {
            if (prev == null) return;
            delete targetsMapRef.current[id];
        } else {
            if (prev === node) return;
            targetsMapRef.current[id] = node;
        }

        if (id === currentStepTarget) {
            setTargetsVersion(v => v + 1);
        }
    }, [currentStepTarget]);

    useEffect(() => {
        setTargetsVersion(v => v + 1);
    }, [stepIndex]);

    const currentTargetNode = useMemo(
        () => (currentStepTarget ? (targetsMapRef.current[currentStepTarget] ?? null) : null),
        [currentStepTarget, targetsVersion]
    );

    // ── Persistencia ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (status !== "completed") {
            localStorage.setItem(STORAGE_STEP_KEY, String(stepIndex));
        }
    }, [stepIndex, status]);

    // ── Acciones ──────────────────────────────────────────────────────────────

    const complete = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.removeItem(STORAGE_STEP_KEY);
        setStatus("completed");
        setStepIndex(0);
    }, []);

    const next = useCallback(() => {
        const nextIndex = stepIndex + 1;
        if (nextIndex >= ONBOARDING_STEPS.length) {
            complete();
        } else {
            setStepIndex(nextIndex);
        }
    }, [stepIndex, complete]);

    useEffect(() => {
        if (!currentStep || status !== "active") return;

        if (typeof currentStep.isCompleted === "function" && !currentStep.optional) {
            const done = currentStep.isCompleted(evaluationContext);

            if (done) {
                next();
            }
        }
    }, [currentStep, evaluationContext, status, next]);

    const prev = useCallback(() => {
        setStepIndex(i => Math.max(0, i - 1));
    }, []);

    const skip = complete;

    const reset = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_STEP_KEY);
        setStepIndex(0);
        setStatus("active");
    }, []);

    const hide = useCallback(() => setStatus(s => s !== "completed" ? "hidden" : s), []);
    const show = useCallback(() => setStatus(s => s !== "completed" ? "active" : s), []);

    const value = useMemo(() => ({
        isActive: status === "active",
        isCompleted: status === "completed",
        stepIndex,
        totalSteps: ONBOARDING_STEPS.length,
        currentStep,
        currentTargetNode,
        isCurrentStepCompleted,
        isCreatingTaskOpen,
        isEditingTaskOpen,
        next,
        prev,
        skip,
        reset,
        hide,
        show,
        registerTarget,
        setIsCreatingTaskOpen,
        setIsEditingTaskOpen,
    }), [
        status, stepIndex, currentStep, currentTargetNode,
        isCurrentStepCompleted,
        next, prev, skip, reset, hide, show, registerTarget,
        setIsCreatingTaskOpen, isCreatingTaskOpen,
        isCreatingTaskOpen, isEditingTaskOpen,
    ]);

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboardingContext() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error("useOnboardingContext must be used within OnboardingProvider");
    return ctx;
}