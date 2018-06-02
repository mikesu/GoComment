import Vue from 'vue'
import App from './App.vue'

export function create(options) {
	const DEFAULT_SERVER = "http://gocomment.mikesu.net"
	const DEFAULT_CLIENT_ID = "Iv1.33248dc04cddf6d1"
	options.server_url = options.server_url || DEFAULT_SERVER
    options.client_id = options.client_id || DEFAULT_CLIENT_ID
    options.pid = options.pid || options.title
	new Vue({
	  el: options.el,
	  template: '<App v-bind="options"/>',
	  components: { App },
	  data: { options : options}
	})
}
