import { useState, useRef, useCallback } from 'react';

export function useToast(duration = 2000, fadeOut = 200) {
    const [toast, setToast] = useState(null);
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimeoutRef = useRef(null);
    const toastCleanupRef = useRef(null);

    const showToast = useCallback((message) => {
        clearTimeout(toastTimeoutRef.current);
        clearTimeout(toastCleanupRef.current);
        setToast(message);
        setToastVisible(true);
        toastTimeoutRef.current = setTimeout(() => {
            setToastVisible(false);
            toastCleanupRef.current = setTimeout(() => setToast(null), fadeOut);
        }, duration);
    }, [duration, fadeOut]);

    return { toast, toastVisible, showToast };
}
