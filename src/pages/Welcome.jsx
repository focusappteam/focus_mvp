import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import styles from "./auth.module.css";

export default function Welcome() {
  const navigate = useNavigate();

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
            <CheckCircle size={24} color="#4c6f70" />
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Bienvenido a FOCUS</h1>
            <p className={styles.cardSubtitle}>
              Tu correo ha sido confirmado.<br></br>
              Estás listo para dejar el ruido atrás y entrar en tu estado de foco profundo.
            </p>
          </div>

          <button className={styles.btnPrimary} onClick={() => navigate("/app")}>
            Entrar al workspace <ArrowRight size={16} />
          </button>


          <div className={styles.dotsRow}>
            <span className={styles.dotActive} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
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