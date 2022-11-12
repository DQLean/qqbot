const path = require('path');

module.exports = {
  target: "node",
  mode: "development",
  // mode: "production",
  //指定入口文件
  entry: "./src/index.ts",
  //指定打包文件所在的目录
  output: {
    //指定打包文件的目录
    path: path.resolve(__dirname, 'dist'),
    //打包后文件的文件
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  //指定webpack打包时要使用的模块
  module: {
    //指定要加载的规则
    rules: [
      {
        //test 指定的是规则生效的文件
        test: /\.ts$/,
        //要使用的loader
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
          }
        },
        //要排除的文件
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              "@babel/plugin-transform-runtime",
              "@babel/plugin-proposal-object-rest-spread"
            ]
          }
        }
      }
    ]
  }
}