import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import styles from "./auth.module.css";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: authError } = await signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // Aquí puedes pasar más datos al trigger:
          // avatar_url: ""
        }
      }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Este email ya tiene una cuenta.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // El trigger en Supabase ya creó el perfil automáticamente.
    // Si tienes "Confirm email" activo, avisamos al usuario.
    setSuccess("¡Cuenta creada! Revisa tu correo para confirmarla.");
    setLoading(false);
    setTimeout(() => navigate("/login", { replace: true }), 3000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerRegister}>
        <div className={styles.cardRegister}>
          <div className={styles.logoBlock}>
            <div className={styles.logoIcon}>
              <span className={styles.logoIconInner}>F</span>
            </div>
            <span className={styles.logoText}>
              <span className={styles.navLogoPrimary}>FOCUS</span>
              <span className={styles.navLogoSecondary}>.app</span>
            </span>
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Unete al estudio</h1>
            <p className={styles.cardSubtitle}>Comienza tu camino hacia el enfoque profundo</p>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>NOMBRE COMPLETO</label>
              <div className={styles.inputWrapper}>
                <User size={15} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="ej. Alex Rivera"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>CORREO ELECTRONICO</label>
              <div className={styles.inputWrapper}>
                <Mail size={15} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="name@studio.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>CONTRASEÑA</label>
              <div className={styles.inputWrapper}>
                <Lock size={15} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button className={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>O CONTINUAR CON</span>
          </div>

          <div className={styles.socialRow}>
            <button className={styles.btnSocial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button className={styles.btnSocial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>

          <p className={styles.switchText}>
            Ya tienes una cuenta?{" "}
            <Link to="/login" className={styles.switchLink}>Iniciar sesion</Link>
          </p>
        </div>

        <div className={styles.decorLeft} />
        <div className={styles.decorRight} />
      </div>

      <footer className={styles.footerRegister}>
        <span>FOCUS.app</span>
        <div className={styles.footerLinks}>
          <a href="#">POLITICA DE PRIVACIDAD</a>
          <a href="#">TERMINOS DEL SERVICIO</a>
          <a href="#">CONTACTO</a>
        </div>
        <span>© 2026 FOCUS.APP. TODOS LOS DERECHOS RESERVADOS.</span>
      </footer>
    </div>
  );
}