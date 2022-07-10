const { src, dest, series, parallel, watch } = require('gulp');
const gulp = require('gulp');
const rename = require('gulp-rename');

//ejs
const ejs = require('gulp-ejs');
const replace = require('gulp-replace');
const fs = require('fs'); //Node.jsでファイルを操作するための公式モジュール

//sass
const sass = require('gulp-dart-sass');
const plumber = require('gulp-plumber');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const mq = require('gulp-group-css-media-queries');
const sourcemaps = require('gulp-sourcemaps');
const cssDeclarationSorter = require('css-declaration-sorter');

//js
const babel = require('gulp-babel');

//browser sync
const browserSync = require('browser-sync').create();

//パス指定
const paths = {
  ejs: {
    src: ['./src/ejs/**/*.ejs', '!./src/ejs/**/_*.ejs'],
    watch: './src/ejs/**/*.ejs',
    dist: './dist/',
  },
  style: {
    src: ['./src/sass/**/*.scss'],
    dist: './dist/assets/css/',
  },
  scripts: {
    src: ['./src/js/**/*.js', './src/js/**/lib/*.js'], //外部のライブラリ
    dist: './dist/assets/js/',
  },
};

//ejsコンパイル
const ejsCompile = (done) => {
  const json_path = './ejs-config.json';
  const json = JSON.parse(fs.readFileSync(json_path));

  src(paths.ejs.src)
    .pipe(ejs(json))
    .pipe(plumber())
    .pipe(rename({ extname: '.html' }))
    .pipe(dest(paths.ejs.dist));

  done();
};

//sassのコンパイル
const sassCompile = (done) => {
  src(paths.style.src)
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(postcss([autoprefixer({})]))
    .pipe(plumber())
    .pipe(mq())
    .pipe(postcss([cssDeclarationSorter({ order: 'alphabetical' })]))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(paths.style.dist));
  done();
};

//jsコンパイル
const jsCompile = (done) => {
  src(paths.scripts.src)
    .pipe(plumber())
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(rename('common.js'))
    .pipe(dest(paths.scripts.dist));
  done();
};

//watch
const watchFiles = (done) => {
  watch(paths.ejs.watch, series(ejsCompile, browserReloadFunc));
  watch('./src/sass/**/*.scss', series(sassCompile, browserReloadFunc));
  watch(paths.scripts.src, series(jsCompile, browserReloadFunc));

  done();
};

// ローカルサーバー起動
const browserSyncFunc = (done) => {
  browserSync.init({
    //デフォルトの connected のメッセージ非表示
    notify: false,
    server: {
      baseDir: './',
      index: './dist/index.html',
      files: './**',
    },
    // startPath: './dist/index.html',
    reloadOnRestart: true,
  });
  done();
};

// ブラウザ自動リロード
const browserReloadFunc = (done) => {
  browserSync.reload();
  done();
};

//ecxports
exports.default = series(
  ejsCompile,
  watchFiles,
  browserSyncFunc,
  sassCompile,
  jsCompile
);
