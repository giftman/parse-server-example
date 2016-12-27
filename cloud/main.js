
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

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

Parse.Cloud.define('createOrder', function(req, res) {
	console.log(req);
  pingpp.parseHeaders(req.headers); // 把从客户端传上来的 Headers 传到这里
  pingpp.setPrivateKeyPath(__dirname + "/your_rsa_private_key.pem");
  // switch (req.url) {
  //     case "/pay":
        // 创建 charge
        var client_ip = '10.200.201.78';
        var params = req.params;
        console.log("req.params");
        console.log(params);
        var channel = params["channel"].toLocaleLowerCase();
        var amount = params["amount"];
        var open_id = params["open_id"];
        createPayment(channel, amount, client_ip, open_id, function(err, charge) {
          if (charge != null) {
             res.success(charge);
          }else{
          	res.error({error:err});
          }
           
        });
        // break;

    //   default:
    //     res("", 404);
    //     break;
    // }
});