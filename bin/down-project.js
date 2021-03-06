// 35ms 36ms 37ms 38ms 34ms

// 文件模块
const fs = require('fs');
// 操作文件
const handlebars = require('handlebars');

const path = require('path');

var count = 0; // 计数

module.exports  = function (answers, templatePath) {
  return new Promise((resolve) => {
      const { name } = answers;
      templatePath = path.join(__dirname, '../'+ templatePath);
      var targetPath = './' + name;
      var currentPath  = path.join(process.cwd(), './'+ name);
      var arr = [];
      fs.mkdir(targetPath,  () => {
        // 区分文件夹和文件
        addPath(templatePath);
        const dirArr = arr.filter(item => item[0] == 'dir');
        const fileArr = arr.filter(item => item[0] == 'file');
      
        // 先同步建好目录 在写入 避免写丢 目录没有无法正常写入
        dirArr.forEach((item) => {
          mkDirFn(item[1]);
        })
      
        function mkDirFn(url) {
          fs.mkdirSync(currentPath + url.replace(templatePath, ''))
        }

        // 读写操作
        var counter = function () {
          count++;
          if (count == fileArr.length) {
            resolve();
          } 
        }
        
        fileArr.forEach((item) => {
          var writePath = currentPath + item[1].replace(templatePath, '');
          fs.readFile(item[1], 'utf8', (err, data) => {
            var data = data;
            if (item[1].endsWith('package.json')) {
              // 根据交互改写 package.json
              data = handlebars.compile(data)(answers);
            }
            // 正常写入其他文件
            fs.writeFile(writePath, data, function(err) {
              if (err) {
                console.log('创建文件 %s 失败', writePath, err);
              }
              counter();
            });
          })
        })

        // 搜集模板文件的所有文件地址，然后统一读写
        function addPath(path) {
          // 同步读取所有路径 返回一个数组
          var files = fs.readdirSync(path);
          // 循环添加到数组中
          files.forEach((item) => {
            var nowPath  = path + '/' + item;
            var status = fs.statSync(nowPath);
            if (status.isDirectory()) {
              // 标记为文件夹 并进行递归
              arr.push(['dir', nowPath]);
              addPath(nowPath);
            }else {
              arr.push(['file', nowPath]);
            }
          })
        }
      })
  })
}