# TEMPLATE HTML - fast built
gulp: html, css, js, create sprite, svg to fonts, create web fonts,
 minify PNG, JPEG, GIF and SVG images, email builder, eslint.

![](app.jpg)
## Installation

Before running any Gulp tasks:

1. Check out this repository
2. Ensure you have **node** installed
3. Run `npm run go` in the root directory
4. Open link http://localhost:8000

## Project Structure

    |root
    |     package.json
    |     gulpfile.js
    |     |src
    |     |     index.html
    |     |     main.html
    |     |     |icons_template
    |     |     |     _icons_template.css.tmpl
    |     |     |     _sprite_template.css.tmpl
    |     |     |js
    |     |     |     |vendor
    |     |     |     |es6
    |     |     |          es6.js
    |     |     |     vendor.js
    |     |     |     jquery.main.js
    |     |     |pug
    |     |     |     main.pug
    |     |     |css
    |     |     |     |vendor
    |     |     |     main.css
    |     |     |     vendor.css
    |     |     |scss
    |     |     |img
    |     |     |     /png-for-sprite  ----->(png icons for create sprite)
    |     |     |     /svg-for-sprite  ----->(svg icons for create sprite svg)
    |     |     |     /svg-for-font  ----->(svg icons for create icons font)
    |     |     |fonts
    |     |     |     |.tmp  ----->(fonts for create web fonts)
    |     |mail_html (soon..)
    |     |     index.html
    |     |     email.css
    |     |     |img
    |     |     |dist

## Version

2.0.0

## License

MIT
