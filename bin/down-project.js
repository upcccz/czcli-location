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

var count = 0; // 计数

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
        dirArr.forEach((item,i) => {
            mkDirFn(item[1]);
        })
      
        function mkDirFn(url) {
          fs.mkdirSync(currentPath + url.replace(templatePath, ''))
        }

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

        // ===================================================

        // 读写操作 使用generator
        // function* readAndWrite() {
        //   for(let i =0 ; i< fileArr.length ; i++) {
        //     var item = fileArr[i];
        //     var writePath = currentPath + item[1].replace(templatePath, '');
        //     var data = yield read(item[1], 'utf8');
            
        //     if (item[1].endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       var result = handlebars.compile(data)(answers);
        //       yield write(writePath, result)
        //     } else {
        //       // 正常写入其他文件
        //       yield write(writePath, data)
        //     }
        //     if (i === fileArr.length -1) {
        //       resolve();
        //     }
        //   }
        // }

        // function run(fn) {
        //   var gen = fn();
        //   function cb(err, data){
        //     if(err) throw err;
        //     var result = gen.next(data);
        //     if(result.done) return
        //     result.value(cb);
        //   }
        //   cb()
        // }
        // run(readAndWrite)

        // ====================================================

        // co(function* readAndWrite() {
        //   for(let i =0 ; i< fileArr.length ; i++) {
        //     var item = fileArr[i];
        //     var writePath = currentPath + item[1].replace(templatePath, '');
        //     var data = yield read(item[1], 'utf8');
            
        //     if (item[1].endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       var result = handlebars.compile(data)(answers);
        //       yield write(writePath, result)
        //     } else {
        //       // 正常写入其他文件
        //       yield write(writePath, data)
        //     }
        //     if (i === fileArr.length -1) {
        //       console.log('读取完成');
        //       resolve();
        //     }
        //   }
        // })

        //  ============================================================
        // 读写操作 使用async await

        // async function readAndWrite(readPath, writePath) {
        //   try {
        //     let readRes = await new Promise(resolve => {
        //       fs.readFile(readPath, 'utf8', (err,data) => resolve(data))
        //     })
        //     if (readPath.endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       readRes = handlebars.compile(readRes)(answers);
        //     }
        //     fs.writeFile(writePath, readRes, err => {
        //       return
        //     });
        //   } catch (error) {
        //     console.log(error);
        //   }
        // }
        
        // async function run () {
        //   for(let i =0, len = fileArr.length; i < len; i++) {
        //     let readPath = fileArr[i][1];
        //     let writePath = currentPath + readPath.replace(templatePath, '');
        //     await readAndWrite(readPath, writePath)
        //   }
        // }
        // run().then(() => {
        //   resolve();
        // });

        //  ============================================================
        // 使用Promise.all() 并发读写

        // async function readAndWrite(readPath, writePath) {
        //   try {
        //     let readRes = await new Promise(resolve => {
        //       fs.readFile(readPath, 'utf8', (err,data) => resolve(data))
        //     })
        //     if (readPath.endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       readRes = handlebars.compile(readRes)(answers);
        //     }
        //     fs.writeFile(writePath, readRes, err => {
        //       return
        //     });
        //   } catch (error) {
        //     console.log(error);
        //   }
        // }

        // const promises = fileArr.map((item) => {
        //   let readPath = item[1];
        //   let writePath = currentPath + item[1].replace(templatePath, '');
        //   return readAndWrite(readPath, writePath)
        // })

        // Promise.all(promises).then(() => {
        //   resolve()
        // })
        //  ============================================================

        //  ============================================================
        // 使用异步 Generator 函数

        // async function* readAndWrite() {
        //   for (let i = 0, len = fileArr.length; i < len; i++) {
        //     let readPath = fileArr[i][1];
        //     let writePath = currentPath + readPath.replace(templatePath, '');
        //     let readRes = await new Promise(resolve => {
        //       fs.readFile(readPath, 'utf8', (err, data) => resolve(data))
        //     })
        //     if (readPath.endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       readRes = handlebars.compile(readRes)(answers);
        //     }
        //     yield fs.writeFile(writePath, readRes, err => {
        //       return
        //     });
        //   }
        // }
        // async function run() {
        //   for await (const key of readAndWrite()) {}
        //   resolve()
        // }
        // run();

        // async function run(asyncIterator) {
        //   const it = asyncIterator();
        //   while(true) {
        //     const {done} = await it.next();
        //     if(done) break;
        //   }
        //   resolve()
        // }
        // run(readAndWrite)

        //  ============================================================
        //  异步遍历器的并发
        // async function* readAndWrite() {
        //   for (let i = 0, len = fileArr.length; i < len; i++) {
        //     let readPath = fileArr[i][1];
        //     let writePath = currentPath + readPath.replace(templatePath, '');
        //     let readRes = await new Promise(resolve => {
        //       fs.readFile(readPath, 'utf8', (err, data) => resolve(data))
        //     })
        //     if (readPath.endsWith('package.json')) {
        //       // 根据交互改写 package.json
        //       readRes = handlebars.compile(readRes)(answers);
        //     }
        //     yield fs.writeFile(writePath, readRes, err => {
        //       return
        //     });
        //   }
        // }
        // async function run() {
        //   let it = readAndWrite();
        //   for (let i = 0, len = fileArr.length; i < len; i++) {
        //     if (i === fileArr.length -1) {
        //       await it.return();
        //       resolve();
        //     } else {
        //       it.next()
        //     }
        //   }
        // }
        // run();
        //  ============================================================

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