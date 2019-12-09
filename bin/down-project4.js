// 文件模块
const fs = require('fs');
// 操作文件
const handlebars = require('handlebars');

const { promisify } = require('util');
const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);

const path = require('path');

module.exports  = function (answers, templatePath) {
  return new Promise((resolve) => {
      console.log('44444444');
      const { name } = answers;
      templatePath = path.join(__dirname, '../'+ templatePath);
      var targetPath = './' + name;
      var currentPath  = path.join(process.cwd(), './'+ name);
      var arr = [];
      fs.mkdir(targetPath,  () => {
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

        // 读写操作 使用async await

        async function readAndWrite(readPath, writePath, done) {
          let data = await readFilePromise(readPath, 'utf8')
          if (readPath.endsWith('package.json')) {
            data = handlebars.compile(data)(answers);
          }
          writeFilePromise(writePath, data).then(() => {
            if(done) resolve();
          })
        }
        
        for(let i =0, len = fileArr.length; i < len; i++) {
          let readPath = fileArr[i][1];
          let writePath = currentPath + readPath.replace(templatePath, '');
          readAndWrite(readPath, writePath, i == fileArr.length -1);
        }

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