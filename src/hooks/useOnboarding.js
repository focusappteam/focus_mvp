import { useContext} from "react";
import { useOnboardingContext } from "../contexts/OnboardingContext.jsx";
import { OnboardingContext } from "../contexts/OnboardingContext";

export function useOnboarding() {
    return useOnboardingContext();
}

export function useOnboardingRef(id) {
    const ctx = useContext(OnboardingContext);
    const registerTarget = ctx?.registerTarget;

    return (node) => {
        if (!registerTarget) return;
        registerTarget(id, node);
    };
}