/**
 * versionn
 *
 * @copyright (C) 2014- commenthol
 * @license MIT
 */

'use strict';

/* global describe, it, before, beforeEach */

var assert = require('assert'),
		async = require('async'),
		sh = require('shelljs');

var Version = require('../lib/index');

var L = console.log; // TODO

describe ('#Version', function(){

	it ('construct', function(){
		var v = new Version(__dirname + "/fixtures/package.json");
		assert.ok(v instanceof Version);
	});

	it ('construct without new', function(){
		var v = Version(__dirname + "/fixtures/package.json"); // jshint ignore:line
		assert.ok(v instanceof Version);
	});

	it ('setVersion', function(){
		var v = new Version(__dirname + "/fixtures/package.json");
		v.setVersion('0.0.0');
		assert.equal(v.version, '0.0.0');
	});

	it ('setVersion with bad semver', function(){
		var v = new Version(__dirname + "/fixtures/package.json");
		v.setVersion('0a0.0');
		assert.equal(v.version, undefined);
	});

	it ('inc', function(done){
		var v = new Version(__dirname + "/fixtures/package.json");
		v.extract(function(err){
			v.inc('patch');
			assert.equal(v.version, '0.3.7');
			done();
		});
	});

	it ('inc with bad semver command', function(done){
		var v = new Version(__dirname + "/fixtures/package.json");
		v.extract(function(err){
			v.inc('patchit');
			assert.equal(v.version, '0.3.6');
			done();
		});
	});

	it ('changefiles with undefined version', function(done){
		var v = new Version(__dirname + "/fixtures/notthere.json");
		Version.changeFiles([], undefined, function(err){
			assert.equal(err.message, 'version is undefined');
			done();
		});
	});
});


describe ('readFile', function(){

	it ('extract with error ', function(done){
		var v = new Version(__dirname + "/fixtures/notthere.json");
		v.extract(function(err){
			assert.equal(err.code, 'ENOENT');
			done();
		});
	});

	it ('extract from bad json file ', function(done){
		var v = new Version(__dirname + "/fixtures/packagebad.json");
		v.extract(function(err){
			assert.equal(err.message, 'Unexpected string');
			done();
		});
	});

	it ('package.json', function(done){
		var v = new Version(__dirname + "/fixtures/package.json");
		v.extract(function(err, version){
			assert.equal(version, '0.3.6');
			done();
		});
	});

	it ('VERSION', function(done){
		var v = new Version(__dirname + "/fixtures/VERSION");
		v.extract(function(err, version){
			assert.equal(version, '1.0.3-12');
			done();
		});
	});

	it ('file.js', function(done){
		var v = new Version(__dirname + "/fixtures/file.js");
		v.extract(function(err, version){
			assert.equal(version, '5.0.23');
			done();
		});
	});

});

describe ('change files', function(){

	before(function(done){
		sh.cp('-f', __dirname + '/fixtures/*', __dirname + '/tmp/');
		done();
	});

	it ('change with error', function(){
		var v = new Version(__dirname + "/fixtures/notthere.json");
		v.setVersion('0.0.1');
		v.change(function(err){
			assert.equal(err.code, 'ENOENT');
		});
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

describe ('change files with modifier', function(){

	before(function(done){
		sh.cp('-f', __dirname + '/fixtures/*', __dirname + '/tmp/');
		done();
	});

	it ('change package.json using --same', function(done){
		var v = new Version(__dirname + "/tmp/package.json");
		v.extract(function(err, version){
			assert.equal(version, '0.3.6');
			if (v.inc('same')) {
				v.change(function(err){
					assert.equal(err, null);
					v.extract(function(err, version){
						assert.equal(version, '0.3.6');
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

	beforeEach(function(done){
		sh.cp('-f', __dirname + '/fixtures/*', __dirname + '/tmp/');
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

	it ('from VERSION changes notthere.json', function(done){
		var v = new Version(__dirname + "/tmp/VERSION");
		var files = [ 'VERSION', 'notthere.json', 'package.json', 'file.js' ];

		files = files.map(function(file){
			return __dirname + '/tmp/' + file;
		});

		v.extract(function(err, version){
			assert.equal(version, '1.0.3-12');
			if (v.inc('minor')) {
				Version.changeFiles(files, v.version, function(err){
					assert.equal(err.length, 1);
					async.eachLimit(files, 5,
						function(file, _cb){
							var vv = new Version(file);
							vv.extract(function(err, version){
								if (~file.indexOf('notthere.json')) {
									assert.equal(version, undefined);
								} else {
									assert.equal(version, v.version);
								}
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

	it ('from notthere.json', function(done){
		var v = new Version(__dirname + "/tmp/notthere.json");
		var files = [ 'notthere.json', 'VERSION', 'package.json', 'file.js' ];

		files = files.map(function(file){
			return __dirname + '/tmp/' + file;
		});

		v.extract(function(err, version){
			assert.equal(version, undefined);
			try {
				v.inc('same');
			} catch(e) {
				assert.ok(e.message, 'could not increment');
			}
			done();
		});
	});
});
