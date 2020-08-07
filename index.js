const superagent = require("superagent");
const requset = require("request");
// const username = process.argv[2];
// const password = process.argv[3];
// console.log(cookie);
// console.log(random);
let header = {
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "zh-CN,zh;q=0.9",
  "content-length": "47",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "user-agent":
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
};

let urls = {
  validCodeImage: `http://apply.xkctk.jtys.tj.gov.cn/apply/validCodeImage.html`,
};

function getLoginCookie() {
  return new Promise(function (resolve, reject) {
    superagent.get(urls.validCodeImage).end(function (err, response) {
      //获取cookie
      console.log("返回数据： ", response);
      let cookie = response.headers["set-cookie"][0];
      resolve(cookie);
    });
  });
}

async function run() {
  let cookieStr = await getLoginCookie();
  console.log(cookieStr);
}

run();
