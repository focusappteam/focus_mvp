import { useEffect, useState, useCallback, useRef, useId } from "react";
import { X, ArrowRight, ArrowLeft, SkipForward } from "lucide-react";
import { useOnboarding } from "../../hooks/useOnboarding";
import styles from "./onboarding.module.css";

const TOOLTIP_WIDTH = 320;
const TOOLTIP_OFFSET = 16;
const SPOTLIGHT_PAD = 10;
const TOOLTIP_H_APPROX = 200;

// ─── Posicionamiento ──────────────────────────────────────────────────────────

function calcPosition(rect, placement) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    let top, left;

    switch (placement) {
        case "top":
            top = rect.top - TOOLTIP_H_APPROX - TOOLTIP_OFFSET;
            left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
            break;
        case "bottom":
            top = rect.bottom + TOOLTIP_OFFSET;
            left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
            break;
        case "left":
            top = rect.top + rect.height / 2 - TOOLTIP_H_APPROX / 2;
            left = rect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
            break;
        case "right":
        default:
            top = rect.top + rect.height / 2 - TOOLTIP_H_APPROX / 2;
            left = rect.right + TOOLTIP_OFFSET;
            break;
    }

    return {
        top: Math.max(margin, Math.min(top, vh - TOOLTIP_H_APPROX - margin)),
        left: Math.max(margin, Math.min(left, vw - TOOLTIP_WIDTH - margin)),
    };
}

function getPaddedRect(node) {
    const r = node.getBoundingClientRect();
    return {
        x: r.left - SPOTLIGHT_PAD,
        y: r.top - SPOTLIGHT_PAD,
        width: r.width + SPOTLIGHT_PAD * 2,
        height: r.height + SPOTLIGHT_PAD * 2,
        top: r.top - SPOTLIGHT_PAD,
        right: r.right + SPOTLIGHT_PAD,
        bottom: r.bottom + SPOTLIGHT_PAD,
        left: r.left - SPOTLIGHT_PAD,
    };
}

// ─── Spotlight ────────────────────────────────────────────────────────────────

function Spotlight({ rect, maskId }) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rx = Math.max(6, Math.min(rect.width, rect.height) / 4);

    return (
        <svg
            className={styles.spotlightSvg}
            width={vw}
            height={vh}
            viewBox={`0 0 ${vw} ${vh}`}
            aria-hidden
        >
            <defs>
                <mask id={maskId}>
                    <rect x={0} y={0} width={vw} height={vh} fill="white" />
                    <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={rx} ry={rx} fill="black" />
                </mask>
            </defs>
            <rect x={0} y={0} width={vw} height={vh} fill="rgba(0,0,0,0.6)" mask={`url(#${maskId})`} />
            <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height}
                rx={rx} ry={rx} fill="none" stroke="rgba(76,111,112,0.8)" strokeWidth={2} />
        </svg>
    );
}

// ─── TooltipCard — componente único para ambos modos (DRY) ───────────────────

function TooltipCard({
    step,
    stepIndex,
    totalSteps,
    onNext,
    onPrev,
    onSkip,
    isCurrentStepCompleted,
    style,
    className
}) {
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === totalSteps - 1;

    return (
        <div
            className={`${styles.tooltip} ${className ?? ""}`}
            style={style}
            role="dialog"
            aria-modal="false"
            aria-label={`Tutorial paso ${stepIndex + 1} de ${totalSteps}`}
        >
            <div className={styles.tooltipHeader}>
                <span className={styles.stepBadge}>{stepIndex + 1} / {totalSteps}</span>
                <button className={styles.skipBtn} onClick={onSkip} aria-label="Cerrar tutorial">
                    <X size={14} />
                </button>
            </div>

            <h3 className={styles.tooltipTitle}>{step.title}</h3>
            <p className={styles.tooltipDesc}>{step.description}</p>

            <div className={styles.dots} aria-hidden>
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <span key={i} className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ""}`} />
                ))}
            </div>

            <div className={styles.actions}>
                {!isFirst && (
                    <button className={styles.btnSecondary} onClick={onPrev}>
                        <ArrowLeft size={14} /> Anterior
                    </button>
                )}
                <div className={styles.actionsSpacer} />
                <button className={styles.btnSkipText} onClick={onSkip}>
                    <SkipForward size={12} /> Omitir
                </button>
                <button
                    className={styles.btnPrimary}
                    onClick={onNext}
                    disabled={!isCurrentStepCompleted}
                    title={!isCurrentStepCompleted ? "Completa este paso para continuar" : ""}
                >
                    {isLast ? "Finalizar" : "Siguiente"} <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Overlay principal ────────────────────────────────────────────────────────

export default function OnboardingOverlay() {
    const {
        isActive,
        isCompleted,
        currentStep,
        stepIndex,
        totalSteps,
        currentTargetNode,
        isCurrentStepCompleted,
        next,
        prev,
        skip,
        isCreatingTaskOpen,
    } = useOnboarding();

    const maskId = useId().replace(/:/g, "ob-");

    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const rafRef = useRef(null);

    const recalc = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (!currentTargetNode) { setTargetRect(null); return; }
            const padded = getPaddedRect(currentTargetNode);
            setTargetRect(padded);
            setTooltipPos(calcPosition(padded, currentStep?.placement ?? "right"));
        });
    }, [currentTargetNode, currentStep?.placement]);

    useEffect(() => { recalc(); }, [recalc]);

    useEffect(() => {
        window.addEventListener("resize", recalc, { passive: true });
        return () => window.removeEventListener("resize", recalc);
    }, [recalc]);

    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    if (!isActive || isCompleted || !currentStep) return null;

    const hasTarget = !!currentTargetNode;
    const isWaiting = currentStep.waitForTarget && !hasTarget;

    if (isWaiting) {
        return (
            <div className={styles.overlayRoot} style={{ pointerEvents: "none" }}>
                <div className={styles.waitingBadge}>
                    <span className={styles.waitingDot} />
                    {currentStep.waitingLabel ?? "Completa el paso anterior para continuar"}
                </div>
            </div>
        );
    }

    if (!hasTarget) {
        return (
            <div className={styles.overlayRoot}>
                {}
                <div className={styles.spotlightWrapper} style={{ pointerEvents: "none" }}>
                    <div className={styles.fullOverlayDark} />
                </div>

                {}
                <TooltipCard
                    step={currentStep}
                    stepIndex={stepIndex}
                    totalSteps={totalSteps}
                    onNext={next}
                    onPrev={prev}
                    onSkip={skip}
                    isCurrentStepCompleted={isCurrentStepCompleted}
                    style={{
                        position: "fixed",
                        top: 80,
                        left: 20,
                        width: TOOLTIP_WIDTH
                    }}
                />
            </div>
        );
    }

    return (
        <div className={styles.overlayRoot}>
            {currentStep.mode === "spotlight" && targetRect && !isCreatingTaskOpen && (
                <div className={styles.spotlightWrapper} style={{ pointerEvents: "none" }}>
                    <Spotlight rect={targetRect} maskId={maskId} />
                </div>
            )}
            {targetRect && (
                <TooltipCard
                    step={currentStep}
                    stepIndex={stepIndex}
                    totalSteps={totalSteps}
                    onNext={next}
                    onPrev={prev}
                    onSkip={skip}
                    isCurrentStepCompleted={isCurrentStepCompleted}
                    style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, width: TOOLTIP_WIDTH }}
                />
            )}
        </div>
    );
}