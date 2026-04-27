import Logo from './Logo';

function AuthScreen({ authForm, setAuthForm, onSubmit, error, success }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Logo size="large" className="auth-logo" />
        <p className="brand-subtitle">Acceso restringido para administracion del sistema</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Correo
            <input
              type="email"
              required
              value={authForm.correo}
              onChange={(event) => setAuthForm((current) => ({ ...current, correo: event.target.value }))}
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              minLength={6}
              required
              value={authForm.password}
              onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <button type="submit" className="btn-primary">
            Iniciar sesion
          </button>
        </form>

        {error && <p className="status error">{error}</p>}
        {success && <p className="status success">{success}</p>}
      </div>
    </div>
  );
}

export default AuthScreen;
