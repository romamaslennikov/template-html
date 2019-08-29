window.appName = 'APP'

window[window.appName] = {}

;((APP) => {
  APP.init = () => {
    window.addEventListener('load', () => {
      console.log(`ready`)
    })
  }
})(window.APP)

window.APP.init()
