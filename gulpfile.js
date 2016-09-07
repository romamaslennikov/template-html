'use strict';

//=============================================
//               DEPENDENCIES
//=============================================

/**
 * Load required dependencies.
 */
let buffer = require('vinyl-buffer');
let runTimestamp = Math.round(Date.now()/1000);
let gulp = require('gulp');
let browserSync = require('browser-sync');

/**
 * Load Gulp plugins listed in 'package.json' and attaches them to the `$` variable.
 */
let $ = (require('gulp-load-plugins'))();

/**
 * Declare variables that are use in gulpfile.js
 */
let patch = 'html'; // name_html
let fontName = 'Icons'; // name icons font
let cssClassPrefix = 'i_'; // start css class for font icons

//=============================================
//               UTILS FUNCTIONS
//=============================================
let notifyOnError = function() {
  return $.notify.onError({
    message: 'Error: <%= error.message %>',
    sound: true
  });
};

//=============================================
//               DECLARE PATHS
//=============================================
let paths = {
  app: './'+patch+'/',
  html: './'+patch+'/**/*.html',
  css: './'+patch+'/css/*.css',
  cssDir: './'+patch+'/css/',
  scss: ['./'+patch+'/css/scss/**/*.*ss'],
  scssDir: './'+patch+'/css/scss/',
  js: './'+patch+'/js/**/*.js',
  jsDir: './'+patch+'/js/',
  iconsForSprite: './'+patch+'/img/icons-for-sprite/**/*.png',
  img: './'+patch+'/img/**/*.{png,gif,jpg,jpeg,svg,ico}',
  imgDir: './'+patch+'/img/',
  svgForFont: './'+patch+'/img/svg-for-font/**/*.svg',
  fonts: './'+patch+'/fonts/**/*.{eot,svg,ttf,woff,woff2}',
  fontsDir: './'+patch+'/fonts/',
  fontsForConvert: './'+patch+'/fonts/.tmp/*.{ttf,otf}',
  fontsDirVendor: 'jspm_packages/**/*.{eot,svg,ttf,woff,woff2}',
  mail: './mail_html/*.html',
  mailCss: './mail_html/*.css',
  mailDir: './mail_html/',
  mailDirDist: './mail_html/dist/',
};

//=============================================
//               HELPER
//=============================================

/**
 * Add the ability to provide help text to custom gulp tasks. Usage: `gulp help`
 */
$.help(gulp);

//=============================================
//               SUB TASKS
//=============================================

/**
 * Compile SASS files into the main.css.
 */
gulp.task('styles:custom', 'Compile sass files into the main.css', () => {
  return gulp.src(paths.scss)
    .pipe($.changed(paths.cssDir, {
      extension: '.*ss'
    }))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      /*outputStyle: 'compressed',*/
      errLogToConsole: true
    }))
    .on('error', notifyOnError())
    .pipe($.autoprefixer({
      browsers: ['> .01%'],
      cascade: false
    }))
    .pipe($.concat('main.css'))
    .pipe($.sourcemaps.write('../../maps'))
    .pipe(gulp.dest(paths.cssDir));
});

/**
 * Compile vendor styles into the vendor.css
 */
gulp.task('styles:vendor', 'Compile vendor styles into the vendor.css', () => {
  return gulp.src([
    'jspm_packages/github/twbs/bootstrap@3.3.7/css/bootstrap.min.css'
  ])
    .pipe($.sass({
      outputStyle: 'compressed',
      errLogToConsole: true
    }))
    .on('error', notifyOnError())
    .pipe($.concat('vendor.css'))
    .pipe(gulp.dest(paths.cssDir));
});

/**
 * Compile vendor js into the vendor.js
 */
gulp.task('js:vendor', 'Compile vendor js into the vendor.js', () => {
  return gulp.src([
    'jspm_packages/github/components/jquery@2.2.4/jquery.min.js',
    'jspm_packages/github/matthewhudson/device.js@0.2.7/lib/device.min.js'
  ]).on('error', notifyOnError())
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest(paths.jsDir));
});

/**
 * The 'fonts' task copies fonts to `build / dist` directory.
 */
