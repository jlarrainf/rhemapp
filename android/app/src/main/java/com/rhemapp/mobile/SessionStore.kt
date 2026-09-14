package com.rhemapp.mobile

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class SessionStore(context: Context) {
    private val preferences = EncryptedSharedPreferences.create(
        "session",
        MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    val accessToken: String?
        get() = preferences.getString("access_token", null)

    val refreshToken: String?
        get() = preferences.getString("refresh_token", null)

    val deviceId: String?
        get() = preferences.getString("device_id", null)

    fun isAuthenticated(): Boolean = !accessToken.isNullOrBlank()

    fun saveSession(accessToken: String, refreshToken: String) {
        preferences.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .apply()
    }

    fun saveDeviceId(value: String) {
        preferences.edit().putString("device_id", value).apply()
    }

    fun clearDeviceId() {
        preferences.edit().remove("device_id").apply()
    }

    fun clearSession() {
        preferences.edit().clear().apply()
    }
}
