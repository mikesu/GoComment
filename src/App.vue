<template>
  <div id="app" >
    <nav class="level is-mobile">
      <div class="level-left">
        <a class="has-text-grey-dark" :href="issue_url" target="_blank">
          {{commentCount}} Comments
        </a>
      </div>
      <div class="level-right">
        <span class="has-text-grey-light has-text-right is-italic is-size-7">
          powered by <a class="has-text-grey-light" href="https://github.com/apps/go-comment" target="_blank">go-comment</a>
        </span>
      </div>
    </nav>
    <article class="media" v-for="comment in comments">
      <figure class="media-left">
        <p class="image is-48x48">
          <a :href="comment.user_url" target="_blank">
            <img :src="comment.avatar">
          </a>
        </p>
      </figure>
      <div class="media-content">
        <div class="level" style="margin-bottom: 5px;">
          <div class="level-left">
            <div class="level-item">
              <strong>{{comment.user}}</strong>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <small>{{comment.updated_at}}</small>
            </div>
          </div>
        </div>
        <div class="content" v-html="comment.content"></div>
      </div>
    </article>
    <nav class="media pagination is-small" v-if="pageCount>1" role="navigation" aria-label="pagination">
      <a class="pagination-previous" v-if="pageIndex>1" @click="loadComments(pageIndex-1)">Prev</a>
      <a class="pagination-previous" v-else disabled>Prev</a>
      <a class="pagination-next" v-if="pageIndex<pageCount" @click="loadComments(pageIndex+1)">Next</a>
      <a class="pagination-next" v-else disabled>Next</a>
      <ul class="pagination-list">
        <li v-for="page in pages">
          <span class="pagination-ellipsis" v-if="page.ellipsis">&hellip;</span>
          <a class="pagination-link button is-current" v-else-if="page.selected" v-bind:class="{'is-loading': loading}" @click="loadComments(page.index)">{{page.content}}</a>
          <a class="pagination-link" v-else @click="loadComments(page.index)">{{page.content}}</a>
        </li>
      </ul>
    </nav>
    <article class="media" v-if="user">
      <figure class="media-left">
        <p class="image is-64x64">
          <a :href="user_url" target="_blank">
            <img :src="avatar">
          </a>
        </p>
      </figure>
      <div class="media-content">
        <div class="field">
          <markdown-editor v-bind:configs="mde_configs" v-model="comment"></markdown-editor>
        </div>
        <div class="field">
            <button class="button" v-on:click="createComment" v-bind:class="{'is-loading': posting}">Post comment</button>
        </div>
      </div>
    </article>
    <div class="media level" v-if="!token">
        <div class="media-content level-item">
          <a class="button is-info" :href="authUrl">Sign in to comment</a>
        </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  import md5 from 'md5';
  import markdownEditor from 'vue-simplemde/src/markdown-editor.vue';
  const API_URL = "https://api.github.com";
  const AUTH_URL = "https://github.com/login/oauth/authorize";
  const PRE_PAGE = 5;
  const TOKEN_KEY = 'go_comment_github_token';
export default {
  name: 'app',
  props: ['owner','repo','pid','title','client_id','server_url','installation_id', 'app_name'],
  data () {
    console.log("data");
    return {
      token: getToken(),
      user: '',
      avatar:'',
      user_url:'',
      comment:'',
      issue_url:'',
      commentCount:0,
      pageCount: 0,
      pageIndex: 1,
      comments : [],
      loading: true,
      posting: false,
      mde_configs:{
        toolbar: ["bold", "italic", "heading", "|",
                  "code", "quote", "unordered-list", "ordered-list", "|",
                  "link", "image", "table", "horizontal-rule", "|",
                  "preview", "guide"],
        placeholder : 'Add a comment...',
        status: false
      }
    }
  },
  computed: {
    authUrl (){
      let authUrl = AUTH_URL+ "?client_id=" + this.client_id;
      authUrl = authUrl + "&redirect_uri=" + this.server_url + "/oauth";
      authUrl = authUrl + "?url=" + window.btoa(getUrl());
      return authUrl
    },
    pages:pages
  },
  created () {
    console.log("created");
    this.loadUser();
    this.loadComments(1);
  },
  methods:{
    loadUser:loadUser,
    loadComments:loadComments,
    listComments:listComments,
    createComment:createComment
  },
  components: {
    markdownEditor
  }
}

