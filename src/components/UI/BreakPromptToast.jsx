import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import styles from './breakPromptToast.module.css';

/**
 * Bottom-left toast that appears after a focus session finishes (outside focus overlay).
 * Offers Accept / Deny / Later for an Active Break.
 */
function BreakPromptToast({ visible, onAccept, onDeny, onLater }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            // small delay so the enter animation plays
            const t = setTimeout(() => setShow(true), 30);
            return () => clearTimeout(t);
        }
        setShow(false);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className={`${styles.toast} ${show ? styles.enter : styles.exit}`}>
            <div className={styles.icon}>
                <Activity size={20} />
            </div>

            <div className={styles.body}>
                <p className={styles.title}>Hold on buddy!</p>
                <p className={styles.subtitle}>Time for a small active break session 🧘</p>
            </div>

            <div className={styles.actions}>
                <button className={styles.accept} onClick={onAccept}>Accept</button>
                <button className={styles.later} onClick={onLater}>Later</button>
                <button className={styles.deny} onClick={onDeny}>Deny</button>
            </div>
        </div>
    );
}

export default BreakPromptToast;
