import curry from 'lodash/curry'
import reduce from 'lodash/reduce'
import { ImageSize, FileObject } from '@flamelink/sdk-storage-types'

/**
 * @description Return the reference path for the given file in the Cloud Storage Bucket
 * @param {String} filename
 * @param {Object} options
 */
export const getStorageRefPath = (
  filename: string,
  { width, path }: ImageSize = {}
) => {
  if (path) {
    return `/flamelink/media/sized/${path}/${filename}`
  }
  return `/flamelink/media/${width ? `sized/${width}/` : ''}${filename}`
}

/**
 * @description Return the reference path for the given file in the realtime db
 * @param {String} fileID
 */
export const getFileRefPath = (fileID?: string) =>
  `/flamelink/media/files/${fileID || ''}`

/**
 * @description Return the reference path for the given folder in the realtime db
 * @param {String} folderID
 */
export const getFolderRefPath = (folderID?: string) =>
  `/flamelink/media/folders/${folderID || ''}`

/**
 * @description Return the reference path for the media directory in the realtime db
 * @param {String} [mediaRef]
 */
export const getMediaRefPath = (mediaRef?: string) =>
  `/flamelink/media/${mediaRef || ''}`

export const filterByFolderId = curry(
  (folderId?: string | number, files?: FileObject[]) => {
    if (!folderId) {
      return files
    }

    return reduce(
      files,
      (result, val, key) => {
        if (val.folderId === folderId) {
          return Object.assign(result, { [key]: val })
        }
        return result
      },
      {}
    )
  }
)