function loadUser() {
  console.log(this.token);
  if(this.token){
    let userApiPath = API_URL + '/user';
    let option = {
      headers:{
        'Authorization':'token '+this.token
      }
    };
    axios.get(userApiPath,option).then((response) => {
      console.log(response);
      this.avatar = response.data.avatar_url + '&s=64';
      this.user_url = response.data.html_url;
      this.user = response.data.login
    }).catch((error) => {
      console.log(error);
      this.token = 0;
      cleanToken()
    })
  }
}

function loadComments(pageIndex) {
  let key = this.owner + '/' + this.repo + '/' + this.pid;
  let q = md5(key) + ' in:body repo:' + this.owner + '/' + this.repo + ' author:app/'+ this.app_name +' type:issue';
  let issueApiPath = API_URL + '/search/issues?q=' + encodeURIComponent(q);
  axios.get(issueApiPath).then((response) => {
    console.log(response);
    if(response.data.items.length>0){
      let data = response.data.items[0];
      this.issue_url = data.html_url;
      this.comments_url = data.comments_url;
      this.commentCount = data.comments;
      this.pageCount = Math.ceil(data.comments/PRE_PAGE);
      this.listComments(pageIndex)
    }
  })
}

function listComments(pageIndex){
  this.loading = true;
  this.pageIndex = pageIndex;
  let pageInfo = pageinfo(this.commentCount,pageIndex);
  let option = {
    headers:{
      'Accept':'application/vnd.github.html+json'
    },
    params:{
      page:pageInfo.page,
      per_page:pageInfo.prePage
    }
  };
  console.log(pageInfo);
  axios.get(this.comments_url,option).then((response) =>{
    console.log(response);
    this.comments = [];
    let pos = response.data.length-pageInfo.end-1;
    for (let i = pos; i >= pageInfo.begin; i--){
      let data = response.data[i];
      let comment = {
        user:data.user.login,
        avatar:data.user.avatar_url  + '&s=48',
        user_url:data.user.html_url,
        content: data.body_html,
        created_at: new Date(data.created_at).toLocaleString(),
        updated_at: new Date(data.updated_at).toLocaleString()
      };
      this.comments.push(comment)
    }
    this.loading = false
  })
}

function pageinfo(total,page) {
  let number = total - (page - 1) * PRE_PAGE;
  let begin = 0;
  let end = 0;
  if(number < PRE_PAGE){
    if(page>1){
      end = PRE_PAGE - number;
    }
    return {
      "page":1,
      "prePage": PRE_PAGE,
      "begin":begin,
      "end":end
    };
  }
  let new_pre_page = PRE_PAGE;
  let rem = number % new_pre_page;
  while(rem < PRE_PAGE && rem > 0){
    new_pre_page+=1;
    rem = number % new_pre_page;
  }
  let new_page = Math.ceil(number/new_pre_page);
  if(rem==0){
    rem = new_pre_page;
  }
  begin = rem - PRE_PAGE;
  end = new_pre_page - rem;
  if(page==1){
    end = 0;
  }
  return {
    "page":new_page,
    "prePage": new_pre_page,
    "begin":begin,
    "end":end
  };

}

