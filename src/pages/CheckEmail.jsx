import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import styles from "./auth.module.css";

export default function CheckEmail() {
  return (
    <div className={styles.page}>
      <div className={styles.containerCenter}>
        <p className={styles.brandTop}>FOCUS.app</p>

        <div className={styles.card}>
          <div className={styles.iconCircle}>
            <Mail size={24} color="#4c6f70" />
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Revisa tu correo</h1>
            <p className={styles.cardSubtitle}>
              Te enviamos un enlace mágico a tu bandeja de entrada. Haz clic en el enlace para verificar tu cuenta y comenzar tu jornada de foco profundo.
            </p>
          </div>

          <a href="mailto:" className={styles.btnPrimary}>
            Abrir aplicación de correo
          </a>

          <div className={styles.resendRow}>
            <p className={styles.resendLabel}>¿NO LO RECIBISTE?</p>
            <button className={styles.switchLink}>Reenviar enlace</button>
          </div>
        </div>

        <div className={styles.footerCenter}>
          <div className={styles.footerDividerRow}>
            <span className={styles.footerLine} />
            <span className={styles.footerBrand}>FOCUS.APP</span>
            <span className={styles.footerLine} />
          </div>
          <p className={styles.footerSub}>FOCUS.APP © 2026</p>
        </div>
      </div>
    </div>
  );
}