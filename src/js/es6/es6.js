window.appName = 'APP';
window[window.appName] = {};

((APP) => {
  APP.init = () => {
    window.addEventListener('load', () => {
      window.svg4everybody(); // SVG for Everybody adds SVG External Content
    });
  };
})(window.APP);

window.APP.init();
