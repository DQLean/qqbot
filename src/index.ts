/**
 * @author rabbit
 * @name 基于nodejs和oicq的qq机器人脚本
 * @license MIT
 * @version 2.0.1
 * @constructor oicq - https://github.com/takayama-lily/oicq
 * @date 2022-7-16
 * @modify 2022-11-12
 * @description 使用typescript重构整个项目!对于插件格式有一定变化!更简单的插件！
 * @description 现在插件只需要放入指定文件夹即可！
 * @description 现在插件内部不需要操作事件对象，即可配置对消息的检索和发送消息！
 * @description 定时任务不再使用setInterval，而是使用node-schedule作为支持！
 */

import Client from './client'

new Client()
