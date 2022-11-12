function action(config) {
  const {target, fireDate, libs} = config
  /** Message to reply to */
  let message = "test true"

  /** Code here... */



  /** Code end */

  /** Return the message to reply */
  return message
}

/** Entry */
function main() {
  /** Return schedule configuration information */
  return {
    /** The attribute in "date" must be number or "*" or not set */
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

module.exports = main