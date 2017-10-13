function WebpackVersionHashPlugin(opts) {
  this.options = Object.assign({ filename: 'version.json', include_date: true }, opts)
}

WebpackVersionHashPlugin.prototype.apply = function apply(compiler) {
  const filename = this.options.filename


  compiler.plugin('emit', (compilation, callback) => {
    const version = {
      hash: compilation.fullHash,
    }

    if (this.options.include_date) {
      version.date = new Date().toISOString()
    }

    const file = JSON.stringify(version, null, 2)

    compilation.assets[filename] = { /* eslint no-param-reassign: 0 */
      source: () => file,
      size: () => file.length,
    }

    callback()
  })
}

module.exports = WebpackVersionHashPlugin
