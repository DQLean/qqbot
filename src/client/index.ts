/**
 * @author rabbit
 * @description 机器人模拟登录客户端对象，基于oicq Client对象的二次封装
 * @description 更简洁的插件导入，无需更改客户端文件，只需在plugins或schedules文件夹添加js文件!
 * @license MIT
 */

import * as oicq from "oicq";
import md5 from 'md5';
import * as Schedule from 'node-schedule'
import defaultConfig from '../assets/config.json'
import { readDir, createDir, testMessage, testPrefix, matchPrefix } from '../utils/tools'
import * as cheerio from 'cheerio'
import * as axios from 'axios'
import * as Types from '../types/index'
import * as fs from 'fs'
import * as path from 'path'

class Client {
  readonly libs: Types.Libs = {
    oicq: oicq,
    md5: md5,
    cheerio: cheerio,
    axios: axios
  }
  readonly __config: Types.Config
  readonly plugins: Types.pluginLibs
  readonly schedules: Types.scheduleLibs
  readonly client: oicq.Client
  readonly logger: oicq.Logger

  private pluginStatus: boolean = false
  private scheduleStatus: boolean = false

  constructor() {

    let __defaultConfig: Types.Config = defaultConfig
    /** 如果不是调试环境，尝试加载自定义config.json文件 */
    if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") {
      createDir("./assets")
      if (fs.existsSync("./assets/config.json")) {
        const customConfig = JSON.parse(fs.readFileSync("./assets/config.json").toString() || "{}")
        __defaultConfig = customConfig
      }
    }

    this.__config = {
      ...__defaultConfig,
      account: __defaultConfig.account,
      oicq: {
        ...__defaultConfig.oicq,
        log_level: "info"
      }
    }

    this.plugins = {}
    this.schedules = {}

    /** login */
    const { uin } = this.__config.account
    this.client = oicq.createClient(uin, this.__config.oicq);

    this.logger = this.client.logger

    this.logger.info("Current ENV mode [", process.env.NODE_ENV, "]")

    this.loadPlugins()

