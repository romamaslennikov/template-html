window.appName = 'APP';

window[window.appName] = {};

(function (APP) {
  APP.init = function () {
    window.addEventListener('load', function () {
      console.log('ready');
    });
  };
})(APP);

APP.init();
