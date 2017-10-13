import test from 'ava'

import WebpackVersionHashPlugin from './webpack-version-hash-plugin'

test('default options', t => {
  const plugin = new WebpackVersionHashPlugin()

  t.is(plugin.options.filename, 'version.json')
  t.is(plugin.options.include_date, true)
})

test('hook into webpack emit event', t => {
  t.plan(6)

  const fullHash = Math.random()
  const filename = 'build-version.json'

  const versionPlugin = new WebpackVersionHashPlugin({ filename })

  const compiler = {
    plugin(event, handler) {
      t.is(event, 'emit')

      const compilation = {
        fullHash,
        assets: {},
      }

      handler(compilation, () => {
        const result = compilation.assets[filename]
        t.truthy(result)
        t.true(result.size() > 0)

        t.notThrows(() => {
          const data = JSON.parse(result.source())
          t.is(data.hash, fullHash)
          t.is(typeof data.date, 'string')
        })
      })
    },
  }

  versionPlugin.apply(compiler)
})

test('correct date', t => {
  t.plan(2)

  const filename = 'date.json'
  const start = Date.now()

  const versionPlugin = new WebpackVersionHashPlugin({ filename })

  const compiler = {
    plugin(event, handler) {
      const compilation = {
        assets: {},
      }

      handler(compilation, () => {
        t.notThrows(() => {
          const data = JSON.parse(compilation.assets[filename].source())
          const date = new Date(data.date)
          const now = new Date()

          t.true(date >= start && date <= now)
        })
      })
    },
  }

  versionPlugin.apply(compiler)
})

test('option to hide date', t => {
  t.plan(2)

  const filename = 'no-date.json'

  const versionPlugin = new WebpackVersionHashPlugin({ filename, include_date: false })

  const compiler = {
    plugin(event, handler) {
      const compilation = {
        assets: {},
      }

      handler(compilation, () => {
        t.notThrows(() => {
          const data = JSON.parse(compilation.assets[filename].source())
          t.is(data.date, undefined)
        })
      })
    },
  }

  versionPlugin.apply(compiler)
})
