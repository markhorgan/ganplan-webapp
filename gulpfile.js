const gulp = require('gulp');
const config = require('./gulp.json');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const browserSync = require('browser-sync').create();
const parcel = require('gulp-parcel');

gulp.task('scss', function() {
    return gulp.src(`${config.src}/scss/**/*.scss`)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(`${config.dest}/css`))
        .pipe(browserSync.stream());
});

gulp.task('js', function() {
    return gulp.src(`${config.src}/js/index.js`, {read: false})
        .pipe(parcel())
        .pipe(gulp.dest(`${config.dest}/js`))
        .pipe(browserSync.stream());
});

gulp.task('watch', function() {
    browserSync.init({
        proxy: `http://localhost:5000`
    });

    gulp.watch(`${config.src}/scss/**/*.scss`, gulp.series('scss'));
    gulp.watch(`${config.src}/js/**/*.js`, gulp.series('js'));
});

gulp.task('watch-scss', function() {
    gulp.watch(`${config.src}/scss/**/*.scss`, gulp.series('scss'));
});

gulp.task('build', gulp.series(['scss', 'js']));

gulp.task('default', gulp.series('watch'));

