## 背景
无背景

## 安装
```shell
$ npm 安装
```

## 用法
#### 开发版本
```shell
$ npm install -g typescript
$ npm run dev
```
#### 生产版本
```shell
$ npm run build
$ cd dist
$ index.js
```

## 插件
插件文件由js文件编写，整个文件中需要定义一个名为main的函数作为入口。
main函数可接受参数config，config参数结构见下文
main函数返回一个消息回复参数对象，该对象由test属性和action函数组成，详细结构见下文
main函数可不返回任何东西，此时main函数作为action函数使用，并且所有的消息检索和回复操作执行需由插件手动调用，操作所需参数在config中
最后需要使用commonJS的导出，module.exports = main，将main函数作为模块导出
#### 模板
```javascript
function main() {
  return {
    test: {
      text: "你真漂亮"
    },
    action: action
  }
}
function action(config) {
  return "谢谢！"
}
module.exports = main
```

### Config
```typescript
type AnswerConfig = {
  /** oicq的message event，取决于当前接受的是什么消息 */
  event: MessageEvent,
  /** 当前消息的来源对象 */
  target: Target,
  /** client装载的库，用于不想在plugins文件夹中设置npm又不想打包js文件的插件使用一些库，重点是oicq库，其中有segment是转化消息对象的 */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}
/** 消息事件 */
export type MessageEvent = oicq.GroupMessageEvent | oicq.PrivateMessageEvent | oicq.DiscussMessageEvent
/** 消息来源对象 */
export type Target = oicq.Group | oicq.Friend | oicq.Member | oicq.User | oicq.Discuss
/** client挂载的库对象 */
export type Libs = { [key: string]: any }
/** 消息回复插件plugins返回值规范 */
export type AnswerResponse = string | Array<string | segmentElement> | void
```
### main函数返回值
```typescript
type pluginOptions = {
  test?: {
    /** 是否为@机器人 */
    atme?: boolean,
    /** 是否需要前置内容(作为消息最开始的字符串)
     * 在atme为true时无效
     * 不需要则直接忽略
     */
    prefix?: string,
    /** 检索匹配的文本内容，可为数组 */
    text: string | string[],
    /** 是否为全字匹配，在atme为true时无效 */
    wholeWord?: boolean,
    /** 成功匹配是否忽略其他插件(插件执行先后是有文件目录名称排序的) */
    skip?: boolean
  },
  /** 插件功能执行函数
   * 返回值有三种
   * 1：标准的oicq回复消息内容对象，可为string或array
   * 2：promise，这是当action为异步函数时的返回值
   * 3：void，不返回任何东西
   * 除了第一种返回值，其他两种返回值需要手动调用config中的handle函数并传入标准的oicq回复消息内容对象执行回复，
   * 或者手动调用config中的target对象中的sendMsg函数执行回复
   */
  action: (config: AnswerConfig) => void
}
```

## 定时任务
定时任务是通过node-schedule支持的一个定时触发事件，在特定的时间触发并执行操作
和插件一样需要一个main函数作为入口，也需要通过module.exports = main将其导出
main函数必须有一个返回值，而且是标准定时任务配置对象，详细结构见下文
若main没有返回任何东西，则这个函数将不会作为定时任务被触发！
main函数不同于插件，定时任务的main函数不接收任何参数，config将被action函数接收！
注意这里的config和插件的不同，定时任务中的config删除了event属性，添加了fireDate属性，为其触发时间
#### 模板
```javascript
function main() {
  return {
    /** date属性可为空，和下面这个效果一样 */
    date: {
      second: "*",
      minute: "*",
      hour: "*",
      day: "*",
      month: "*",
      dayofweek: "*"
    },
    action,
    target: {
      group: 123456,
      user: 123456
    }
  }
}
function action(config) {
  return "触发定时任务"
}
module.exports = main
```
### Config
```typescript
type scheduleConfig = {
  /** 当前消息的来源对象 */
  target: Target,
  /** 定时任务回调action触发时间 */
  fireDate: Date,
  /** client装载的库，用于不想在plugins文件夹中设置npm又不想打包js文件的插件使用一些库，重点是oicq库，其中有segment是转化消息对象的 */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}
/** 消息来源对象 */
export type Target = oicq.Group | oicq.Friend | oicq.Member | oicq.User | oicq.Discuss
/** client挂载的库对象 */
export type Libs = { [key: string]: any }
/** 消息回复插件plugins返回值规范 */
export type AnswerResponse = string | Array<string | segmentElement> | void
```
### main函数返回值
```typescript
type scheduleOptions = {
  date?: {
    second?: number | "*",
    minute?: number | "*",
    hour?: number | "*",
    day?: number | "*",
    month?: number | "*",
    dayofweek?: number | "*"
  } | string,
  action: (config: scheduleConfig) => void,
  /** target属性必须存在一个group或者user，不能两个都为空
   * 当两个同时存在时，会执行发送群消息，但是会优先 @ user中的群成员
   */
  target?: {
    group?: number | number[],
    user: number | number[]
  } | {
    group: number | number[],
    user?: number | number[]
  }
}
```

## 目录
### assets
资源目录，用于存放json或其他资源，建议插件需要的静态资源也将其放在此处
### plugins/schedules
插件/定时任务文件夹，直接将插件放进去就可以了
### .template
这个目录不在dist中，是开发环境目录。
放置插件/定时任务的插件编写模板
### test
这个目录不在dist中，是开发环境目录。
插件编写与webpack打包环境目录，用于编写插件的js以及打包，webpack及babel已配置完毕
打包时使用webpack --entry 文件名/路径，打包后文件生成与test/dist中的index.js文件

## 徽章
没有徽章

## 贡献者
@takayama-lily (https://github.com/takayama-lily/oicq)

## 许可证
MIT