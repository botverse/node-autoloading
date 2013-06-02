var libs = require('./../solver')({
  lib: 'test/first',
  foo: 'test/second'
}, boot);

function boot(){
  libs.lib.more('ayyyyyyy');
}
