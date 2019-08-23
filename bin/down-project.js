// 文件模块
const fs = require('fs');
// 操作文件
const handlebars = require('handlebars');

module.exports  = function (answers) {
  return new Promise((resolve) => {
      const { name } = answers;
      var templatePath = __dirname + '/' + '../template';
      var targetPath = './' + name;
      var arr = [];
      var currentPath  = process.cwd() + '/' + targetPath;
      fs.mkdir(targetPath,  () => {
        addPath(templatePath);
        const dirArr = arr.filter(item => item[0] == 'dir');
        const fileArr = arr.filter(item => item[0] == 'file');
      
        // 先同步建好目录 在写入 避免写丢 目录没有无法正常写入
      
        dirArr.forEach((item,i) => {
            mkDirFn(item[1]);
        })
      
        function mkDirFn(url) {
          fs.mkdirSync(currentPath + url.replace(templatePath, ''))
        }
        
        fileArr.forEach((item, i) => {
          (function(item, i){
            var writePath = currentPath + item[1].replace(templatePath, '');
            fs.readFile(item[1], 'utf8', (err, data) => {
              if (item[1].endsWith('package.json')) {
                // 根据交互改写 package.json
                var result = handlebars.compile(data)(answers);
                fs.writeFile(writePath, result, function(err) {
                  if (err) {
                    console.log('创建文件 %s 失败', writePath, err);
                  }
                });
              } else {
                // 正常写入其他文件
                fs.writeFile(writePath, data, function(err) {
                  if (err) {
                    console.log('创建文件 %s 失败', writePath, err);
                  }
                  if (i === fileArr.length -1) {
                    resolve();
                  }
                });
              }
            })
          })(item, i)
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