'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var AWS = require('aws-sdk');
var config = require('config');
var tmp = require('tmp');
var zip = require('gulp-zip');


function buildFile(cb) {
  tmp.tmpName({ postfix: '.zip', keep: true }, function _tempNameGenerated(err, path) {
    if (err) {
      return cb(err);
    }

    gulp.src('build/**/*').pipe(zip(path)).pipe(gutil.buffer(function (err, files) {
      if (err) {
        return cb(err);
      }
      if (files && files.length > 0) {
        cb(null, files[0].contents);
      } else {
        cb(new Error("No zip file found or empty."));
      }
    }));
  });
};


function deployAll(cb) {
  buildFile(function (err, file) {
    if (err) {
      return cb(err)
    }

    var regions = config.get('region');
    Promise.all(regions.map(deployAsPromise.bind(null, file))).then(function () {
      cb();
    }, function (err) {
      cb(err)
    });

  })

}


function deployAsPromise(file, region) {
  return new Promise(function (resolve, reject) {
    deployToLambda(file, region, function (err, sth) {
      if (err) {
        reject(err)
      } else {
        resolve(sth);
      }
    })
  });
}


function deployToLambda(file, region, cb) {

  var params = {
    FunctionName: config.get('functionName'),
    ZipFile: file
  };

  gutil.log('Uploading to %s Zip file [%s] ...', region, formatBytes(file.length));

  var lambdaParams = {
    apiVersion: '2015-03-31',
    credentials: new AWS.Credentials(config.get('credentials')),
    region: region
  };

  var lambda = new AWS.Lambda(lambdaParams);

  lambda.updateFunctionCode(params, cb);
}

module.exports = deployAll;

/**
 * Helper function to convert bytes to KB, MB and so on...
 *
 * @param bytes
 * @param decimals
 * @returns {*}
 */
function formatBytes(bytes,decimals) {
  if(bytes === 0) {
    return '0 Byte';
  }
  var k = 1000;
  var dm = decimals + 1 || 3;
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}
