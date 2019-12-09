// 文件模块
const fs = require('fs');
// 操作文件
const handlebars = require('handlebars');
// 获取 thunk函数制造器
const thunkify = require('thunkify');
// thunk 化 readFile
const read = thunkify(fs.readFile);
// thunk 化 writeFile
const write = thunkify(fs.writeFile);

const path = require('path');

const co = require('co');

module.exports  = function (answers, templatePath) {
  return new Promise((resolve) => {
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

        // 读写操作 使用generator
        function* readAndWrite() {
          for(let i =0 ; i< fileArr.length ; i++) {
            var item = fileArr[i];
            var writePath = currentPath + item[1].replace(templatePath, '');
            var data = yield read(item[1], 'utf8');
            
            if (item[1].endsWith('package.json')) {
              // 根据交互改写 package.json
              data = handlebars.compile(data)(answers);
            }
            yield write(writePath, data)
          }
        }

        function run(fn) {
          var gen = fn();
          function cb(err, data){
            if(err) throw err;
            var result = gen.next(data);
            if(result.done) return resolve();
            result.value(cb); // 读取文件和写入文件的调用 是在这里发出的
          }
          cb()
        }
        run(readAndWrite)

        // 使用co模块来执行
        // co模块约定，yield命令后面只能是 Thunk 函数或 Promise 对象，而async函数的await命令后面，可以是 Promise 对象和原始类型的值
        // co(function* readAndWrite() {
        //   for(let i =0 ; i< fileArr.length ; i++) {
        //     var item = fileArr[i];
        //     var writePath = currentPath + item[1].replace(templatePath, '');
        //     var data = yield read(item[1], 'utf8');
            
        //     if (item[1].endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       data = handlebars.compile(data)(answers);
        //     }
        //     yield write(writePath, data)
        //     if (i === fileArr.length -1) {
        //       console.log('读取完成');
        //       resolve();
        //     }
        //   }
        // })


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