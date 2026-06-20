package com.geotech.openlittermap

import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import java.io.File
import java.io.IOException

/**
 * Copies a picked MediaStore URI's original bytes into app cache, returning a stable
 * file the rest of the pipeline can read, persist (the queue survives restarts), and
 * upload. This copy is the load-bearing piece: the picker's content:// grant is
 * temporary, but `imagesArray` is persisted and the uploader reads `img.uri` as a file.
 *
 * Single open of the content URI per photo: open -> copy -> (EXIF is read later from
 * the cached file on disk, not by re-opening the URI).
 */
object MediaCopier {

    fun copyToCache(context: Context, uri: Uri, index: Int): File {
        // Belt-and-suspenders: request the original (unredacted) file when supported.
        // NOT load-bearing — holding READ_MEDIA_IMAGES already yields unredacted bytes —
        // but it covers partial-access edge cases. Falls back to the plain URI on failure.
        val source: Uri =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    MediaStore.setRequireOriginal(uri)
                } catch (e: Exception) {
                    uri
                }
            } else {
                uri
            }

        val dir = File(context.cacheDir, "olm_import").apply { mkdirs() }
        val outFile = File(dir, "olm_${System.currentTimeMillis()}_$index.jpg")

        val input = try {
            context.contentResolver.openInputStream(source)
        } catch (e: Exception) {
            // A decorated (setRequireOriginal) stream can throw under partial access;
            // fall back to the plain stream.
            context.contentResolver.openInputStream(uri)
        } ?: throw IOException("Unable to open input stream for $uri")

        input.use { i ->
            outFile.outputStream().use { o -> i.copyTo(o) }
        }
        return outFile
    }
}
