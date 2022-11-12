## 中文readme
[readme-zh.md](./readme-zh.md)

## Background
no background

## Install
```shell
$ npm install
```

## Usage
#### development
```shell
$ npm install -g typescript
$ npm run dev
```
#### production
```shell
$ npm run build
$ cd dist
$ node index.js
```

## Plugins
The plug-in file is written by the js file. A function named main needs to be defined as the entry in the entire file.
The main function can accept the parameter config. The config parameter structure is shown below
The main function returns a message reply parameter object, which consists of a test attribute and an action function. See the following for the detailed structure
The main function does not return anything. At this time, the main function is used as an action function. All message retrieval and reply operations must be manually called by the plug-in. The parameters required for the operation are in config
Finally, you need to use the commonJS export, module.exports=main, export the main function as a module
#### Usage
```javascript
function main() {
  return {
    test: {
      text: "Nice to meet u"
    },
    action: action
  }
}
function action(config) {
  return "Me too!"
}
```

### Config
```typescript
type AnswerConfig = {
  /** The message event of oicq depends on what message is currently received */
  event: MessageEvent,
  /** Source object of the current message */
  target: Target,
  /** The library loaded by the client is used for plug-ins that do not want to set npm in the plugins folder and do not want to package js files. The focus is on the oicq library, where segments are used to convert message objects */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}
/** Message Event */
export type MessageEvent = oicq.GroupMessageEvent | oicq.PrivateMessageEvent | oicq.DiscussMessageEvent
/** Message Source Object */
export type Target = oicq.Group | oicq.Friend | oicq.Member | oicq.User | oicq.Discuss
/** Library objects mounted on client */
export type Libs = { [key: string]: any }
/** Message reply plug-in plugins return value specification */
export type AnswerResponse = string | Array<string | segmentElement> | void
```
### main response
```typescript
type pluginOptions = {
  test?: {
    /** Whether it is @bot */
    atme?: boolean,
    /** Whether pre content is required (as the initial string of the message)
     * Invalid when atme is true
     * Ignore if not needed
     */
    prefix?: string,
    /** matching text content, Can be an array */
    text: string | string[],
    /** Whether it is a whole word match. It is invalid when atme is true */
    wholeWord?: boolean,
    /** Succeeded in matching whether to ignore other plugins (plug-ins are executed in the order of file directory names) */
    skip?: boolean
  },
  /**Plug in function execution function
   * There are three return values
   * 1: Standard oicq reply message content object, which can be string or array
   * 2: promise, which is the return value when the action is an asynchronous function
   * 3: void, do not return anything
   * In addition to the first return value, the other two return values need to manually call the handle function in config and pass in the standard oicq reply message content object to execute the reply,
   * Or manually call the sendMsg function in the target object in config to reply
   */
  action: (config: AnswerConfig) => void
}
```

## Schedules
A timed task is a timed trigger event supported by node schedule, which is triggered and executed at a specific time
As with plug-ins, you need a main function as the entry, and you also need to use the module.exports=main to Export it
The main function must have a return value and be the standard timed task configuration object. See the following for the detailed structure
If main does not return anything, this function will not be triggered as a scheduled task!
The main function is different from the plug-in. The main function of the scheduled task does not receive any parameters, and the config function will be received by the action function!
Note that the config here is different from the plug-in. The config in the scheduled task removes the event attribute and adds the fireDate attribute, which is the trigger time

#### Usage
```javascript
function main() {
  return {
    /** "date" attribute can be null, which has the same effect as the following */
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
  return "Trigger scheduled task"
}
module.exports = main
```
### Config
```typescript
type scheduleConfig = {
  /** Source object of the current message */
  target: Target,
  /** Trigger time of scheduled task callback "action" */
  fireDate: Date,
  /** The library loaded by the client is used for plug-ins that do not want to set npm in the plugins folder and do not want to package js files. The focus is on the oicq library, where segments are used to convert message objects */
  libs: Libs,
  handle?: (answer: AnswerResponse) => void
}
/** Message Source Object */
export type Target = oicq.Group | oicq.Friend | oicq.Member | oicq.User | oicq.Discuss
/** Library objects mounted on client */
export type Libs = { [key: string]: any }
/** Message reply plug-in plugins return value specification */
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
  /** The target attribute must have one group or user, and both cannot be empty
   * When the two exist at the same time, the group message will be sent, but the group members in @ user will have priority
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

## Catalogue
### assets
The resource directory is used to store json or other resources. It is recommended that the static resources required by the plug-in also be placed here
### plugins/schedules
Plug in/scheduled task folder, just put the plug in directly
### .template
This directory is not in dist, but the development environment directory.
Plug in authoring template for placing plug-ins/scheduled tasks
### test
This directory is not in dist, but the development environment directory.
The environment directory of plug-in writing and webpack packaging, which is used to write the js and packaging of plug-ins. The webpack and babel have been configured
When packaging, webpack -- entry file name/path is used. After packaging, the file is generated with the index.js file in test/dist

## catalogue
### assets
The resource directory is used to store json or other resources. It is recommended that the static resources required by the plug-in also be placed here

## Badge
no badge

## Contributors
@takayama-lily [oicq](https://github.com/takayama-lily/oicq)

## License
MIT