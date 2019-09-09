window.appName = 'APP';

window[window.appName] = {};

((APP) => {
  APP.init = () => {
    window.addEventListener('load', () => {

    });
  };
})(window.APP);

window.APP.init();
