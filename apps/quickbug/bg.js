var qb;
function launch() {
  if ( ! qb ) qb = QBug.create();
  qb.launchBrowser();
//  qb.launchBrowser('chromium');
}

if ( chrome.app.runtime ) {
  ajsonp = (function() {
    var factory = OAuthXhrFactory.create({
      authAgent: ChromeAuthAgent.create({}),
      responseType: "json"
    });

    return function(url, params, opt_method, opt_payload) {
      return function(ret) {
        var xhr = factory.make();
        xhr.responseType = "json";
        return xhr.asend(ret,
                         opt_method ? opt_method : "GET",
                         url + (params ? '?' + params.join('&') : ''),
                         opt_payload);
      };
    };
  })();

  chrome.app.runtime.onLaunched.addListener(function(opt_launchData) {
    // launchData is provided by the url_handler
    if ( opt_launchData ) console.log(opt_launchData.url);

    console.log('launched');
    launch();
  });
}

//GridView.getPrototype().updateHTML = OAM.time('GridView.updateHTML', OAM.profile(GridView.getPrototype().updateHTML));
GridView.getPrototype().updateHTML   = OAM.time('GridView.updateHTML',  GridView.getPrototype().updateHTML);
TableView.getPrototype().repaint     = OAM.time('TableView.repaint',    TableView.getPrototype().repaint);
// TableView2.getPrototype().repaintNow = OAM.time('TableView.repaintNow', TableView2.getPrototype().repaintNow);
GridByExpr.getPrototype().initHTML   = OAM.time('GridByExpr.initHTML',  GridByExpr.getPrototype().initHTML);
// GridCView.getPrototype().paint       = OAM.time('GridCView.paint',      GridCView.getPrototype().paint);