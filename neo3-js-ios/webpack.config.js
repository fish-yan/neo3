const path = require("path");		// Node.js 内置模块
module.exports = {
  // 设置入口：同级目录的src文件夹内的main.js为入口
  entry: "./src/index.js",
  // 设置输出路径：同级目录的dist文件夹下的bundle.js
  output: {
    // __dirname:当前文件所在路径
    path: path.resolve(__dirname, './dist'),
    // 打包后的输出文件名
    filename: "main.js"
  },
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
    },
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      // ...
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  }
}

// 读取当前项目目录下src文件夹中的main.js（入口文件）内容，分析资源依赖，把相关的js文件打包，打包后的文件放入当前目录的dist文件夹下，打包后的js文件名为bundle.js
