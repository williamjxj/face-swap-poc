import fs from 'fs/promises'
import path from 'path'

export async function deletePublicFile(filePath) {
  if (!filePath) return false

  try {
    // Remove leading slash if present
    const cleanPath = filePath.replace(/^\//, '')
    const fullPath = path.join(process.cwd(), 'public', cleanPath)

    // Check if file exists before attempting to delete
    const fileExists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false)

    if (fileExists) {
      await fs.unlink(fullPath)
      console.log(`[FILE] Deleted file: ${fullPath}`)
      return true
    } else {
      console.log(`[FILE] File not found: ${fullPath}`)
      return true // Consider this a success since the file doesn't exist
    }
  } catch (error) {
    console.warn(`[FILE] Error deleting file: ${error.message}`)
    return false
  }
}

export async function deleteMultipleFiles(filePaths) {
  let success = 0
  let failed = 0

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { success, failed }
  }

  for (const filePath of filePaths) {
    const result = await deletePublicFile(filePath)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}
