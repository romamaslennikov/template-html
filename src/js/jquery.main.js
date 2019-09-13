"use strict";

window.appName = 'APP';
window[window.appName] = {};

(function (APP) {
  APP.init = function () {
    window.addEventListener('load', function () {
      window.svg4everybody(); // SVG for Everybody adds SVG External Content
    });
  };
})(window.APP);

window.APP.init();