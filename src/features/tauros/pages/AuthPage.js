import AuthScreen from '../components/AuthScreen';

function AuthPage({ authForm, setAuthForm, handleAuth, error, success }) {
  return (
    <AuthScreen
      authForm={authForm}
      setAuthForm={setAuthForm}
      onSubmit={handleAuth}
      error={error}
      success={success}
    />
  );
}

export default AuthPage;
