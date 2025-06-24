import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-container">
      <div className="splash-header">
        <div className="splash-title-row">
          <span className="splash-title-main">ХУДЕЙ С</span>
          <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" className="splash-cupcake-inline" />
        </div>
        <div className="splash-title-row">
          <span className="splash-title-main">ДИАНОЙ</span>
        </div>
        <p className="splash-subtitle">Любовь к себе преображает</p>
      </div>
      <img src={require('../assets/welcome/heart.png')} alt="heart" className="splash-heart" />
      <img src={require('../assets/welcome/diana.png')} alt="Диана" className="splash-diana" />
      <img src={require('../assets/welcome/yoga-mat.png')} alt="йога коврик" className="splash-yoga" />
    </div>
  );
};

export default SplashScreen;