    this.loadSchedules()
  }

  async loadPlugins() {
    let pluginPATH: string
    /** 定义plugins路径 */
    if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") pluginPATH = "./plugins"
    else pluginPATH = "./temp/plugins"
    /** 如果存在自定义插件文件夹名称，则使用自定义 */
    if (this.__config?.path?.plugin) pluginPATH.replace(/plugins$/gi, this.__config.path.plugin)
    /** 尝试创建plugins文件夹 */
    createDir(pluginPATH, this.logger)

    const plugins: Types.Dirs = readDir(pluginPATH, { readDirectory: true, directoryTree: false })
    /** 循环添加插件 */
    for (let plugin in plugins) {
      let pluginName: string = path.basename(plugin)
      /** 防止重名 */
      if (this.plugins[pluginName]) {
        pluginName = pluginName + `(${Object.keys(this.plugins)
          .filter(item => item.replace(/\((\d)+\)$/gi, "") === pluginName).length
          })`
      }
      this.logger.info(`💡加载插件 [ ${pluginName} ]`)
      /** TS import导入js文件 */
      let main: Function
      if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") main = eval(`require(plugin)`)
      else main = (await import(plugin)).default
      this.plugins[pluginName] = (config: Types.AnswerConfig) => {
        return (function (logger: oicq.Logger) {
          /** try捕获错误防止插件js内容报错 */
          try {
            /** 运行并接收main函数的返回值
             * main函数可以返回一个标准的插件参数对象，或者不返回任何东西
             * 当返回对象时，客户端会接管判断消息内容是否可回答的任务，并在可回答时调用action函数
             * 当没有返回值时，main函数作为action函数的功能，判断是否回答的任务需要插件在main函数中自己编写
             */
            let pluginOptions: Types.pluginOptions = main(config)
            /** 判断main函数是否有返回值 */
            if (pluginOptions !== void 0) {
              const { test, action } = pluginOptions
              if (!action) return
              if (!test) action(config)
              else {
                /** atme */
                if (test.atme && config.event.message_type === "group" && !config.event.atme) return
                if (test.prefix && !test.atme) {
                  /** 前缀 */
                  if (!testPrefix(config.event.raw_message, test.prefix)) return
                }
                if (test.wholeWord && !test.atme) {
                  /** 全字匹配 */
                  if (Array.isArray(test.text)) {
                    /** 数组text */
                    const isMatch: boolean = test.text.some((item: string | RegExp) => {
                      if (typeof item === "string") {
                        /** 如果text是string就全字匹配 */
                        return item === matchPrefix(config.event.raw_message, test.prefix)
                      } else {
                        /** 否则忽略全字匹配 */
                        return testMessage(item, config.event.raw_message, test.prefix)
                      }
                    })
                    if (!isMatch) return
                  } else {
                    /** 单个text */
                    if (typeof test.text === "string") {
                      /** 如果text是string就全字匹配 */
                      if (test.text !== matchPrefix(config.event.raw_message, test.prefix)) return
                    } else {
                      /** 否则忽略全字匹配 */
                      if (!testMessage(test.text, config.event.raw_message, test.prefix)) return
                    }
                  }
                } else {
                  /** 匹配 */
                  if (Array.isArray(test.text)) {
                    /** 数组text */
                    const isMatch: boolean = test.text.some((item: string | RegExp) => {
                      return testMessage(item, config.event.raw_message, test.prefix)
                    })
                    if (!isMatch) return
                  } else {
                    /** 单个text */
                    if (!testMessage(test.text, config.event.raw_message, test.prefix)) return
                  }
                }
                const message: Types.AnswerResponse | Promise<any> = action(config)
                /** 当返回值为string或array时由客户端接管发送消息的任务，消息为返回值 */
                if (typeof message === "string" || Array.isArray(message)) config.target.sendMsg(message)
                /** 是否跳过其他插件 */
                if (test.skip) return true
              }
            }
          } catch (err) {
            logger.error(err)
          }
        })(this.logger);
      }
    }

    this.pluginStatus = true
    this.initHooks()
  }

  async loadSchedules() {
    let schedulePATH: string
    /** 定义plugins路径 */
    if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") schedulePATH = "./schedules"
    else schedulePATH = "./temp/schedules"
    /** 如果存在自定义插件文件夹名称，则使用自定义 */
    if (this.__config?.path?.schedule) schedulePATH.replace(/schedules$/gi, this.__config.path.schedule)
    /** 尝试创建plugins文件夹 */
    createDir(schedulePATH, this.logger)

    const schedules: Types.Dirs = readDir(schedulePATH, { readDirectory: true, directoryTree: false })
    /** 循环注册定时任务 */
    for (let schedule in schedules) {
      let scheduleName: string = path.basename(schedule)
      /** 防止重名 */
      if (this.schedules[scheduleName]) {
        scheduleName = scheduleName + `(${Object.keys(this.schedules)
          .filter(item => item.replace(/\((\d)+\)$/gi, "") === scheduleName).length
          })`
      }
      this.logger.info(`🕐加载定时任务 [ ${scheduleName} ]`)
      /** TS import导入js文件 */
      let main: Function
      if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") main = eval(`require(schedule)`)
      else main = (await import(schedule)).default
      this.schedules[scheduleName] = () => {
        /** 和加载插件差不多 */
        (function (logger: oicq.Logger, client: oicq.Client, libs: Types.Libs) {
          /** try捕获错误防止定时任务js内容报错 */
          try {
            /** 运行并接收main函数的返回值
             * main函数 >>>必须<<< 返回一个标准的定时任务参数对象
             * 当返回对象时，客户端会接管判断消息内容是否可回答的任务，并在可回答时调用action函数
             * 如果main函数没有任何返回值，将不会注册至定时任务中
             */
            let scheduleOptions: Types.scheduleOptions = main()
            /** 判断main函数是否有返回值 */
            if (scheduleOptions !== void 0) {
              const { date, action, target } = scheduleOptions
              /** 没有action或者target直接退出 */
              if (!action || !target) return
              /** date */
              let cron: string[] | string = []
              if (typeof date === "string") {
                cron = date
              } else {
                const { second, minute, hour, day, dayofweek, month } = date || {}
                if (second) cron.push(String(second))
                else cron.push("*")
                if (minute) cron.push(String(minute))
                else cron.push("*")
                if (hour) cron.push(String(hour))
                else cron.push("*")
                if (day) cron.push(String(day))
                else cron.push("*")
                if (month) cron.push(String(month))
                else cron.push("*")
                if (dayofweek) cron.push(String(dayofweek))
                else cron.push("*")
                cron = cron.join(" ")
              }
              /** target */
              const { group, user } = target
              if ((group && isNaN(Number(group))) || (user && isNaN(Number(user)))) return
              Schedule.scheduleJob(cron, (fireDate: Date) => {
                let target: Types.Target | Types.Target[] = []
                /** 如果有group */
                if (group) {
                  /** 如果group是数组，群发 */
                  if (Array.isArray(group)) {
                    target = []
                    for (let g of group) {
                      const t: Types.Target = client.pickGroup(g)
                      target.push(t)
                      if (user) {
                        /** 如果user是数组，at多个成员 */
                        if (Array.isArray(user)) {
                          const message: Types.AnswerResponse = []
                          for (let u of user) {
                            message.push(oicq.segment.at(Number(u)))
                          }
                          t.sendMsg(message)
                        } else {
                          t.sendMsg(oicq.segment.at(Number(user)))
                        }
                      }
                    }
                  } else {
                    target = client.pickGroup(group)
                    if (user) {
                      /** 如果user是数组，at多个成员 */
                      if (Array.isArray(user)) {
                        const message: Types.AnswerResponse = []
                        for (let u of user) {
                          message.push(oicq.segment.at(Number(u)))
                        }
                        target.sendMsg(message)
                      } else {
                        target.sendMsg(oicq.segment.at(Number(user)))
                      }
                    }
                  }
                } else if (user) {
                  /** 如果只有user */
                  /** 如果user是数组，群发*/
                  if (Array.isArray(user)) {
                    target = []
                    for (let u of user) {
                      target.push(client.pickFriend(u))
                    }
                  } else {
                    target = client.pickFriend(user)
                  }
                }
                /** action */
                if (Array.isArray(target)) {
                  for (let t of target) {
                    const config: Types.scheduleConfig = {
                      target: t,
                      fireDate: fireDate,
                      libs: libs,
                      handle: (answer: Types.AnswerResponse): void => {
                        if (!answer || answer?.length === 0) return
                        /** 发送消息 */
                        config.target.sendMsg(answer)
                      }
                    }
                    const message: Types.AnswerResponse | Promise<any> = action(config)
                    /** 当返回值为string或array时由客户端接管发送消息的任务，消息为返回值 */
                    if (typeof message === "string" || Array.isArray(message)) config.target.sendMsg(message)
                  }
                } else {
                  const config: Types.scheduleConfig = {
                    target: target,
                    fireDate: fireDate,
                    libs: libs,
                    handle: (answer: Types.AnswerResponse): void => {
                      if (!answer || answer?.length === 0) return
                      /** 发送消息 */
                      config.target.sendMsg(answer)
                    }
                  }
                  const message: Types.AnswerResponse | Promise<any> = action(config)
                  /** 当返回值为string或array时由客户端接管发送消息的任务，消息为返回值 */
                  if (typeof message === "string" || Array.isArray(message)) config.target.sendMsg(message)
                }
              })
              logger.info(`💤注册定时任务 [ ${scheduleName} ]`)
            }
          } catch (err) {
            logger.error(err)
          }
        })(this.logger, this.client, this.libs);
      }
    }

    this.scheduleStatus = true
    this.initHooks()
  }

  initHooks() {
    if (!this.pluginStatus || !this.scheduleStatus) return

    if (!this.client) throw new Error("[Error] - - 未找到client对象!")
    /** 创建客户端状态回调 */
    this.onLoginDevice()
    this.onLoginSlider()
    this.onLoginQrcode()
    /** 消息回调 */
    this.onMessage()
    /** 登录成功回调 */
    this.client.on<"system.online">("system.online", (event): void => {
      this.logger.info("> > > 👍 登 录 成 功 👎 < < <")
      /** 初始化定时任务 */
      this.initSchedules()
    });
    this.login()
  }

  initSchedules() {
    for (let schedule in this.schedules) {
      this.schedules[schedule]()
    }
  }

  login() {
    /** 密码 */
    const { pwd } = this.__config?.account
    /** 密码md5 */
    const password_md5 = md5(pwd)
    /** 登录 */
    this.client.login(password_md5)
  }

  doAnswer(config: Types.AnswerConfig) {
    const answerHandle: (answer: Types.AnswerResponse) => void = (answer: Types.AnswerResponse): void => {
      if (!answer || answer?.length === 0) return
      /** 发送消息 */
      config.target.sendMsg(answer)
    }

    config.handle = answerHandle

    for (let key in this.plugins) {
      const isSkip: boolean | void = this.plugins[key](config)
      if (isSkip) break
    }
  }

  onMessage() {
    this.client.on<"message">("message", (event: Types.MessageEvent): void => {
      if (event.message_type === "group") {
        this.doAnswer({ target: this.client.pickGroup(event.group_id), event: event, libs: this.libs })
      } else if (event.message_type === "private") {
        this.doAnswer({ target: this.client.pickUser(event.from_id), event: event, libs: this.libs })
      }
    })
  }

  onLoginDevice() {
    this.client.on<"system.login.device">("system.login.device", (event): void => {
      if (event.url != '') {

        this.logger.info('请选择验证方式，输入 0(url验证) / 1(短信验证)')

        process.stdin.once("data", (c: "0" | "1") => {
          if (String(c).trim() === "0") {
            this.logger.info('点击url验证: ', event.url)
          } else if (String(c).trim() === "1") {
            this.logger.info('输入验证码: ')
            process.stdin.once("data", (code: string) => this.client.submitSmsCode(String(code).trim()))
          }
        })
      }
    })
  }

  onLoginSlider() {
    this.client.on<"system.login.slider">("system.login.slider", (event): void => {

      this.logger.info("输入ticket:")

      process.stdin.once("data", (ticket: string) => {
        this.client.submitSlider(String(ticket).trim())
      })
    })
  }

  onLoginQrcode() {
    this.client.on<"system.login.qrcode">("system.login.qrcode", (event): void => {

      this.logger.info("请扫码")

      process.stdin.once("data", (): void => this.login())
    })
  }

}

export default Client