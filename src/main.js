import Vue from 'vue'
import App from './App.vue'

export function create(options) {
	const DEFAULT_APP_NAME = "go-comment";
	const DEFAULT_CLIENT_ID = "Iv1.33248dc04cddf6d1";
	const DEFAULT_SERVER = "http://gocomment.mikesu.net";
	options.app_name = options.app_name || DEFAULT_APP_NAME;
  options.client_id = options.client_id || DEFAULT_CLIENT_ID;
	options.server_url = options.server_url || DEFAULT_SERVER;
  options.pid = options.pid || options.title;
	new Vue({
	  el: options.el,
	  template: '<App v-bind="options"/>',
	  components: { App },
	  data: { options : options}
	})
}
