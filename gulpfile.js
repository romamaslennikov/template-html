//=============================================
//               DEPENDENCIES
//=============================================

/**
 * Load required dependencies.
 */

const runTimestamp = Math.round(Date.now() / 1000)
const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()
const del = require('del')
const env = require('dotenv').config()
const moment = require('moment')
const GulpSSH = require('gulp-ssh')
const shell = require('gulp-shell')
const fs = require('fs')

/**
 * Declare variables that are use in gulpfile.js
 */

let src = './src/', // development
  build = './dist/', // build for production
  fontName = 'Icons', // name icons font
  cssClassPrefix = 'i_' // class for font icons

let config = {
  host: process.env.APP_NODE_ENV === 'production' ? process.env.HOST_DEPLOY : process.env.HOST_DEPLOY_DEV,
  port: 22,
  username: process.env.APP_NODE_ENV === 'production' ? process.env.USERNAME : process.env.USERNAME_DEV,
  privateKey: fs.readFileSync(process.env.SSH_AUTH)
}

let archiveName = 'deploy.tgz'
let timestamp = moment().format('YYYYMMDDHHmmssSSS')
let buildPath = './dist'
let rootPath = process.env.VUE_APP_NODE_ENV === 'production' ? '' : '/root/smart_login_vue/'
let releasesPath = rootPath + 'releases/'
let symlinkPath = rootPath + 'current'
let releasePath = releasesPath + timestamp
let gulpSSH

//=============================================
//               DECLARE PATHS
//=============================================

let paths = {
  app: src,
  pug: [src + 'pug/**/*.pug'],
  pugIgnorePartials: [src + 'pug/**/*.pug', '!' + src + 'pug/**/_*.pug'],
  html: [src + '*.html'],
  css: src + 'css/*.css',
  cssDir: src + 'css/',
  cssDirVendor: src + 'css/vendor/*.css',
  scss: [src + 'scss/**/*.*ss'],
  scssDir: src + 'scss/',
  js: src + 'js/*.js',
  jsDir: src + 'js/',
  jsES6: src + 'js/es6/*.js',
  jsDirVendor: src + 'js/vendor/*.js',
  iconsForSprite: src + 'img/icons-for-sprite/**/*.png',
  iconsForSpriteDir: src + 'img/icons-for-sprite/',
  img: src + 'img/**/*.{png,gif,jpg,jpeg,svg,ico,mp4}',
  imgDir: src + 'img/',
  svgForFont: src + 'img/svg-for-font/**/*.svg',
  svgForSprite: src + 'img/svg-for-sprite/**/*.svg',
  svgForFontDir: src + 'img/svg-for-font/',
  fonts: src + 'fonts/**/*.{eot,svg,ttf,woff,woff2}',
  fontsDir: src + 'fonts/',
  fontsForConvert: src + 'fonts/.tmp/*.{ttf,otf}',
  mail: './mail_html/*.html',
  mailCss: './mail_html/*.css',
  mailDir: './mail_html/',
  mailDirDist: './mail_html/dist/',
  build: {
    basePath: build,
    fonts: build + 'fonts/',
    images: build + 'img/',
    styles: build + 'css/',
    scripts: build + 'js/'
  }
}

//=============================================
//               UTILS FUNCTIONS
//=============================================

let notifyOnError = () => {
  return plugins.notify.onError({
    message: 'Error: <%= error.message %>',
    sound: true
  })
}

//=============================================
//                  TASKS
//=============================================

/**
 * Compile pug files into the html.
 */

function html() {
  return gulp.src(paths.pugIgnorePartials)
    .pipe(plugins.pug({pretty: true}))
    .pipe(gulp.dest(paths.app))
}

exports.html = html

/**
 * Compile SASS files into the main.css.
 */

function css() {
  return gulp.src(paths.scss)
    .pipe(plugins.changed(paths.cssDir, {
      extension: '.*ss'
    }))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({
      errLogToConsole: true
    }))
    .on('error', notifyOnError())
    .pipe(plugins.concat('main.css'))
    .pipe(plugins.sourcemaps.write('../../maps'))
    .pipe(gulp.dest(paths.cssDir))
}

