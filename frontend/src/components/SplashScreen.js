import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-container">
      <div className="splash-header-block">
        <img src={require('../assets/welcome/heading.png')} alt="Заголовок" className="splash-heading-img" />
        <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" className="splash-cupcake-pulse" />
        <img src={require('../assets/welcome/subtitle.png')} alt="Подпись" className="splash-subtitle-img" />
        <img src={require('../assets/welcome/heart.png')} alt="heart" className="splash-heart" style={{width: '130px', height: '130px', minWidth: '130px', minHeight: '130px', maxWidth: 'none', maxHeight: 'none', position: 'absolute', top: '140px', left: '50px'}} />
      </div>
      <div className="splash-bottom-block">
        <img src={require('../assets/welcome/diana.png')} alt="Диана" className="splash-diana" style={{width: '340px', minWidth: '340px', height: 'auto', maxWidth: 'none', display: 'block', objectFit: 'contain', marginLeft: '110px'}} />
        <img src={require('../assets/welcome/yoga-mat.png')} alt="йога коврик" className="splash-yoga" style={{position: 'absolute', left: '10px', bottom: '120px', width: '110px', height: 'auto', objectFit: 'contain'}} />
      </div>
    </div>
  );
};

export default SplashScreen;
