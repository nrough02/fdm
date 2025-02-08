var gulp = require('gulp');
var fs = require('fs');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

GULP_SKIP_JS_MINIFY = process.env.GULP_SKIP_JS_MINIFY === 'true';
var jsFiles = [
    'src/js/webextension.js',
    'src/js/utils.js',
    'src/js/misc.js',
    'src/js/RequestsManager.js',
    'src/js/cookiemgr.js',
    'src/js/fdmbhtasks.js',
    'src/js/nativehostmgr.js',
    'src/js/fdmbhutils.js',
    'src/js/contextmenumgr.js',
    'src/js/fdmcontextmenumgr.js',
    'src/js/dldsinterceptmgr.js',
    'src/js/fdmdldsinterceptmgr.js',
    'src/js/netwrkmon.js',
    'src/js/fdmnetwrkmon.js',
    'src/js/settingsbghlpr.js',
    'src/js/tabsmanager.js',
    'src/js/installationmgr.js',
    'src/js/fdmscheme.js',
    'src/js/fdmextension.js',
    'src/js/main.js',
];
var jsDest = './dist/js/';

gulp.task('scripts', function () {
    let task = gulp.src(jsFiles)
        .pipe(concat('service_worker.js'))

    return task.pipe(gulp.dest(jsDest));
});