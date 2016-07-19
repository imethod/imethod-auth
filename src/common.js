'use strict';
let Vue = require('vue');
let VueResource = require('vue-resource');
let VueViewComponents = require('vue-view-components');

Vue.config.debug = true;
Vue.use(function (vue) {
  vue.prototype.$tools = require('./tools');
  vue.prototype.$auth = require('./auth');
  vue.prototype.$config = require('./config');
});


//layout
Vue.use(VueResource);
Vue.use(VueViewComponents());
//component

//directive


//filter

Vue.filter('equal', function (v1, v2) {
  return v1 == v2;
});

Vue.filter('gt0', function (arr) {
  let a = arr || 0;
  return a > 0;
});

export {Vue};

