package com.rhemapp.mobile

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class MobileSession(val accessToken: String, val refreshToken: String)

data class NotificationPreferences(
    val enabled: Boolean,
    val localTime: String,
    val timezone: String,
)

data class ReadingItem(
    val type: String,
    val title: String,
    val reference: String,
    val excerpt: String,
)

data class DailyReading(
    val dateKey: String,
    val dateLabel: String,
    val celebration: String,
    val readings: List<ReadingItem>,
)

class ApiException(val statusCode: Int, override val message: String) : Exception(message)

class RhemappApiClient(context: Context) {
    private val sessionStore = SessionStore(context)
    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')

    fun isAuthenticated(): Boolean = sessionStore.isAuthenticated()

    suspend fun refreshSession(): Boolean = withContext(Dispatchers.IO) {
        val refreshToken = sessionStore.refreshToken ?: return@withContext false
        return@withContext try {
            val session = request("/api/auth/mobile/refresh", "POST", JSONObject().put("refreshToken", refreshToken), authenticated = false).getJSONObject("session")
            sessionStore.saveSession(session.getString("accessToken"), session.getString("refreshToken"))
            true
        } catch (_: Exception) {
            false
        }
    }

    suspend fun login(email: String, password: String): MobileSession = withContext(Dispatchers.IO) {
        val body = JSONObject().put("email", email).put("password", password)
        val response = request("/api/auth/mobile", "POST", body, authenticated = false)
        val session = response.getJSONObject("session")
        val result = MobileSession(session.getString("accessToken"), session.getString("refreshToken"))
        sessionStore.saveSession(result.accessToken, result.refreshToken)
        result
    }

    fun logout() {
        sessionStore.clearSession()
    }

    suspend fun getDailyReading(dateKey: String? = null): DailyReading = withContext(Dispatchers.IO) {
        val path = if (dateKey.isNullOrBlank()) "/api/readings?mode=today" else "/api/readings?date=${java.net.URLEncoder.encode(dateKey, "UTF-8")}"
        val response = request(path, "GET", null)
        val readings = response.optJSONArray("readings") ?: JSONArray()
        DailyReading(
            dateKey = response.optString("dateKey", dateKey ?: ""),
            dateLabel = response.optString("dateLabel", "Lectura del día"),
            celebration = response.optString("celebration", ""),
            readings = readings.toReadingItems(),
        )
    }

    suspend fun getNotificationPreferences(): NotificationPreferences = withContext(Dispatchers.IO) {
        val preferences = request("/api/notification-preferences", "GET").getJSONObject("preferences")
        NotificationPreferences(
            enabled = preferences.optBoolean("enabled", false),
            localTime = preferences.optString("localTime", "08:00"),
            timezone = preferences.optString("timezone", "America/Santiago"),
        )
    }

    suspend fun saveNotificationPreferences(preferences: NotificationPreferences) = withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("enabled", preferences.enabled)
            .put("localTime", preferences.localTime)
            .put("timezone", preferences.timezone)
        val response = request("/api/notification-preferences", "PATCH", body)
        val saved = response.getJSONObject("preferences")
        NotificationPreferences(
            enabled = saved.optBoolean("enabled", false),
            localTime = saved.optString("localTime", "08:00"),
            timezone = saved.optString("timezone", "America/Santiago"),
        )
    }

    suspend fun registerPushToken(token: String): String = withContext(Dispatchers.IO) {
        val body = JSONObject().put("platform", "android").put("token", token)
        val deviceId = request("/api/push/register", "POST", body).getJSONObject("device").getString("id")
        sessionStore.saveDeviceId(deviceId)
        deviceId
    }

    suspend fun unregisterPushDevice() = withContext(Dispatchers.IO) {
        val deviceId = sessionStore.deviceId ?: return@withContext
        request("/api/push/unregister", "POST", JSONObject().put("deviceId", deviceId))
        sessionStore.clearDeviceId()
    }

    private fun request(path: String, method: String, body: JSONObject? = null, authenticated: Boolean = true): JSONObject {
        val connection = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15_000
            readTimeout = 20_000
            setRequestProperty("Accept", "application/json")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
            if (authenticated) sessionStore.accessToken?.let { setRequestProperty("Authorization", "Bearer $it") }
        }

        try {
            body?.toString()?.let { payload -> connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) } }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val responseBody = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val response = if (responseBody.isBlank()) JSONObject() else JSONObject(responseBody)
            if (status !in 200..299) throw ApiException(status, response.optString("error", "No se pudo completar la solicitud"))
            return response
        } finally {
            connection.disconnect()
        }
    }

    private fun JSONArray.toReadingItems(): List<ReadingItem> = buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                ReadingItem(
                    type = item.optString("type", "reading"),
                    title = item.optString("title", ""),
                    reference = item.optString("reference", item.optString("excerptReference", "")),
                    excerpt = item.optString("excerpt", ""),
                ),
            )
        }
    }
}
