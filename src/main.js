import Vue from 'vue'
import App from './App.vue'

export function create(options) {
	new Vue({
	  el: options.el,
	  template: '<App v-bind="options"/>',
	  components: { App },
	  data: { options : options}
	})
}
