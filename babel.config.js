module.exports = function (api) {
  api.cache(true);

  const presets = [
      ["@babel/preset-env", {
        "targets": {
          "chrome": "70",
          "ie": "11"
        },
        "useBuiltIns": false
      }]
  ];

  return {
    presets
  };
}