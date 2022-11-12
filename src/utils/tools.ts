import * as fs from 'fs'
import * as path from 'path'
import { Dirs, ReadDirOptions } from '../types/index'
import { Logger } from 'oicq'

/** 读取文件夹 */
export const readDir = (url: string, options?: ReadDirOptions): Dirs => {
  url = path.resolve(url)

  let dir: Dirs = {}

  const dirInfo = fs.readdirSync(url);

  dirInfo.forEach(item => {
    const location = path.join(url, item);
    const info = fs.statSync(location);

    if (!(!options?.filter)) {
      if (!options.filter.test(location)) return
    }

    if (info.isDirectory()) {
      if (!(!options?.readDirectory)) {
        const childDir = readDir(location, options);
        if (!(!options?.directoryTree)) {
          dir[location] = info
          dir[location]["children"] = childDir
        } else {
          for (let child in childDir) {
            dir[child] = childDir[child]
          }
        }
      }
    } else {
      dir[location] = info
    }
  });

  return dir
}

/** 创建文件夹，会自动创建不存在的父级文件夹，若文件夹存在则不会做任何操作 */
export const createDir = (dirPATH: string, logger?: Logger): void => {
  dirPATH = path.resolve(dirPATH)

  try {
    if (!fs.existsSync(dirPATH)) {
      createDir(path.dirname(dirPATH))
      fs.mkdirSync(dirPATH)
      if (logger) logger.info(`新建文件夹${dirPATH}`)
      else console.log(` - - - 新建文件夹${dirPATH} - - -`);
    }
  } catch { }
}