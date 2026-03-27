import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import styles from "./auth.module.css";

export default function WelcomeStudio() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.containerCenter}>
        <p className={styles.brandTop}>FOCUS.app</p>

        <div className={styles.card}>
          <div className={styles.iconCircle}>
            <CheckCircle size={24} color="#4c6f70" />
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Bienvenido al espacio de trabajo</h1>
            <p className={styles.cardSubtitle}>
              Tu correo ha sido confirmado. Estás listo para dejar el ruido atrás y entrar en tu estado de foco profundo.
            </p>
          </div>

          <button className={styles.btnPrimary} onClick={() => navigate("/app")}>
            Entrar al workspace <ArrowRight size={16} />
          </button>

          <p className={styles.settingUpText}>CONFIGURANDO TU ESPACIO DE TRABAJO...</p>

          <div className={styles.dotsRow}>
            <span className={styles.dotActive} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>

        <p className={styles.needHelp}>
          ¿Necesitas ayuda?{" "}
          <a href="#" className={styles.switchLink}>Visita nuestro centro de soporte</a>
        </p>
      </div>
    </div>
  );
}