import { AnswerConfig, scheduleConfig } from './client'
/** 插件main函数标准返回值规范 */
export type pluginOptions = {
  test?: {
    /** 是否为@机器人 */
    atme?: boolean,
    /** 是否需要前置内容(作为消息最开始的字符串)
     * 在atme为true时无效
     * 不需要则直接忽略
     */
    prefix?: string | RegExp,
    /** 检索匹配的文本内容，可为数组。如果是值为正则，则直接用该值匹配 */
    text: string | RegExp | Array<string> | Array<RegExp>,
    /** 是否为全字匹配，在atme为true时无效，在text为正则时无效 */
    wholeWord?: boolean,
    /** 成功匹配是否忽略其他插件(插件执行先后是有文件目录名称排序的) */
    skip?: boolean,
    /** 是否使用回调的方式执行action函数（意思就是将其放置最后执行） */
    isHook?: boolean
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
/** 定时任务main函数标准返回值规范 */
export type scheduleOptions = {
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