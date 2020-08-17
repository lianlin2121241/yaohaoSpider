const tesseract = require("node-tesr");
const gm = require('gm');

/**
 * 根据图片地址获取图片中的验证码
 * @param {string} imgUrl 图片地址
 * @returns {Promise} 获取图片验证码结果
 */
function getOcrReault(imgUrl) {
  return new Promise((resolve, reject) => {
    let imageMagick = gm.subClass({imageMagick: true})
    let tempPath=imgUrl.replace(/(\.png|\.jpg)/g,'_temp$1');
    //安装imageMagick时注意事项
    //https://blog.csdn.net/taoerchun/article/details/50354362
    imageMagick(imgUrl)
      // .contrast(-6)
      // .flattern()
      // .autoOrient()
      .colorspace('GRAY')
      .monochrome()
      // .sharpen(100)
      // .despeckle()
      .threshold(28, '%')
      .write(tempPath, err => {
        if (err) {
          reject(err);
        } else {
          tesseract(tempPath, { l: "eng", oem: 3, psm: 7 }, function (err, data) {
            if (err) {
              reject(err)
              console.log(err);
            }
            data=data.replace(/\s*/g,'');
            resolve(data);
          });
        }
      });
  });
}

module.exports = {
  getOcrReault,
};
