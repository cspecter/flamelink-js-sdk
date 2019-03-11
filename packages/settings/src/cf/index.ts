import flamelink from '@flamelink/sdk-app'
import { FlamelinkFactory, Api, CF } from '@flamelink/sdk-settings-types'
import { applyOptionsForCF, pluckResultFields } from '@flamelink/sdk-utils'

const SETTINGS_COLLECTION = 'fl_settings'

const factory: FlamelinkFactory = context => {
  const api: Api = {
    ref(settingsKey) {
      const firestoreService = flamelink._ensureService('firestore', context)

      return settingsKey
        ? firestoreService.collection(SETTINGS_COLLECTION).doc(settingsKey)
        : firestoreService.collection(SETTINGS_COLLECTION)
      // .where('_fl_meta_.env', '==', context.env)
      // .where('_fl_meta_.locale', '==', context.locale)
    },

    getRaw({ settingsKey, ...options }: CF.Get = {}) {
      return applyOptionsForCF(api.ref(settingsKey), options).get({
        source: options.source || 'default'
      })
    },

    async get({ settingsKey, ...options }: CF.Get = {}) {
      const pluckFields = pluckResultFields(options.fields)
      const snapshot = await api.getRaw({ settingsKey, ...options })

      if (settingsKey) {
        const docData = await pluckFields({ [settingsKey]: snapshot.data() })
        return docData[settingsKey]
      }

      if (snapshot.empty) {
        return []
      }

      const entries: any[] = []
      snapshot.forEach((doc: any) => entries.push(doc.data()))

      return pluckFields(entries)
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

    async getGlobals(options: CF.Get = {}) {
      return api.get({
        ...options,
        settingsKey: 'globals'
      })
    },

    async getImageSizes(options: CF.Get = {}) {
      return api.get({
        ...options,
        settingsKey: 'general',
        fields: ['imageSizes']
      })
    },

    async getDefaultPermissionsGroup(options: CF.Get = {}) {
      return api.get({
        ...options,
        settingsKey: 'general',
        fields: ['defaultPermissionsGroup']
      })
    },

    subscribeRaw({ settingsKey, callback, ...options }: CF.Subscribe) {
      const filtered = applyOptionsForCF(api.ref(settingsKey), options)

      const args = []

      if (!context.usesAdminApp) {
        args.push({
          includeMetadataChanges: !!options.includeMetadataChanges
        })
      }

      args.push(
        (snapshot: any) => callback(null, snapshot),
        (err: Error) => callback(err, null)
      )

      return filtered.onSnapshot(...args)
    },

    subscribe({ settingsKey, callback, changeType, ...options }: CF.Subscribe) {
      const pluckFields = pluckResultFields(options.fields)

      return api.subscribeRaw({
        settingsKey,
        ...options,
        async callback(err, snapshot) {
          if (err) {
            return callback(err, null)
          }

          if (settingsKey) {
            const docData = await pluckFields({
              [settingsKey]: snapshot.data()
            })
            return callback(null, docData[settingsKey])
          }

          if (snapshot.empty) {
            return callback(null, [])
          }

          const entries: any[] = []

          if (changeType) {
            snapshot.docChanges().forEach((change: any) => {
              if (change.type === changeType) {
                entries.push(change.doc.data())
              }
            })

            if (!entries.length) {
              return
            }
          } else {
            snapshot.forEach((doc: any) => entries.push(doc.data()))
          }

          return callback(null, pluckFields(entries))
        }
      })
    },

    subscribeGlobals(options: CF.Subscribe) {
      return api.subscribe({ ...options, settingsKey: 'globals' })
    },

    subscribeImageSizes(options: CF.Subscribe) {
      return api.subscribe({
        ...options,
        settingsKey: 'general',
        fields: ['imageSizes']
      })
    },

    subscribeDefaultPermissionsGroup(options: CF.Subscribe) {
      return api.subscribe({
        ...options,
        settingsKey: 'general',
        fields: ['defaultPermissionsGroup']
      })
    }
  }

  return api
}

export default factory