gulp.task('fonts:vendor', 'Copy fonts vendor to `fonts` directory', () => {
  return gulp.src(paths.fontsDirVendor)
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.fontsDir))
    .pipe($.size({
      title: 'fonts'
    }));
});

/*
 * Create sprite
 * */
gulp.task('sprite', () => {
  var spriteData =  gulp.src(paths.iconsForSprite)
    .pipe($.spritesmith({
      imgName: '../img/sprite.png',
      cssName: '_sprite.css',
      padding: 2
    }));
  spriteData.img
    .pipe(buffer())
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}]
    }))
    .pipe(gulp.dest(paths.imgDir));
  spriteData.css
    .pipe($.csso())
    .pipe(gulp.dest(paths.scssDir));
});

/*
 * Create icons font
 * */
gulp.task('iconfont', () => {
  return gulp.src(paths.svgForFont)
    .pipe($.iconfontCss({
      fontName: fontName,
      cssClass: cssClassPrefix,
      path: '_icons_template.css.tmpl',
      targetPath: '../css/scss/_icons.scss',
      fontPath: '../fonts/'
    }))

    .pipe($.iconfont({
      fontName: fontName,
      prependUnicode: true, // recommended option
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
      timestamp: runTimestamp // recommended to get consistent builds when watching files
    }))

    .pipe(gulp.dest(paths.fontsDir));
});

/*
 * Create web fonts
 * */
// 1) Create web fonts
gulp.task('fontgen', function() {
  return gulp.src(paths.fontsForConvert)
    .pipe($.fontgen({
      dest: paths.fontsDir,
      css_fontpath: "../fonts"
    }));
});
// 2) Concat font css files
gulp.task('fontgen-concat-css', ['fontgen'], function() {
  return gulp.src(paths.fontsDir+'*.css')
    .pipe($.concat('font-face.css'))
    .pipe(gulp.dest(paths.fontsForConvert));
});
// 3) Remove original font css files
gulp.task('fontgen-remove-font-css', ['fontgen-concat-css'], function() {
  gulp.src(paths.fontsDir+'*.css')
    .pipe($.clean());
});
// 4) Main task
gulp.task('build-web-fonts', ['fontgen-remove-font-css']);

/*
 * Minify PNG, JPEG, GIF and SVG images
 * */
gulp.task('minify-images', () =>
  gulp.src(paths.imgDir+'*.{png,gif,jpg,jpeg,svg}')
    .pipe($.imagemin())
    .pipe(gulp.dest(paths.imgDir))
);

/*
 * Uses Email Builder to inline css into HTML tags, send tests to Litmus, and send test emails to yourself.
 * */
gulp.task('emailPicCopy', function() {
  return gulp.src(paths.mailDir+'img/**/*.{png,jpg,jpeg}')
    .pipe(gulp.dest(paths.mailDirDist+'img'));
});
gulp.task('emailBuilder', ['emailPicCopy'], function() {
  return gulp.src(paths.mail)
    .pipe($.emailBuilder().build())
    .pipe(gulp.dest(paths.mailDirDist));
});

//=============================================
//                DEVELOPMENT TASKS
//=============================================

/*
 * The 'serve' task serve the dev environment.
 * */
gulp.task('serve', ['styles:custom'], () => {
  browserSync({
    port: 8000,
    server: {
      baseDir: paths.app
    },
    notify: false,
    open: false
  });

  gulp.watch([paths.html], browserSync.reload);

  gulp.watch([paths.iconsForSprite], ['sprite', browserSync.reload]);

  gulp.watch([paths.svgForFont], ['iconfont', browserSync.reload]);

  gulp.watch([paths.fonts], browserSync.reload);

  gulp.watch([paths.scss], ['styles:custom', browserSync.reload]);

  gulp.watch([paths.js], browserSync.reload);

  gulp.watch([paths.img], browserSync.reload);
});

gulp.task('serve:mail', () => {
  browserSync({
    port: 8000,
    server: {
      baseDir: paths.mailDir
    },
    notify: false,
    open: false
  });

  gulp.watch([paths.mail], browserSync.reload);

  gulp.watch([paths.mailCss], browserSync.reload);
});

gulp.task('default', ['serve']);