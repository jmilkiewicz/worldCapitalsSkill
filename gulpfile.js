'use strict';

var gulp = require('gulp');
var del = require('del');
var install = require("gulp-install");
var lastCommitId = require('ggit').lastCommitId;
var fs = require('fs');

const buildDir = 'build';

gulp.task('build', ['clean'], function () {
  if (process.version !== 'v4.3.2') {
    throw new Error('Please execute the building of Lambda functions on node version v4.3.2');
  } else {
    return gulp.src(['app/**/*.*', 'package.json'])
      .pipe(gulp.dest(buildDir))
      .pipe(install({ production: true }));
  }
});

gulp.task('clean', function (cb) {
  del([`${buildDir}/**`]).then(()=>cb());
});

gulp.task('dumpGitId',['build'], function (cb) {
  lastCommitId().then(function (commitId) {
    fs.writeFile(`${buildDir}/build.json`, JSON.stringify({ commitId: commitId }, null, 2), 'utf8', cb);
  });
});

gulp.task('deploy', ['build','dumpGitId'], require('./gulp/deploy'));
