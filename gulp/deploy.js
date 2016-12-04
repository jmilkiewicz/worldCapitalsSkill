'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var AWS = require('aws-sdk');
var config = require('config');
var tmp = require('tmp');
var zip = require('gulp-zip');

AWS.config.update(config.get('credentials'));

var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});


function deployToLambda(cb) {
    tmp.tmpName({postfix: '.zip', keep: true}, function _tempNameGenerated(err, path) {
        if (err) {
            return cb(err);
        }

        gulp.src('build/**/*').
            pipe(zip(path)).
            pipe(gutil.buffer(function(err, files) {
                if (err) {
                    return cb(err);
                }

                if(files && files.length > 0){
                    var params = {
                        FunctionName: config.get('functionName'),
                        ZipFile: files[0].contents
                    };

                    gutil.log('Uploading Zip file [%s] ...', formatBytes(files[0].contents.length));

                    lambda.updateFunctionCode(params, cb);
                } else {
                    cb(new Error("No zip file found or empty."));
                }
            }));
    });
}

module.exports = deployToLambda;

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
