package com.rhemapp.mobile

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class MobileSession(val accessToken: String, val refreshToken: String)
data class NotificationPreferences(val enabled: Boolean, val localTime: String, val timezone: String)
data class ReadingItem(val type: String, val title: String, val reference: String, val excerpt: String)
data class SaintInformationSource(val provider: String, val url: String, val verified: Boolean, val attribution: String)
data class LiturgicalSaint(val name: String, val informationSource: SaintInformationSource?)
data class LiturgicalCelebration(val name: String, val rank: String, val isPrimary: Boolean, val saints: List<LiturgicalSaint>)
data class DailyReading(val dateKey: String, val dateLabel: String, val celebration: String, val celebrations: List<LiturgicalCelebration>, val liturgicalSeason: String, val liturgicalColor: String, val readings: List<ReadingItem>)
data class CalendarDay(val dateKey: String, val dateLabel: String, val primaryCelebration: String, val celebrationRank: String, val saints: List<String>, val liturgicalColor: String, val available: Boolean)
data class LiturgicalCalendar(val month: String, val monthLabel: String, val calendar: String, val timeZone: String, val days: List<CalendarDay>)

class ApiException(val statusCode: Int, override val message: String) : Exception(message)

class RhemappApiClient(context: Context) {
    private val sessionStore = SessionStore(context)
    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')

    fun isAuthenticated(): Boolean = sessionStore.isAuthenticated()

    suspend fun refreshSession(): Boolean = withContext(Dispatchers.IO) {
        val refreshToken = sessionStore.refreshToken ?: return@withContext false
        try {
            val session = request("/api/auth/mobile/refresh", "POST", JSONObject().put("refreshToken", refreshToken), authenticated = false).getJSONObject("session")
            sessionStore.saveSession(session.getString("accessToken"), session.getString("refreshToken"))
            true
        } catch (_: Exception) { false }
    }

    suspend fun login(email: String, password: String): MobileSession = withContext(Dispatchers.IO) {
        val response = request("/api/auth/mobile", "POST", JSONObject().put("email", email).put("password", password), authenticated = false)
        saveSession(response)
    }

    suspend fun loginWithGoogle(credentials: GoogleSignInCredential): MobileSession = withContext(Dispatchers.IO) {
        val response = request("/api/auth/mobile/google", "POST", JSONObject().put("idToken", credentials.idToken).put("nonce", credentials.nonce), authenticated = false)
        saveSession(response)
    }

    fun logout() = sessionStore.clearSession()

    suspend fun getDailyReading(dateKey: String? = null): DailyReading = withContext(Dispatchers.IO) {
        val path = if (dateKey.isNullOrBlank()) "/api/readings?mode=today" else "/api/readings?date=${URLEncoder.encode(dateKey, "UTF-8")}"
        val response = request(path, "GET")
		val readings = response.optJSONArray("readings")
		val items = if (readings != null && readings.length() > 0) readings.toReadingItems() else response.optJSONObject("gospel")?.let { gospel -> listOf(ReadingItem("gospel", gospel.optString("title", gospel.optString("excerpt", "")), gospel.optString("reference", ""), gospel.optString("excerpt", ""))) } ?: emptyList()
		DailyReading(response.optString("dateKey", dateKey ?: ""), response.optString("dateLabel", "Lectura del día"), response.optString("celebration", ""), response.optJSONArray("celebrations")?.toCelebrations() ?: emptyList(), response.optString("liturgicalSeason", ""), response.optString("liturgicalColor", ""), items)
	}

	suspend fun getCalendarMonth(monthKey: String): LiturgicalCalendar = withContext(Dispatchers.IO) {
		val response = request("/api/calendar?month=${URLEncoder.encode(monthKey, "UTF-8")}", "GET")
		val days = response.optJSONArray("days")?.toCalendarDays() ?: emptyList()
		LiturgicalCalendar(response.optString("month", monthKey), response.optString("monthLabel", monthKey), response.optString("calendar", "chile"), response.optString("timeZone", "America/Santiago"), days)
	}

    suspend fun getNotificationPreferences(): NotificationPreferences = withContext(Dispatchers.IO) {
        val preferences = request("/api/notification-preferences", "GET").getJSONObject("preferences")
        NotificationPreferences(preferences.optBoolean("enabled", false), preferences.optString("localTime", "08:00"), preferences.optString("timezone", "America/Santiago"))
    }