exports.css = css

function cssVendor() {
  del(paths.cssDir + 'vendor.css')

  return gulp.src(paths.cssDirVendor)
    .on('error', notifyOnError())
    .pipe(plugins.concat('vendor.css'))
    .pipe(gulp.dest(paths.cssDir))
}

exports.cssVendor = cssVendor

/**
 * Compile vendor js into the vendor.js, babel es6 to es5
 */

function jsVendor() {
  del(paths.jsDir + 'vendor.js')

  return gulp.src([
    paths.jsDir + 'vendor/jquery-3.4.1.min.js',
    paths.jsDirVendor
  ])
    .on('error', notifyOnError())
    .pipe(plugins.concat('vendor.js'))
    .pipe(gulp.dest(paths.jsDir))
}

exports.jsVendor = jsVendor

function babel() {
  return gulp.src(paths.jsES6)
    .pipe(plugins.babel({
      presets: ['@babel/env']
    }))
    .pipe(gulp.dest(paths.jsDir))
}

exports.babel = babel

/*
 * Create sprite
 * */

function sprite() {
  let spriteData = gulp.src(paths.iconsForSprite)
    .pipe(plugins.spritesmith({
      //retinaSrcFilter: paths.iconsForSpriteDir+'*@2x.png',
      imgName: '../img/sprite.png',
      //retinaImgName: '../img/sprite@2x.png',
      cssName: '_sprite.sass',
      cssTemplate: src + 'icons_template/_sprite_template.css.tmpl',
      padding: 2,
      algorithm: 'top-down',
      algorithmOpts: {sort: false}
    }))
    .on('error', notifyOnError())

  spriteData.img
    .pipe(gulp.dest(paths.imgDir))

  spriteData.css
    .pipe(gulp.dest(paths.scssDir))

  return spriteData
}

exports.sprite = sprite

/*
 * Create svg sprite
 * */

function spriteSvg() {
  return gulp.src(paths.svgForSprite)
    .pipe(plugins.svgSprites({
      padding: 20,
      cssFile: 'sprite-svg.css',
      svg: {
        sprite: 'sprite.svg'
      },
      preview: {
        sprite: 'sprite-svg.html'
      }
    }))
    .pipe(gulp.dest(paths.imgDir))
}

exports.spriteSvg = spriteSvg

/*
 * Create icons font
 * */

function iconfont() {
  return gulp.src(paths.svgForFont)
    .pipe(plugins.iconfontCss({
      fontName: fontName,
      cssClass: cssClassPrefix,
      path: src + 'icons_template/_icons_template.css.tmpl',
      targetPath: '../scss/_icons.scss',
      fontPath: '../fonts/'
    }))
    .on('error', notifyOnError())
    .pipe(plugins.iconfont({
      fontName: fontName,
      prependUnicode: true, // recommended option
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
      timestamp: runTimestamp // recommended to get consistent builds when watching files
    }))
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.fontsDir))
}

exports.iconfont = iconfont

/*
 * Create web fonts
 * */

function fontgen() {
  return gulp.src(paths.fontsForConvert)
    .pipe(plugins.fontgen({
      dest: paths.fontsDir,
      css_fontpath: "../fonts"
    }))
    .on('error', notifyOnError())
}

function fontgenConcatCss() {
  return gulp.src(paths.fontsDir + '*.css')
    .pipe(plugins.concat('font-face.css'))
    .pipe(gulp.dest(paths.fontsForConvert))
}

function fontgenRemove() {
  return gulp.src(paths.fontsDir + '*.css')
    .pipe(plugins.clean())
}

exports.fonts = gulp.series(fontgen, fontgenConcatCss, fontgenRemove)

//=============================================
//                DEVELOPMENT TASKS
//=============================================

/*
 * The 'serve' task serve the dev environment.
 * */

