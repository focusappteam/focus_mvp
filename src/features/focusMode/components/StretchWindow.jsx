import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./stretchWindow.module.css";
import { useStretches } from "../hooks/useStretches";
import { STRETCHES } from "../config/stretches";

function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
}

/**
 * Small centered modal shown after the 90-minute deep-work prompt is
 * accepted. Cycles through `STRETCHES` with a per-stretch countdown.
 *
 *  - The stretching clock runs on its own — independent of the deep-work
 *    timer. The user can leave the task timer paused or running; the
 *    stretches progress either way.
 *  - Total time is capped at `STRETCH_TOTAL_CAP_SECONDS`.
 *  - Closing early shows an inline confirmation.
 *  - `onClose` is the break-finished signal (the parent resets the cycle).
 */
function StretchWindow({ onClose }) {
    const {
        currentStretch,
        index,
        total,
        isLast,
        isFinished,
        secondsLeft,
        totalSecondsRemaining,
        next,
        finishEarly,
    } = useStretches();

    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        if (isFinished && onClose) {
            onClose();
        }
    }, [isFinished, onClose]);

    if (isFinished) return null;

    const handleCloseRequest = () => {
        if (isLast && secondsLeft <= 0) {
            finishEarly();
            return;
        }
        setShowCloseConfirm(true);
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        finishEarly();
    };

    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    return (
        <div className={styles.backdrop} onClick={handleCloseRequest}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>DESCANSO ACTIVO</p>
                        <p className={styles.totalTime}>
                            {formatTime(totalSecondsRemaining)} restantes
                        </p>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={handleCloseRequest}
                        aria-label="Cerrar descanso"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.stretchBody}>
                    <p className={styles.stretchName}>{currentStretch?.name}</p>
                    <p className={styles.stretchCue}>{currentStretch?.cue}</p>
                    <div className={styles.countdown} key={index}>
                        {formatTime(secondsLeft)}
                    </div>
                </div>

                <div className={styles.dots}>
                    {STRETCHES.map((_, i) => (
                        <span
                            key={i}
                            className={`${styles.dot} ${i === index ? styles.dotActive : ""} ${i < index ? styles.dotDone : ""}`}
                        />
                    ))}
                </div>

                <div className={styles.counter}>
                    {index + 1} / {total}
                </div>

                {showCloseConfirm ? (
                    <div className={styles.confirm}>
                        <p className={styles.confirmText}>
                            ¿Terminar el descanso ahora? Tu ciclo de 90 min se reiniciará.
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.confirmCancel} onClick={handleCancelClose}>
                                Continuar
                            </button>
                            <button className={styles.confirmOk} onClick={handleConfirmClose}>
                                Terminar ahora
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.footer}>
                        {!isLast && (
                            <button className={styles.skipBtn} onClick={next}>
                                Saltar
                            </button>
                        )}
                        <button className={styles.finishBtn} onClick={handleCloseRequest}>
                            Finalizar descanso
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StretchWindow;
