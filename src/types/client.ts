import * as oicq from "oicq";

/** assets中config.json文件数据类型规范 */
export type Config = {
  account: {
    uin: number,
    pwd: string
  },
  oicq: oicq.Config,
  path?: {
    plugin?: string,
    schedule?: string
  }
}
/** 消息来源对象 */
export type Target = oicq.Group | oicq.Friend | oicq.Member | oicq.User | oicq.Discuss
/** 消息事件 */
export type MessageEvent = oicq.GroupMessageEvent | oicq.PrivateMessageEvent | oicq.DiscussMessageEvent
/** client挂载的库对象 */
export type Libs = { [key: string]: any }
/** oicq的segment函数返回值(qq特殊消息对象) */
export type segmentElement = oicq.TextElem | oicq.FaceElem | oicq.BfaceElem | oicq.MfaceElem | oicq.AtElem | oicq.ImageElem |
  oicq.FlashElem | oicq.PttElem | oicq.VideoElem | oicq.JsonElem | oicq.XmlElem | oicq.MiraiElem | oicq.ShareElem |
  oicq.LocationElem | oicq.PokeElem
/** 消息回复插件plugins函数参数 */
export type AnswerConfig = {
  /** oicq的message event，取决于当前接受的是什么消息 */
  event: MessageEvent,
  /** 当前消息的来源对象 */
  target: Target,
  /** client装载的库，用于不想在plugins文件夹中设置npm又不想打包js文件的插件使用一些库，重点是oicq库，其中有segment是转化消息对象的 */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}
/** 消息回复插件plugins返回值规范 */
export type AnswerResponse = string | Array<string | segmentElement> | void
/** client插件集合对象 */
export type pluginLibs = { [key: string]: Function }
/** client定时任务集合对象 */
export type scheduleLibs = { [key: string]: Function }
/** 定时任务action参数 */
export type scheduleConfig = {
  /** 当前消息的来源对象 */
  target: Target,
  /** 定时任务回调action触发时间 */
  fireDate: Date,
  /** client装载的库，用于不想在plugins文件夹中设置npm又不想打包js文件的插件使用一些库，重点是oicq库，其中有segment是转化消息对象的 */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}