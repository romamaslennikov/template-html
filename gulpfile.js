'use strict';

//=============================================
//               DEPENDENCIES
//=============================================

/**
 * Load required dependencies.
 */
let buffer = require('vinyl-buffer'),
  runSequence = require('run-sequence'),
  runTimestamp = Math.round(Date.now()/1000),
  del = require('del'),
  gulp = require('gulp'),
  browserSync = require('browser-sync');

/**
 * Load Gulp plugins listed in 'package.json' and attaches them to the `$` variable.
 */
let $ = (require('gulp-load-plugins'))();

/**
 * Declare variables that are use in gulpfile.js
 */
let log = $.util.log,
  COLORS = $.util.colors,
  src = './src/', // development
  build = './build/', // build for production
  fontName = 'Icons', // name icons font
  cssClassPrefix = 'i_'; // start css class for font icons

//=============================================
//               UTILS FUNCTIONS
//=============================================
let notifyOnError = () => {
  return $.notify.onError({
    message: 'Error: <%= error.message %>',
    sound: true
  });
};

//=============================================
//               DECLARE PATHS
//=============================================
let paths = {
  app: src,
  pug: [src+'pug/**/*.pug', '!'+src+'pug/**/_*.pug'],
  html: src+'**/*.html',
  css: src+'css/*.css',
  cssDir: src+'css/',
  scss: [src+'scss/**/*.*ss'],
  scssDir: src+'scss/',
  js: src+'js/**/*.js',
  jsDir: src+'js/',
  iconsForSprite: src+'img/icons-for-sprite/**/*.png',
  iconsForSpriteDir: src+'img/icons-for-sprite/',
  img: src+'img/**/*.{png,gif,jpg,jpeg,svg,ico}',
  imgDir: src+'img/',
  svgForFont: src+'img/svg-for-font/**/*.svg',
  svgForFontDir: src+'img/svg-for-font/',
  fonts: src+'fonts/**/*.{eot,svg,ttf,woff,woff2}',
  fontsDir: src+'fonts/',
  fontsForConvert: src+'fonts/.tmp/*.{ttf,otf}',
  fontsDirVendor: 'jspm_packages/**/*.{eot,svg,ttf,woff,woff2}',
  mail: './mail_html/*.html',
  mailCss: './mail_html/*.css',
  mailDir: './mail_html/',
  mailDirDist: './mail_html/dist/',
  build: {
    basePath: build,
    fonts: build+'fonts/',
    images: build+'img/',
    styles: build+'css/',
    scripts: build+'js/'
  }
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
 * Compile pug files into the html.
 */
gulp.task('pug', 'Compile pug files into the html', () => {
  return gulp.src(paths.pug)
  .pipe($.pug({
    pretty: true
  }))
  .pipe(gulp.dest(paths.app));
});

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
    .pipe($.concat('main.css'))
    .pipe($.sourcemaps.write('../../maps'))
    .pipe(gulp.dest(paths.cssDir));
});

/**
 * Compile vendor styles into the vendor.css
 */
gulp.task('styles:vendor', 'Compile vendor styles into the vendor.css', () => {
  return gulp.src([
    ''
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
    ''
  ]).on('error', notifyOnError())
    .pipe($.concat('vendor.js'))
    .pipe($.uglify())
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
      //retinaSrcFilter: paths.iconsForSpriteDir+'*@2x.png',
      imgName: '../img/sprite.png',
      //retinaImgName: '../img/sprite@2x.png',
      cssName: '_sprite.scss',
      cssTemplate: src+'_sprite_template.css.tmpl',
      padding: 2,
      algorithm: 'top-down',
      algorithmOpts: {sort: false}
    }))
    .on('error', notifyOnError());
  spriteData.img
    .pipe(gulp.dest(paths.imgDir));
  spriteData.css
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
      path: src+'_icons_template.css.tmpl',
      targetPath: '../scss/_icons.scss',
      fontPath: '../fonts/'
    }))
    .on('error', notifyOnError())
    .pipe($.iconfont({
      fontName: fontName,
      prependUnicode: true, // recommended option
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
      timestamp: runTimestamp // recommended to get consistent builds when watching files
    }))
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.fontsDir));
});

/*
 * Create web fonts
 * */
