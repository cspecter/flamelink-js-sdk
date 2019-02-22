import flamelink from '@flamelink/sdk-app'
import { UnsubscribeMethod } from '@flamelink/sdk-app-types'
import {
  FlamelinkSettingsFactory,
  SettingsPublicApi
} from '@flamelink/sdk-settings-types'
import {
  applyOptionsForRTDB,
  pluckResultFields,
  wrap,
  unwrap
} from '@flamelink/sdk-utils'
import { getSettingsRefPath } from './helpers'

const factory: FlamelinkSettingsFactory = context => {
  const api: SettingsPublicApi = {
    ref(ref) {
      const dbService = flamelink._ensureService('database', context)
      return dbService.ref(getSettingsRefPath(ref))
    },

    getRaw({ settingsKey, ...options }) {
      return applyOptionsForRTDB(api.ref(settingsKey), options).once(
        options.event || 'value'
      )
    },

    async get({ settingsKey, ...options }) {
      const pluckFields = pluckResultFields(options.fields)
      const snapshot = await api.getRaw({ settingsKey, ...options })
      const value =
        options.needsWrap && settingsKey
          ? wrap(settingsKey, snapshot.val())
          : snapshot.val()
      const result = await pluckFields(value)
      return options.needsWrap ? unwrap(settingsKey, result) : result
    },

    async setEnvironment(env) {
      context.env = env
      return env
    },

    async getEnvironment() {
      return context.env
    },

    // TODO: Consider checking for supported locales - if we want - don't want to make API request
    async setLocale(locale) {
      context.locale = locale
      return locale
    },

    async getLocale() {
      return context.locale
    },

    async getGlobals(options = {}) {
      return api.get({ ...options, needsWrap: true, settingsKey: 'globals' })
    },

    async getImageSizes(options = {}) {
      return api.get({ ...options, settingsKey: 'general/imageSizes' })
    },

    async getDefaultPermissionsGroup(options = {}) {
      return api.get({
        ...options,
        settingsKey: 'general/defaultPermissionsGroup'
      })
    },

    subscribeRaw({ settingsKey, callback, ...options }) {
      const filteredRef = applyOptionsForRTDB(api.ref(settingsKey), options)

      filteredRef.on(
        options.event || 'value',
        (snapshot: any) => callback(null, snapshot),
        (err: Error) => callback(err, null)
      )

      const unsubscribe: UnsubscribeMethod = () =>
        filteredRef.off(options.event || 'value')
      return unsubscribe
    },

    subscribe({ settingsKey, callback, ...options }) {
      const pluckFields = pluckResultFields(options.fields)

      return api.subscribeRaw({
        settingsKey,
        ...options,
        async callback(err, snapshot) {
          if (err) {
            return callback(err, null)
          }

          const value =
            options.needsWrap && settingsKey
              ? wrap(settingsKey, snapshot.val())
              : snapshot.val()
          const result = await pluckFields(value)

          return callback(
            null,
            options.needsWrap && settingsKey
              ? unwrap(settingsKey, result)
              : result
          )
        }
      })
    },

    subscribeGlobals(options) {
      return api.subscribe({ ...options, settingsKey: 'globals' })
    },

    subscribeImageSizes(options) {
      return api.subscribe({ ...options, settingsKey: 'general/imageSizes' })
    },

    subscribeDefaultPermissionsGroup(options) {
      return api.subscribe({
        ...options,
        settingsKey: 'general/defaultPermissionsGroup'
      })
    }
  }

  return api
}

export default factory