function createComment() {
  this.posting = true;
  let option ={
    headers:{
      'Content-Type':'application/json',
      'Accept':'application/vnd.github.html+json',
      'Authorization':'token '+this.token
    }
  };
  if(this.comments_url){
    if(this.comment === ''){
      return
    }
    let data = {body: this.comment};
    console.log(data);
    axios.post(this.comments_url,data,option).then((response) => {
      this.comment = '';
      console.log(response);
      let comment = {
        user:response.data.user.login,
        avatar:response.data.user.avatar_url  + '&s=48',
        user_url:response.data.user.html_url,
        content: response.data.body_html,
        created_at: new Date(response.data.created_at).toLocaleString(),
        updated_at: new Date(response.data.updated_at).toLocaleString()
      };
      this.comments.pop();
      this.comments.unshift(comment);
      this.commentCount++;
      this.pageCount = Math.ceil(this.commentCount/PRE_PAGE);
      this.posting = false;
    }).catch((error) => {
      console.log(error)
    })
  }else{
    let data = {
      installation_id: this.installation_id,
      owner: this.owner,
      repo: this.repo,
      access_token: this.token,
      title: this.title,
      pid: this.pid,
      body: '['+this.title+']('+getUrl()+')'
    };
    console.log(data);
    let issueApiPath = this.server_url + '/issue';
    axios.post(issueApiPath,data).then((response) =>{
      this.comments_url = response.data.comments_url;
      this.issue_url = response.data.html_url;
      this.createComment()
    }).catch((error) => {
      console.log(error)
    })
  }
}

function pages() {
  let items = {};
  if (this.pageCount<8) {
    for(let index = 1; index <= this.pageCount; index++){
      items[index] = {
        index: index,
        content: index,
        ellipsis: false,
        selected: index === this.pageIndex
      };
    }
  }else{
    let pageIndex = 1;
    let ellipsis = false;
    for(let index = 1; index < 8 ; index++){
      ellipsis = false;
      if (index===2&&this.pageIndex>4) {
        ellipsis = true;
        if (this.pageCount-this.pageIndex>3) {
          pageIndex = this.pageIndex - 2;
        }else{
          pageIndex = this.pageCount - 5;
        }
      }
      if (index===6&&this.pageCount-this.pageIndex>3) {
        ellipsis = true;
        pageIndex = this.pageCount -1;
      }
      items[index] = {
        index: pageIndex,
        content: pageIndex,
        ellipsis: ellipsis,
        selected: pageIndex === this.pageIndex
      };
      pageIndex++;
    }
  }
  return items;
}

//static function
function getToken() {
  // get token in URL
  let query = queryParse();
  let token = query['access_token'];
  if(token){
    window.localStorage.setItem(TOKEN_KEY,token);
    window.history.replaceState(null, null, getUrl());
  }else{
    token = window.localStorage.getItem(TOKEN_KEY);
  }
  return token;
}

function cleanToken(){
  window.localStorage.removeItem(TOKEN_KEY)
}

function getUrl() {
  let query = queryParse();
  let originQuery = {};
  Object.keys(query).forEach(key => {
    if (key!=='access_token'&&key!=='scope'&&key!=='token_type'){
      originQuery[key] = query[key]
    }
  });
  let url = window.location.protocol + "//";
  url = url + window.location.host;
  url = url + window.location.pathname;
  url = url + queryStringify(originQuery);
  return url
}

function queryParse(search = window.location.search) {
    if (!search) return {};
    const queryString = search[0] === '?' ? search.substring(1) : search;
    const query = {};
    queryString.split('&')
      .forEach(queryStr => {
        const [key, value] = queryStr.split('=');
        if (key) query[key] = value
      });

    return query;
}

function queryStringify(query, prefix = '?') {
    const queryString = Object.keys(query)
      .map(key => `${key}=${encodeURIComponent(query[key] || '')}`)
      .join('&');
    return queryString ? prefix + queryString : '';
}
</script>

<style lang="scss" scoped>
  @import "~bulma/bulma";
  @import '~simplemde/dist/simplemde.min.css';
</style>

<style>
  .CodeMirror, .CodeMirror-scroll {
    min-height: 100px;
  }
</style>
