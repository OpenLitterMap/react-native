package com.geotech.openlittermap

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.Executors

/**
 * Android gallery import via MediaStore. Fires ACTION_PICK (the legacy gallery, which
 * returns a real content://media URI — NOT the redacting Photo Picker), then for each
 * pick: copies the original bytes to app cache (MediaCopier), reads GPS + capture time
 * from the cached file (GpsExifReader), and returns the asset to JS.
 *
 * Contract (pinned by utils/pickGeotaggedPhotos tests):
 *   pick({ selectionLimit }) -> Asset[]   (cancel -> [])
 *   Asset = { uri, fileName, type, width, height, fileSize,
 *             latitude|null, longitude|null, takenAt|null, source }
 */
class OlmGalleryModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val executor = Executors.newSingleThreadExecutor()
    private var pendingPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName() = "OlmGallery"

    @ReactMethod
    fun pick(options: ReadableMap, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity to launch the picker")
            return
        }
        if (pendingPromise != null) {
            promise.reject("PICK_IN_PROGRESS", "A photo pick is already in progress")
            return
        }

        val selectionLimit =
            if (options.hasKey("selectionLimit")) options.getInt("selectionLimit") else 1

        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI).apply {
            type = "image/*"
            // selectionLimit !== 1 => multi-select. (Honoured per-OEM; verified in QA.)
            if (selectionLimit != 1) {
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
        }

        pendingPromise = promise
        try {
            activity.startActivityForResult(intent, REQUEST_CODE)
        } catch (e: Exception) {
            pendingPromise = null
            promise.reject("LAUNCH_FAILED", e.message, e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQUEST_CODE) return
        val promise = pendingPromise ?: return
        pendingPromise = null

        if (resultCode != Activity.RESULT_OK || data == null) {
            promise.resolve(Arguments.createArray()) // cancelled -> empty
            return
        }

        val uris = collectUris(data)
        if (uris.isEmpty()) {
            promise.resolve(Arguments.createArray())
            return
        }

        // Copy + EXIF read are I/O — do them off the main thread.
        executor.execute {
            try {
                val result: WritableArray = Arguments.createArray()
                uris.forEachIndexed { index, uri -> result.pushMap(buildAsset(uri, index)) }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("PICK_FAILED", e.message, e)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {}

    private fun collectUris(data: Intent): List<Uri> {
        val clip = data.clipData
        if (clip != null) {
            return (0 until clip.itemCount).mapNotNull { clip.getItemAt(it).uri }
        }
        return data.data?.let { listOf(it) } ?: emptyList()
    }

    private fun buildAsset(uri: Uri, index: Int): WritableMap {
        val context = reactApplicationContext
        val cached = MediaCopier.copyToCache(context, uri, index)
        val gps = GpsExifReader.read(cached)
        val meta = queryMeta(uri)

        return Arguments.createMap().apply {
            putString("uri", "file://${cached.absolutePath}")
            putString("fileName", meta.displayName ?: cached.name)
            putString("type", meta.mimeType ?: "image/jpeg")
            putInt("width", meta.width)
            putInt("height", meta.height)
            putDouble("fileSize", cached.length().toDouble())
            if (gps.latitude != null && gps.longitude != null) {
                putDouble("latitude", gps.latitude)
                putDouble("longitude", gps.longitude)
            } else {
                putNull("latitude")
                putNull("longitude")
            }
            if (gps.takenAt != null) putDouble("takenAt", gps.takenAt.toDouble()) else putNull("takenAt")
            putString("source", "mediastore")
        }
    }

    private data class MediaMeta(
        val displayName: String?,
        val mimeType: String?,
        val width: Int,
        val height: Int
    )

    private fun queryMeta(uri: Uri): MediaMeta {
        val projection = arrayOf(
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.MIME_TYPE,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT
        )
        return try {
            reactApplicationContext.contentResolver
                .query(uri, projection, null, null, null)
                ?.use { c ->
                    if (c.moveToFirst()) {
                        MediaMeta(c.getString(0), c.getString(1), c.getInt(2), c.getInt(3))
                    } else {
                        MediaMeta(null, null, 0, 0)
                    }
                } ?: MediaMeta(null, null, 0, 0)
        } catch (e: Exception) {
            MediaMeta(null, null, 0, 0)
        }
    }

    companion object {
        private const val REQUEST_CODE = 0xA11
    }
}
