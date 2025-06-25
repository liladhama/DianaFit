import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-container">
      <div className="splash-header-block">
        <img src={require('../assets/welcome/heading.png')} alt="Заголовок" className="splash-heading-img" />
        <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" className="splash-cupcake-pulse" style={{position: 'absolute', top: '50px'}} />
        <img src={require('../assets/welcome/subtitle.png')} alt="Подпись" className="splash-subtitle-img" />
        <img src={require('../assets/welcome/heart.png')} alt="heart" className="splash-heart" style={{width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', maxWidth: 'none', maxHeight: 'none', position: 'absolute', top: '200px', left: '70px'}} />
      </div>
      <div className="splash-bottom-block">
        <img src={require('../assets/welcome/dumbbell2.png')} alt="dumbbell" className="splash-dumbbell-pulse" style={{position: 'absolute', left: '40px', bottom: '370px', width: '90px', height: '90px', objectFit: 'contain', animation: 'pulse 1.5s infinite'}} />
        <img src={require('../assets/welcome/diana.png')} alt="Диана" className="splash-diana" style={{width: '340px', minWidth: '340px', height: 'auto', maxWidth: 'none', display: 'block', objectFit: 'contain', marginLeft: '110px', marginTop: '60px'}} />
        <img src={require('../assets/welcome/yoga-mat.png')} alt="йога коврик" className="splash-yoga" style={{position: 'absolute', left: '10px', bottom: '200px', width: '110px', height: 'auto', objectFit: 'contain'}} />
      </div>
    </div>
  );
};

export default SplashScreen;
