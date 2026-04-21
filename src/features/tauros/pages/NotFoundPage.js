import { Navigate } from 'react-router-dom';

function NotFoundPage({ token }) {
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export default NotFoundPage;
