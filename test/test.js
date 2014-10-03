/**
 * versionn
 * 
 * @copyright (C) 2014- commenthol
 * @license MIT
 */

'use strict';

/* global describe, it */

var assert = require('assert'),
    async = require('async'),
    sh = require('shelljs');

var Version = require('../lib/index')

var L = console.log; // TODO

describe ('readFile', function(){

  it ('package.json', function(done){
    var v = new Version(__dirname + "/assets/package.json");
    v.extract(function(err, version){
      assert.equal(version, '0.3.6');
      done();
    });
  });
  
  it ('VERSION', function(done){
    var v = new Version(__dirname + "/assets/VERSION");
    v.extract(function(err, version){
      assert.equal(version, '1.0.3-12');
      done();
    });
  });

  it ('file.js', function(done){
    var v = new Version(__dirname + "/assets/file.js");
    v.extract(function(err, version){
      assert.equal(version, '5.0.23');
      done();
    });
  });

});

describe ('change files', function(){

  before(function(done){
    sh.cp('-f', __dirname + '/assets/*', __dirname + '/tmp/');
    done();
  });

  it ('package.json', function(done){
    var v = new Version(__dirname + "/tmp/package.json");
    v.extract(function(err, version){
      assert.equal(version, '0.3.6');
      if (v.inc()) {
        v.change(function(err){
          assert.equal(err, null);
          v.extract(function(err, version){
            assert.equal(version, '0.3.7');
            done();
          });
        });
      }
      else {
        assert.ok(false, 'could not increment');
      }
    });
  });
  
  it ('VERSION', function(done){
    var v = new Version(__dirname + "/tmp/VERSION");
    v.extract(function(err, version){
      assert.equal(version, '1.0.3-12');
      if (v.inc('minor')) {
        v.change(function(err){
          assert.equal(err, null);
          v.extract(function(err, version){
            assert.equal(version, '1.1.0');
            done();
          });
        });
      }
      else {
        assert.ok(false, 'could not increment');
      }
    });
  });

  it ('file.js', function(done){
    var v = new Version(__dirname + "/tmp/file.js");
    v.extract(function(err, version){
      assert.equal(version, '5.0.23');
      if (v.inc('preminor')) {
        v.change(function(err){
          assert.equal(err, null);
          v.extract(function(err, version){
            assert.equal(version, '5.1.0-0');
            done();
          });
        });
      }
      else {
        assert.ok(false, 'could not increment');
      }
    });
  });

});

describe ('change multiple files', function(){

  before(function(done){
    sh.cp('-f', __dirname + '/assets/*', __dirname + '/tmp/');
    done();
  });

  it ('from VERSION', function(done){
    var v = new Version(__dirname + "/tmp/VERSION");
    var files = [ 'VERSION', 'package.json', 'file.js' ];
    
    files = files.map(function(file){
      return __dirname + '/tmp/' + file;
    });
    
    v.extract(function(err, version){
      assert.equal(version, '1.0.3-12');
      if (v.inc('minor')) {
        Version.changeFiles(files, v.version, function(err){
          assert.equal(err.length, 0);
          async.eachLimit(files, 5,
            function(file, _cb){
              var vv = new Version(file);
              vv.extract(function(err, version){
                assert.equal(version, v.version);
                _cb();
              });
            },function(_err){
              done();
            }); 
        });
      }
      else {
        assert.ok(false, 'could not increment');
      }
    });
  });
  
});
