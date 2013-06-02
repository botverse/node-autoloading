'use strict';

var toString = Object.prototype.toString
  , keys = Object.keys
  , fs   = require('fs')
  , glob = require('glob')
  , path = require('path')
    ;

module.exports = solver;

/**
 * Main module function
 */
function solver(dir, done) {
  var total = 0
    , cache = {}
    , dirs = getRoots(dir)
    , libs = getLibs(dirs)
      ;

  total += keys(libs).length;

  /**
   * Runs after process files and libraries
   */
  function finish() {
    if ( --total > 0 )
      return;

    keys(libs).forEach(function(lib) {
      buildLib(lib);
    });

    feed(done);
    done(libs);
  }

  /**
   * Pass from the cache to the namespaces
   *
   * @param {string} lib
   */
  function buildLib(lib) {
    for ( var name in cache[lib] ) {
      var chunks = name.split('.')
        , current = libs[lib]
          ;

      feed(cache[lib][name]);

      chunks.forEach(function(chunk, i, a) {
        // last one
        if ( i >= a.length - 1 )
          current[chunk] = cache[lib][name];

        // no previous object
        if ( typeof current[chunk] === 'undefined' )
          current[chunk] = {};

        current = current[chunk];
      });
    }
  }

  /**
   * Put references to all libraries
   *
   * @param {string} pack
   */
  function feed(pack) {
    for ( var i in libs ) {
      pack[i] = libs[i];
    }
  }

  /**
   * Process every file in the library
   *
   * @param {string} file
   * @param {int} i index
   * @param {Array} a the array
   */
  function process(file, i, a) {
    var lib = a.lib
      , fp = file.substr(dirs[lib].length)
      , ns = namespace(fp)
        ;

    fs.stat(file, function(err, stat) {
      var re = file[0] == '/'
        ? file
        : './' + file
          ;

      if ( stat.isFile() )
        cache[lib][ns] = require(re);

      finish();
    });
  }

  /**
   * Search for files for each library
   *
   * @param {string} lib library
   */
  function doGlob(lib) {
    cache[lib] = {};

    glob(dirs[lib] + '/**/*', { nosort: true }, function(err, all){
      total += all.length;
      all.lib = lib;
      all.forEach(process);
      finish();
    });
  }

  // start
  for ( var i in dirs )
    doGlob(i);

  return libs;
}

/**
 * Guess user wishes
 *
 * @param dir
 * @returns {*}
 */
function getRoots(dir) {
  if( typeof dir == 'string' )
    dir = [dir];

  if ( toString.call(dir) === '[object Array]' ) {
    dir = dir.reduce(function(a, b) {
      var name = b.replace(/\/$/, '').split('/').pop();
      a[name] = b;
      return a;
    }, {});
  }

  return dir;
}

/**
 * Get the libraries from the dirs
 *
 * @param dirs
 * @returns {*}
 */
function getLibs(dirs) {
  return  keys(dirs).reduce(function(a, b) {
    a[b] = {};
    return a;
  }, {});
}

/**
 * Get a namespace from a file name
 *
 * @param file
 * @returns {string}
 */
function namespace(file) {
  var name = file.replace(/^\//, '')
    , ext = path.extname(file)
      ;
  return name.substr(0, name.length - ext.length);
}