function serveInit() {
  browserSync.init({
    port: 8000,
    server: {
      baseDir: paths.app
    },
    notify: false,
    open: false,
    files: [paths.html, paths.scss, paths.js]
  })

  gulp.watch(paths.iconsForSprite, gulp.series(sprite))

  gulp.watch(paths.svgForFont, gulp.series(iconfont))

  gulp.watch(paths.scss, gulp.series(css))

  gulp.watch(paths.cssDirVendor, gulp.series(cssVendor))

  gulp.watch(paths.jsDirVendor, gulp.series(jsVendor))

  gulp.watch(paths.jsES6, gulp.series(babel))

  gulp.watch(paths.pug, gulp.series('html'))

  gulp.watch(paths.scss).on('change', browserSync.reload)

  gulp.watch(paths.pug).on('change', browserSync.reload)

  gulp.watch(paths.js).on('change', browserSync.reload)

  gulp.watch(paths.img).on('change', browserSync.reload)

  gulp.watch(paths.cssDirVendor).on('change', browserSync.reload)

  gulp.watch(paths.jsDirVendor).on('change', browserSync.reload)

  gulp.watch(paths.jsES6).on('change', browserSync.reload)
}

exports.serve = gulp.series(css, html, cssVendor, jsVendor, babel, serveInit)

//=============================================
//              PRODUCTION TASKS
//=============================================

/**
 * The 'clean' task delete 'build' directories.
 */

function clean() {
  return del([].concat(paths.build.basePath))
}

function copyHtml() {
  return gulp.src(paths.html)
  //.pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.build.basePath))
    .pipe(plugins.size({
      title: 'html'
    }))
}

function copyJs() {
  return gulp.src(paths.js)
  //.pipe(plugins.uglify())
    .pipe(gulp.dest(paths.build.scripts))
    .pipe(plugins.size({
      title: 'js'
    }))
}

function copyCss() {
  return gulp.src(paths.css)
    .pipe(plugins.autoprefixer())
    .pipe(plugins.cleanCss({compatibility: 'ie8'}))
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.styles))
    .pipe(plugins.size({
      title: 'css'
    }))
}

function copyImages() {
  return gulp.src([
    paths.img,
    '!' + paths.iconsForSprite,
    '!' + paths.svgForFont
  ])
    .pipe(plugins.imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5,
      svgoPlugins: [
        {removeViewBox: true},
        {cleanupIDs: false}
      ]
    }))
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.images))
    .pipe(plugins.size({
      title: 'images'
    }))
}

function copyFonts() {
  return gulp.src([
    paths.fonts,
    '!' + paths.fontsForConvert
  ])
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.fonts))
    .pipe(plugins.size({
      title: 'fonts'
    }))
}

exports.build = gulp.series(clean, gulp.parallel(copyHtml, copyJs, copyCss, copyImages, copyFonts))

/**
 * Deploy
 */

function deployCompress() {
  return (async () => (shell.task('tar -czvf ./' + archiveName + ' --directory=' + buildPath + ' .'))())()
}

function deployPrepare() {
  return (async () => {
    gulpSSH = new GulpSSH({
      ignoreErrors: false,
      sshConfig: config
    })

    gulpSSH.exec('cd ' + releasesPath + ' && mkdir ' + timestamp)
  })()
}

function deployUpload() {
  return gulp.src(archiveName)
    .pipe(gulpSSH.sftp('write', releasePath + '/' + archiveName))
}

function deployUncompress() {
  return (async () => gulpSSH.exec('cd ' + releasePath + ' && tar -xzvf ' + archiveName))()
}

function deploySymlink() {
  return (async () => gulpSSH.exec('rm -r ' + symlinkPath + ' &&' + ' ln -s ' + releasePath + ' ' + symlinkPath))()
}

function deployClean() {
  return (async () => (shell.task('rm ' + archiveName, {ignoreErrors: true}))())()
}

exports.deploy = gulp.series(deployCompress, deployPrepare, deployUpload, deployUncompress, deploySymlink, deployClean)
