"use strict";

window.appName = 'APP';
window[window.appName] = {};

(function (APP) {
  APP.init = function () {
    window.addEventListener('load', function () {
      console.log("ready1");
    });
  };
})(window.APP);

window.APP.init();