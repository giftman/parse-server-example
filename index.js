// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: 'mongodb://winfan:winfan123@ds053788.mlab.com:53788/parsegmongodb',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'APPLICATION_ID',
  masterKey: process.env.MASTER_KEY || 'MASTER_KEY', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());
// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

var bodyParser = require('body-parser');

//for parsing application/json
app.use(bodyParser.json());

//for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

//for parsing multipart/form-data //需要用npm install multer@0.1.8
// app.use(multer());

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.get('/pay',require('./routes').index);

var API_KEY = "sk_test_ibbTe5jLGCi5rzfH4OqPW9KC"
// app_id 获取方式：登录 [Dashboard](https://dashboard.pingxx.com)->点击你创建的应用->应用首页->应用 ID(App ID)
var APP_ID = "app_1Gqj58ynP0mHeX1q"

var http = require('http');
var url = require('url');
var crypto = require('crypto');
var pingpp = require('pingpp')(API_KEY);

var createPayment = function(channel, amount, client_ip, open_id, cb){
  // 以下 channel 仅为部分需要 extra 参数的示例，详见 https://www.pingxx.com/document/api#api-c-new
  var extra = {};
  switch (channel) {
    case 'alipay_wap':
      extra = {
        // success_url 和 cancel_url 在本地测试不要写 localhost ，请写 127.0.0.1。URL 后面不要加自定义参数
        'success_url': 'http://www.yourdomain.com/success',
        'cancel_url': 'http://www.yourdomain.com/cancel'
      };
      break;
    case 'upacp_wap':
      extra = {
        'result_url': 'http://www.yourdomain.com/result'// 银联同步回调地址
      };
      break;
    case 'bfb_wap':
      extra = {
        'bfb_login': true,// 是否需要登录百度钱包来进行支付
        'result_url': 'http://www.yourdomain.com/success'// 百度钱包同步回调地址
      };
      break;
    case 'wx_pub':
      extra = {
        'open_id': open_id// 用户在商户微信公众号下的唯一标识，获取方式可参考 wxPubOauth.js
      };
      break;
  }
  // 商户系统自己生成的订单号。如果是【壹收款】，则使用客户端传上来的 'order_no'。
  var order_no = crypto.createHash('md5')
                .update(new Date().getTime().toString())
                .digest('hex').substr(0, 12);
  pingpp.charges.create({
    order_no:  order_no,// 推荐使用 8-20 位，要求数字或字母，不允许其他字符
    app:       {id: APP_ID},
    channel:   channel,// 支付使用的第三方支付渠道取值，请参考：https://www.pingxx.com/api#api-c-new
    amount:    amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
    client_ip: client_ip,// 发起支付请求客户端的 IP 地址，格式为 IPV4，如: 127.0.0.1
    currency:  "cny",
    subject:   "Charge Subject",
    body:      "Charge Body",
    extra:     extra
  }, cb);
};

app.post('/createOrder', function(req, res) {
  pingpp.parseHeaders(req.headers); // 把从客户端传上来的 Headers 传到这里
  pingpp.setPrivateKeyPath(__dirname + "/your_rsa_private_key.pem");
        var client_ip = '10.200.201.78';
        var params = req.body;
        // console.log(req);
        console.log(params);
        var channel = params["channel"].toLocaleLowerCase();
        var amount = params["amount"];
        var open_id = params["open_id"];
        createPayment(channel, amount, client_ip, open_id, function(err, charge) {
          if (charge != null) {
             res.send(charge);
          }else{
            res.send({error:err});
          }
           
        });
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
