const fs = require("fs");
const superagent = require("superagent");
const { v4: uuidv4 } = require("uuid");
const { getOcrReault } = require("./utils/ocrTools");
const { exec } = require("child_process");
const readline = require("readline");
const cheerio = require("cheerio");

let tempUrl = `${__dirname}\\temp`; //验证码临时路径


//访问url
let urls = {
  validCodeImage: `http://apply.xkctk.jtys.tj.gov.cn/apply/validCodeImage.html`,
  loginUrl: `http://apply.xkctk.jtys.tj.gov.cn/apply/user/person/login.html`,
};

//登录信息
let loginInfo={
  limingle:{
    userName:"13821894645",
    password:"le452843930"
  },
  liulu:{
    userName:"13032258355",
    password:"Le452843930!"
  }
}

/**
 * 获取登录的cookie和验证码
 */
function getLoginCookie() {
  return new Promise(function (resolve, reject) {
    superagent.get(urls.validCodeImage).end(async function (err, response) {
      //获取cookie
      let cookieStr = response.headers["set-cookie"][0];
      let imgId = saveImg(response.body);
      let validCode = await getOcrReault(`${tempUrl}\\${imgId}.png`);
      //打开图片
      exec(`${tempUrl}\\${imgId}.png`, (err, stdout, stderr) => {
        if (err) {
          console.log(err);
          return;
        }
      });
      resolve({
        cookieStr,
        validCode,
      });
    });
  });
}

/**
 * 将文件流生成图片文件
 * @param {stream} stream 图片文件流
 * @returns {string} 图片ID
 */
function saveImg(stream) {
  let id = uuidv4();
  fs.writeFileSync(`${tempUrl}\\${id}.png`, stream, "binary");
  return id;
}

/**
 * 登录APP
 * @param {string} userName 用户名
 * @param {string} password 密码
 * @param {string} validCode 验证码
 * @param {string} cookieStr cookie字符串
 * @returns {Promise} 登录结果
 */
function loginApp(userName,password,validCode,cookieStr) {
  return new Promise(function (resolve, reject) {
    superagent
      .post(urls.loginUrl+'?r='+Math.random())
      .set('Cookie', cookieStr)
      .type('form')
      .send({loginType:'MOBILE'})
      .send({type:'person'})
      .send({logInFrom:0})
      .send({grSelect:'MOBILE'})
      .send({mobile:userName})
      .send({password:password})
      .send({validCode:validCode})
      .send({unitLoginTypeSelect:'MOBILE'})
      .send({sySelect:'MOBILE'})
      .then(function (response) {
        resolve(response);
      });
  });
}

//readline实例
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * 封装为同步工厂方法
 * @param {Function} fn 
 */
function rlPromisify(fn) {
  return async (...args) => {
      return new Promise(resolve => fn(...args, resolve));
  };
}

//同步question方法
const question = rlPromisify(rl.question.bind(rl));

/**
 * 根据输入索引查询用户信息
 * @param {string} index 索引
 */
function getUserInfo(index){
  let userName='';
  let password='';
  // 判断查询哪个用户
  switch (index) {
    case '1':
      //用户limingle
      userName=loginInfo['limingle'].userName;
      password=loginInfo['limingle'].password;
      break;
    default:
      //用户liulu
      userName=loginInfo['liulu'].userName;
      password=loginInfo['liulu'].password;
      break;
  }
  return {
    userName,
    password
  }
}

async function run() {
  //获取登录Cookie字符串
  let { cookieStr, validCode } = await getLoginCookie();
  console.log(`验证码识别结果:${validCode}`);
  let isUse = await question("确认是否使用？(y/n) 如果想重新获取验证码请按(r)键：");
  isUse = isUse.toUpperCase();
  // 判断是否使用当前识别的验证码
  switch (isUse) {
    case "N":
      //不使用当前验证码
      let newValidCode = await question("请输入验证码：");
      validCode = newValidCode;
      break;
    case "R":
      //重新获取验证码
      run();
      return;
  }
  let user = await question("请输入要登录的用户(1、limingle，2、liulu)：");
  let userInfo=getUserInfo(user);
  try {
    let loginResult = await loginApp(userInfo.userName,userInfo.password,validCode,cookieStr);  //获取登录结果
    let $ = cheerio.load(loginResult.text); //解析返回的html字符串
    let resultText=$("body > div.s_topbg > div.cont_mainbg > div > div > div:nth-child(1) > div.content > div > div > div:nth-child(3) > table > tbody > tr.bgcolor1 > td:nth-child(7) > span").text();
    resultText=!!resultText?resultText:$("body > div.s_topbg > div.cont_mainbg > div > div > div:nth-child(1) > div.content > div > div > div:nth-child(3) > table > tbody > tr.bgcolor1 > td:nth-child(7)").text();
    resultText=resultText.replace(/\s*/g,'');
    console.log('中签结果：',resultText);
  } catch (error) {
    console.log('loginResultError',error)
  }
}

run();