    suspend fun saveNotificationPreferences(preferences: NotificationPreferences): NotificationPreferences = withContext(Dispatchers.IO) {
        val body = JSONObject().put("enabled", preferences.enabled).put("localTime", preferences.localTime).put("timezone", preferences.timezone)
        val saved = request("/api/notification-preferences", "PATCH", body).getJSONObject("preferences")
        NotificationPreferences(saved.optBoolean("enabled", false), saved.optString("localTime", "08:00"), saved.optString("timezone", "America/Santiago"))
    }

    suspend fun registerPushToken(token: String): String = withContext(Dispatchers.IO) {
        val deviceId = request("/api/push/register", "POST", JSONObject().put("platform", "android").put("token", token)).getJSONObject("device").getString("id")
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
            if (body != null) { doOutput = true; setRequestProperty("Content-Type", "application/json") }
            if (authenticated) sessionStore.accessToken?.let { setRequestProperty("Authorization", "Bearer $it") }
        }
        try {
            body?.toString()?.let { payload -> connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) } }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val responseBody = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val response = parseJsonResponse(responseBody)
            if (status !in 200..299) {
                val errorMessage = response?.optString("error")?.takeIf { it.isNotBlank() } ?: defaultErrorForStatus(status)
                throw ApiException(status, errorMessage)
            }
            return response ?: if (responseBody.isBlank()) JSONObject() else throw ApiException(status, "El servidor devolvió una respuesta no válida. Inténtalo nuevamente.")
        } finally { connection.disconnect() }
    }

    private fun parseJsonResponse(responseBody: String): JSONObject? {
        val trimmedBody = responseBody.trim()
        if (trimmedBody.isBlank()) return null
        if (!trimmedBody.startsWith("{") || !trimmedBody.endsWith("}")) return null
        return runCatching { JSONObject(trimmedBody) }.getOrNull()
    }

    private fun defaultErrorForStatus(statusCode: Int): String = when (statusCode) {
        401, 403 -> "La sesión no es válida. Inicia sesión nuevamente."
        404 -> "El servicio solicitado no está disponible. Inténtalo nuevamente."
        else -> "El servidor no pudo completar la solicitud. Inténtalo nuevamente."
    }

    private fun saveSession(response: JSONObject): MobileSession {
        val session = response.getJSONObject("session")
        val result = MobileSession(session.getString("accessToken"), session.getString("refreshToken"))
        sessionStore.saveSession(result.accessToken, result.refreshToken)
        return result
    }

	private fun JSONArray.toReadingItems(): List<ReadingItem> = buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(ReadingItem(item.optString("type", "reading"), item.optString("title", ""), item.optString("reference", item.optString("excerptReference", "")), item.optString("excerpt", "")))
	}
	}

	private fun JSONArray.toCelebrations(): List<LiturgicalCelebration> = buildList {
		for (index in 0 until length()) {
			val item = optJSONObject(index) ?: continue
			val saints = item.optJSONArray("saints")?.let { saintArray -> buildList {
				for (saintIndex in 0 until saintArray.length()) {
					val saint = saintArray.optJSONObject(saintIndex) ?: continue
					val name = saint.optString("name", "").trim()
					if (name.isNotBlank()) add(LiturgicalSaint(name, saint.optInformationSource()))
				}
			} } ?: emptyList()
			add(LiturgicalCelebration(item.optString("name", ""), item.optString("rank", ""), item.optBoolean("isPrimary", false), saints))
		}
	}

	private fun JSONObject.optInformationSource(): SaintInformationSource? {
		val source = optJSONObject("informationSource") ?: return null
		val provider = source.optString("provider", "").trim()
		val url = source.optString("url", "").trim()
		val scheme = Uri.parse(url).scheme?.lowercase()
		if (provider.isBlank() || url.isBlank() || source.optBoolean("verified", false) != true || scheme !in setOf("http", "https")) return null
		return SaintInformationSource(provider, url, true, source.optString("attribution", provider).trim().ifBlank { provider })
	}

	private fun JSONArray.toCalendarDays(): List<CalendarDay> = buildList {
		for (index in 0 until length()) {
			val item = optJSONObject(index) ?: continue
			val saints = item.optJSONArray("saints")?.let { saintArray -> buildList {
				for (saintIndex in 0 until saintArray.length()) add(saintArray.optString(saintIndex, ""))
			} } ?: emptyList()
			add(CalendarDay(item.optString("date", ""), item.optString("label", ""), item.optString("primaryCelebration", ""), item.optString("celebrationRank", ""), saints.filter { it.isNotBlank() }, item.optString("liturgicalColor", ""), item.optBoolean("available", false)))
		}
	}
}