// 1) Create web fonts
gulp.task('fontgen', () => {
  return gulp.src(paths.fontsForConvert)
    .pipe($.fontgen({
      dest: paths.fontsDir,
      css_fontpath: "../fonts"
    }))
    .on('error', notifyOnError());
});
// 2) Concat font css files
gulp.task('fontgen-concat-css', ['fontgen'], () => {
  return gulp.src(paths.fontsDir+'*.css')
    .pipe($.concat('font-face.css'))
    .pipe(gulp.dest(paths.fontsForConvert));
});
// 3) Remove original font css files
gulp.task('fontgen-remove-font-css', ['fontgen-concat-css'], () => {
  return gulp.src(paths.fontsDir+'*.css')
    .pipe($.clean());
});
// 4) Main task
gulp.task('build-web-fonts', ['fontgen-remove-font-css']);


/*
 * Uses Email Builder to inline css into HTML tags, send tests to Litmus, and send test emails to yourself.
 * */
gulp.task('emailPicCopy', () => {
  return gulp.src(paths.mailDir+'img/**/*.{png,jpg,jpeg}')
    .pipe(gulp.dest(paths.mailDirDist+'img'));
});
gulp.task('emailBuilder', ['emailPicCopy'], () => {
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
  log(COLORS.blue('********** RUNNING SERVER **********'));
  browserSync({
    port: 8000,
    server: {
      baseDir: paths.app
    },
    notify: false,
    open: false,
    files: [paths.html, paths.scss, paths.js]
  });

  gulp.watch([paths.html], browserSync.reload);

  gulp.watch([paths.iconsForSprite], ['sprite', browserSync.reload]);

  gulp.watch([paths.svgForFont], ['iconfont', browserSync.reload]);

  gulp.watch([paths.fonts], browserSync.reload);

  gulp.watch([paths.scss], ['styles:custom', browserSync.reload]);

  gulp.watch([paths.js], browserSync.reload);

  gulp.watch([paths.img], browserSync.reload);

  gulp.watch([paths.pug], ['pug', browserSync.reload]);
});

gulp.task('serve:prod', ['build'], () => {
  log(COLORS.blue('********** RUNNING SERVER:PROD **********'));
  browserSync({
    port: 8000,
    server: {
      baseDir: paths.build.basePath
    },
    notify: false,
    open: true
  });
});

gulp.task('serve:mail', () => {
  log(COLORS.blue('********** RUNNING SERVER:MAIL **********'));
  browserSync({
    port: 8000,
    server: {
      baseDir: paths.mailDir
    },
    notify: false,
    open: false,
    files: [src + "css/*.css", src + "*.html", src + "js/**/*.js"]
  });

  gulp.watch([paths.mail], browserSync.reload);

  gulp.watch([paths.mailCss], browserSync.reload);
});

gulp.task('default', ['serve']);

//=============================================
//              PRODUCTION TASKS
//=============================================

/**
 * The 'clean' task delete 'build' directories.
 */

gulp.task('clean', 'Delete \'build\' directories', (cb) => {
  let files;
  files = [].concat(paths.build.basePath);
  log('Cleaning: ' + COLORS.blue(files));
  return del(files, cb);
});

gulp.task('copy-html', () => {
  return gulp.src(paths.html)
  //.pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.build.basePath))
    .pipe($.size({
      title: 'html'
    }));
});

gulp.task('copy-js', () => {
  return gulp.src(paths.js)
  //.pipe($.uglify())
    .pipe(gulp.dest(paths.build.scripts))
    .pipe($.size({
      title: 'js'
    }));
});

gulp.task('copy-css', () => {
  return gulp.src(paths.css)
    .pipe($.autoprefixer({
      browsers: ['> .01%'],
      cascade: false
    }))
    .pipe($.minifyCss({
      keepSpecialComments: 0
    }))
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.styles))
    .pipe($.size({
      title: 'css'
    }));
});

gulp.task('copy-images', () => {
  return gulp.src([
    paths.img,
    '!' + paths.iconsForSprite,
    '!' + paths.svgForFont
  ])
    .pipe($.image())
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.images))
    .pipe($.size({
      title: 'images'
    }));
});

gulp.task('copy-fonts', () => {
  return gulp.src([
    paths.fonts,
    '!' + paths.fontsForConvert
  ])
    .on('error', notifyOnError())
    .pipe(gulp.dest(paths.build.fonts))
    .pipe($.size({
      title: 'fonts'
    }));
});

gulp.task('build', (callback) => {
  log(COLORS.blue('********** RUNNING BUILD **********'));
  return runSequence(
    'clean',
    ['copy-html',
      'copy-js',
      'copy-css',
      'copy-images',
      'copy-fonts'],
    callback);
});
