package com.rhemapp.mobile

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SessionStore(context: Context) {
    private val preferences = EncryptedSharedPreferences.create(
        context,
        "session",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    val accessToken: String? get() = preferences.getString("access_token", null)
    val refreshToken: String? get() = preferences.getString("refresh_token", null)
    val deviceId: String? get() = preferences.getString("device_id", null)

    fun isAuthenticated(): Boolean = !accessToken.isNullOrBlank() && !refreshToken.isNullOrBlank()

    fun saveSession(accessToken: String, refreshToken: String) {
        preferences.edit().putString("access_token", accessToken).putString("refresh_token", refreshToken).apply()
    }

    fun saveDeviceId(deviceId: String) {
        preferences.edit().putString("device_id", deviceId).apply()
    }

    fun clearDeviceId() {
        preferences.edit().remove("device_id").apply()
    }

    fun clearSession() {
        preferences.edit().clear().apply()
    }
}
