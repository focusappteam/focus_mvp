import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import styles from "./auth.module.css";

export default function CheckEmail() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.navLogo}>
          <span className={styles.navLogoPrimary}>FOCUS</span>
          <span className={styles.navLogoSecondary}>.app</span>
        </span>
      </nav>
      <div className={styles.container}>

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

          <a href="/login" className={styles.btnPrimary}>
            Volver al login
          </a>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>© 2026 FOCUS.APP. TODOS LOS DERECHOS RESERVADOS.</span>
        <div className={styles.footerLinks}>
          <a href="#">POLITICA DE PRIVACIDAD</a>
          <a href="#">TERMINOS DEL SERVICIO</a>
          <a href="#">CONTACTO</a>
        </div>
      </footer>
    </div>
  );
}