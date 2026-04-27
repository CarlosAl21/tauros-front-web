import taurosLogo from '../utils/pictures/TaurosLogo.png';

function Logo({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'logo--small',
    medium: 'logo--medium',
    large: 'logo--large',
  };

  return (
    <div className={`logo ${sizeClasses[size] || sizeClasses.medium} ${className}`}>
      <img src={taurosLogo} alt="Tauros Fitness Club" className="logo-img" />
    </div>
  );
}

export default Logo;
