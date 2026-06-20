package com.geotech.openlittermap

import android.media.ExifInterface
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale

/** GPS coordinates + capture time read from a local image file's EXIF. */
data class ExifGps(val latitude: Double?, val longitude: Double?, val takenAt: Long?)

/**
 * Reads GPS + capture time from a file already on local disk (the cached copy).
 *
 * Uses the framework ExifInterface (API 24+, no extra dependency). Because we read
 * the local copy of the original bytes, GPS is already present — setRequireOriginal
 * is handled at copy time and is only belt-and-suspenders (see MediaCopier).
 */
object GpsExifReader {

    private const val EXIF_DATE_FORMAT = "yyyy:MM:dd HH:mm:ss"

    fun read(file: File): ExifGps {
        return try {
            val exif = ExifInterface(file.absolutePath)
            val latLong = FloatArray(2)
            @Suppress("DEPRECATION")
            val hasGps = exif.getLatLong(latLong)
            val lat = if (hasGps) latLong[0].toDouble() else null
            val lon = if (hasGps) latLong[1].toDouble() else null
            ExifGps(lat, lon, parseTakenAt(exif))
        } catch (e: Exception) {
            ExifGps(null, null, null)
        }
    }

    private fun parseTakenAt(exif: ExifInterface): Long? {
        val raw = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
            ?: exif.getAttribute(ExifInterface.TAG_DATETIME_DIGITIZED)
            ?: exif.getAttribute(ExifInterface.TAG_DATETIME)
            ?: return null
        return try {
            // EXIF carries no timezone — interpret as device-local, mirroring the JS reader.
            val date = SimpleDateFormat(EXIF_DATE_FORMAT, Locale.US).parse(raw) ?: return null
            date.time / 1000
        } catch (e: Exception) {
            null
        }
    }
}
