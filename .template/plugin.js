function action(config) {
  const {target, event, libs} = config
  /** Message to reply to */
  let message = "test true"

  /** Code here... */



  /** Code end */

  /** Return the message to reply */
  return message
}

/** Entry */
function main() {
  /** Return plug-in configuration information */
  return {
    test: {
      atme: false,
      prefix: "#",
      text: "test",
      wholeWord: false,
      skip: false,
      isHook: false
    },
    action
  }
}

module.exports = main