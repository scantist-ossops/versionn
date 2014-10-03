/**
 * versionn
 * 
 * @copyright (C) 2014- commenthol
 * @license MIT
 */

'use strict';

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  semver = require('semver');

// version pattern in files
var VERSION = /\bVERSION\s*=\s*(['"])([^]*)(?=\1)(\1)/;
// allowed semver inc commands
var CMDS = /^(premajor|preminor|prepatch|prerelease|major|minor|patch|pre)$/;

/**
 * Constructor
 */
function Version (file, options) {
  if (! (this instanceof Version) ){
    return new Version(file, options);
  }
  this.file = file;
  this.options = options || {};
  this.version = this.options.version;
  this.cmd = this.options.cmd || 'patch';
  this.data = null;
  
  if (path.basename(this.file) === 'VERSION') {
    this.options.type = 'VERSION';
  }
}

Version.CMDS = CMDS;

/**
 * read and extract version
 */
Version.prototype.extract = function(cb) {
  var self = this,
      version;
  self.readFile(function(err, data){
    if (err) {
      cb && cb(err);
    }
    else {
      self._extract(data);
      cb && cb(err, self.version);
    }
  });
};

/**
 * extract version information
 */
Version.prototype._extract = function(data) {
  var self = this,
    ver,
    t;

  if (typeof data === 'object') {
    ver = data.version;
  }
  else if (self.options.type === 'VERSION') {
    ver = data.trim();
  }
  else {
    t = VERSION.exec(data);
    if (t && t.length === 4) {
      ver = t[2];
    }
  }
  if (semver.valid(ver)) {
    self.version = ver;
  }
}; 

/**
 * set a new version
 * @param {string} version - needs to be a semver version number
 * @return {Boolean} - true if version is valid and set
 */
Version.prototype.setVersion = function(version) {
  if (semver.valid(version)) { 
    this.version = version;
    return true;
  }
  return false;
};

/**
 * increment version with semver
 * @param {String} cmd - a valid semver command
 * @return {String} - incremented version string or `undefined`
 */
Version.prototype.inc = function(cmd) {
  var sv = semver.parse(this.version, true);

  cmd = cmd || this.cmd;
  
  if (sv && cmd && Version.CMDS.test(cmd)) { 
    sv.inc(cmd); // throws!!
    this.version = sv.toString();
    return this.version;
  }
  return;  
};

/**
 * change multiple files version
 * @param {Array} files
 * @param {String} version
 * @param {Function} cb - callback(err) - {Array} err - array of errors
 */
Version.changeFiles = function(files, version, cb) {
  var err = [];
  
  async.eachLimit(files, 5, 
    function(file, _cb){
      var v = new Version(file, {version: version});
      v.change(function(_err){
        if (_err) {
          err.push(file);
        }
        _cb();
      });
    }, function(){
      cb(err);
    }
  );
};

/**
 * change version
 */
Version.prototype.change = function(cb) {
  var self = this;
  
  self.readFile(function(err, data){
    if (err) {
      cb(err);
      return;
    }
    data = self._change(data);
    self.writeFile(data, cb);
  });
};

/**
 * change version information
 */
Version.prototype._change = function(data) {
  var self = this;

  if (typeof data === 'object') {
    if (data.version) {
      data.version = self.version;  
    }
  }
  else if (self.options.type === 'VERSION') {
    data = self.version;
  }
  else {
    data = data.replace(VERSION, function(){
      return 'VERSION = "'+ self.version + '"';
    });
  }
  return data;
}; 

/**
 * read file
 */
Version.prototype.readFile = function(cb) {
  var self = this;
  fs.readFile(self.file, function(err, data) {
    if (err) {
      cb && cb(err);
    }
    else {
      data = data.toString();
      if (path.extname(self.file) === ".json") {
        try {
          data = JSON.parse(data);
        }
        catch(e) {
          console.error(e); // TODO
        }
      }
      cb && cb(null, data);
    }
  });
};

/**
 * write file back
 */
Version.prototype.writeFile = function(data, cb) {
  if (typeof data === 'object') {
    data = JSON.stringify(data, null, 2);
  }
  fs.writeFile(this.file, data, cb);
};

module.exports = Version;
