import {defineConfig} from '@apps-in-toss/web-framework/config';
export default defineConfig({
  appName:'little-sea',
  brand:{primaryColor:'#7D73EF'},
  permissions:[{name:'clipboard',access:'write'}],
  navigationBar:{withBackButton:true,withHomeButton:true,withTitle:true,theme:'light'},
  webView:{allowsInlineMediaPlayback:true,mediaPlaybackRequiresUserAction:true,bounces:false,pullToRefreshEnabled:false,overScrollMode:'never',allowsBackForwardNavigationGestures:false},
  webBundleDir:'dist'
});
