/**
 * Serializes BigInt fields in an object or array of objects.
 * @param {Object|Array} data - The object or array of objects to serialize.
 * @returns {Object|Array} - The serialized object or array.
 */
export function serializeBigInt(data) {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'bigint') {
    return data.toString()
  }

  if (Array.isArray(data)) {
    return data.map(serializeBigInt)
  }

  if (typeof data === 'object') {
    const result = {}
    for (const key in data) {
      result[key] = serializeBigInt(data[key])
    }
    return result
  }

  return data
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
