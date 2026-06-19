import { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import styles from "./deepWorkBreakPromptToast.module.css";

/**
 * Bottom-right toast that appears after 90 minutes of cumulative deep work.
 * Mirrors the shape of `BreakPromptToast` but with Postpone semantics and
 * an auto-Postpone on no-action timeout.
 */
function DeepWorkBreakPromptToast({
    visible,
    onAccept,
    onDeny,
    onPostpone,
    autoCloseMs = 5 * 60 * 1000,
}) {
    const [show, setShow] = useState(false);
    const autoTimeoutRef = useRef(null);

    useEffect(() => {
        if (autoTimeoutRef.current) {
            clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = null;
        }
        if (visible) {
            const t = setTimeout(() => setShow(true), 30);
            if (autoCloseMs && onPostpone) {
                autoTimeoutRef.current = setTimeout(() => {
                    onPostpone();
                    autoTimeoutRef.current = null;
                }, autoCloseMs);
            }
            return () => clearTimeout(t);
        }
        setShow(false);
    }, [visible, autoCloseMs, onPostpone]);

    if (!visible) return null;

    const handleAction = (cb) => () => {
        if (autoTimeoutRef.current) {
            clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = null;
        }
        if (cb) cb();
    };

    return (
        <div className={`${styles.toast} ${show ? styles.enter : styles.exit}`}>
            <div className={styles.icon}>
                <Activity size={20} />
            </div>

            <div className={styles.body}>
                <p className={styles.title}>90 minutos de enfoque profundo</p>
                <p className={styles.subtitle}>Tómate un breve descanso activo</p>
            </div>

            <div className={styles.actions}>
                <button className={styles.accept} onClick={handleAction(onAccept)}>Aceptar</button>
                <button className={styles.postpone} onClick={handleAction(onPostpone)}>Posponer</button>
                <button className={styles.deny} onClick={handleAction(onDeny)}>Denegar</button>
            </div>
        </div>
    );
}

export default DeepWorkBreakPromptToast;
