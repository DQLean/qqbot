/** tools工具函数中读取文件夹函数的返回值规范 */
export type Dirs = { [key: string]: any }
/** tools工具函数中读取文件夹函数的options参数 */
export type ReadDirOptions = {
  /** 是否读取文件夹 */
  readDirectory?: boolean,
  /** 文件夹是否使用树形结构
   * 使用则文件夹和文件一样带有属性，同时额外带有children属性作为子节点数组
   * 不使用则直接展开文件夹，所有文件处于同一层级
   * 必须在readDirectory为true才能生效
   */
  directoryTree?: boolean,
  /** 文件过滤(正则过滤) */
  filter?: RegExp
}