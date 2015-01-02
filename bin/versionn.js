#!/usr/bin/env node

/**
 * versionn CLI
 *
 * @copyright (C) 2014- commenthol
 * @license MIT
 *
 * @credits Christopher Jeffrey <https://github.com/chjj/marked>
 *   Code snippets taken from marked project (MIT license)
 */

'use strict';

var VERSION = "0.0.4";

var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    child = require('child_process'),
    Version = require('../lib/index');

function help() {
	var options = {
		cwd: process.cwd(),
		env: process.env,
		setsid: false,
		customFds: [0, 1, 2]
	};

	child.spawn('man',
		[__dirname + '/../man/versionn.1'],
		options);
}

function gittag(version, options, callback) {
	var _options = {
		cwd: options.dir,
		env: process.env,
		setsid: false,
		customFds: [0, 1, 2]
	};
	var cmd = 'git tag ';
	if (options.untag) {
		cmd = 'git tag -d ';
	}

	fs.exists(path.resolve(_options.cwd, '.git'), function(exists){
		if (exists) {
			child.exec(cmd + 'v' + version,
				_options,
				function(err, stdout, stderr){
					if (err) {
						return callback(err);
					}
					callback();
				});
		}
		else {
			callback(new Error('No .git directory in ' + _options.cwd));
		}
	});
}

function main(argv, callback) {
	var files = [],
		options = {},
		arg,
		opt;

	function getarg() {
		var arg = argv.shift();

		if (arg.indexOf('--') === 0) {
			// e.g. --opt
			arg = arg.split('=');
			if (arg.length > 1) {
				// e.g. --opt=val
				argv.unshift(arg.slice(1).join('='));
			}
			arg = arg[0];
		} else if (arg[0] === '-') {
			if (arg.length > 2) {
				// e.g. -abc
				argv = arg.substring(1).split('').map(function(ch) {
					return '-' + ch;
				}).concat(argv);
				arg = argv.shift();
			} else {
				// e.g. -a
			}
		} else {
			// e.g. foo
		}

		return arg;
	}

	argv.shift();
	argv.shift();

	while (argv.length) {
		arg = getarg();
		switch (arg) {
			case '-h':
			case '--help': {
				return help();
			}
			case '-i':
			case '--info': {
				options.info = true;
				break;
			}
			case '-d':
			case '--dir': {
				arg = getarg();
				options.dir = arg;
				break;
			}
			case '-e':
			case '--extract': {
				arg = getarg();
				options.extract = true;
				options.extractFile = arg;
				break;
			}
			case '-t':
			case '--tag': {
				options.tag = true;
				break;
			}
			case '-u':
			case '--untag': {
				options.untag = true;
				break;
			}
			case '--version': {
				console.log(VERSION);
				return;
			}
			default: {
				if (arg.indexOf('-') === 0) {
					arg = arg.replace(/^-+/, '');
					if (!Version.CMDS.test(arg)) {
						continue;
					}
					options.cmd = arg;
				} else {
					files.push(arg);
				}
				break;
			}
		}
	}


	if (files.length === 0) {
		options.defaultFiles = true;
		files = main.files;
	}
	files = files.map(function(file){
		options.dir = options.dir || process.cwd();
		return path.resolve(options.dir, file);
	});

	async.filter(files, fs.exists, function(files){
		if (files.length > 0) {
			options.extractFile = options.extractFile ?
														path.resolve(options.dir, options.extractFile) :
														files[0];
			fs.exists(options.extractFile, function(exists) {
				if (!exists) {
					console.error('Error: No file to extract version from: '+ options.extractFile +'!');
					return callback(null, 1);
				}
				var v = new Version(options.extractFile);
				v.extract(function(err, version) {
					if (err) {
						console.error('Error: No version info found in ' + options.extractFile);
						return callback(null, 1);
					} else if (options.info) {
						console.log(version);
						callback();
					} else if (options.tag || options.untag) {
						gittag(v.version, options, function(err){
							if (err) {
								console.error('Error: git tag ' + err.message);
								return callback(null, 1);
							}
							callback();
						});
					} else {
						if (! (options.extract === true && options.cmd === undefined)) {
							options.cmd = options.cmd || 'patch';
							v.inc(options.cmd);
						}
						Version.changeFiles(files, v.version, function(err) {
							if (err.length > 0) {
								err.forEach(function(f){
									console.error('Error: Version not set in ' + f);
								});
								return callback(null, 1);
							}
							callback();
						});
					}
				});
			});
		}
		else {
			console.error('Error: No files found in '+ options.dir +'!');
			callback(null, 1);
		}
	});

}

main.files = [ 'VERSION', 'package.json', 'bower.json', 'component.json' ];


/**
 * Expose / Entry Point
 */
if (!module.parent) {
	process.title = 'versionn';
	main(process.argv.slice(), function(err, code) {
		if (err) throw err;
		return process.exit(code || 0);
	});
} else {
	module.exports = main;
}

