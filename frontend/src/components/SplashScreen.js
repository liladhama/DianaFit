import React from 'react';
import './SplashScreen.css';
import heading from '../assets/welcome/heading.svg';
import subtitle from '../assets/welcome/subtitle.svg';

const SplashScreen = () => {
  return (
    <div className="splash-container">
      <div className="splash-header-block">
        <img src={heading} alt="Заголовок" className="splash-heading-img" />
        <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" className="splash-cupcake-pulse" style={{position: 'absolute', top: '45px'}} />
        <img src={subtitle} alt="Подпись" className="splash-subtitle-img" />
        <img src={require('../assets/welcome/heart.png')} alt="heart" className="splash-heart" style={{width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', maxWidth: 'none', maxHeight: 'none', position: 'absolute', top: '170px', left: '70px'}} />
      </div>
      <div className="splash-bottom-block">
        <img src={require('../assets/welcome/dumbbell2.png')} alt="dumbbell" className="splash-dumbbell-pulse" style={{position: 'absolute', left: '40px', bottom: '440px', width: '90px', height: '90px', objectFit: 'contain', animation: 'pulse 1.5s infinite'}} />
        <img src={require('../assets/welcome/diana.png')} alt="Диана" className="splash-diana" style={{width: '390px', minWidth: '390px', height: 'auto', maxWidth: 'none', display: 'block', objectFit: 'contain', marginLeft: '110px', marginTop: '70px'}} />
        <img src={require('../assets/welcome/yoga-mat.png')} alt="йога коврик" className="splash-yoga" style={{position: 'absolute', left: '10px', bottom: '230px', width: '110px', height: 'auto', objectFit: 'contain'}} />
      </div>
    </div>
  );
};

export default SplashScreen;
