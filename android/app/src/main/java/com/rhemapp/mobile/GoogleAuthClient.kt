package com.rhemapp.mobile

import android.app.Activity
import android.util.Base64
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialProviderConfigurationException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import java.security.MessageDigest
import java.security.SecureRandom

data class GoogleSignInCredential(val idToken: String, val nonce: String)

class GoogleAuthException(message: String, cause: Throwable? = null) : Exception(message, cause)

class GoogleAuthClient(private val activity: Activity) {
    private val credentialManager = CredentialManager.create(activity)

    suspend fun signIn(): GoogleSignInCredential {
        val clientId = resolveServerClientId()
            ?: throw GoogleAuthException("Google no está configurado para esta versión de la app.")
        val nonce = generateSecureNonce()
        val hashedNonce = hashNonce(nonce)

        try {
            return requestCredential(createSignInWithGoogleRequest(clientId, hashedNonce), nonce)
        } catch (cause: NoCredentialException) {
            logFailure(cause)
            return try {
                requestCredential(createGoogleIdRequest(clientId, hashedNonce), nonce)
            } catch (fallbackCause: Exception) {
                logFailure(fallbackCause)
                throw toUserException(fallbackCause)
            }
        } catch (cause: Exception) {
            logFailure(cause)
            throw toUserException(cause)
        }
    }

    private suspend fun requestCredential(request: GetCredentialRequest, nonce: String): GoogleSignInCredential {
        val result = credentialManager.getCredential(activity, request)
        val credential = result.credential as? CustomCredential
        if (credential == null || (
                credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL &&
                    credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_SIWG_CREDENTIAL
                )
        ) {
            throw GoogleAuthException("No se recibió una credencial válida de Google.")
        }
        val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
        return GoogleSignInCredential(googleCredential.idToken, nonce)
    }

    private fun createSignInWithGoogleRequest(clientId: String, hashedNonce: String): GetCredentialRequest {
        val option = GetSignInWithGoogleOption.Builder(clientId)
            .setNonce(hashedNonce)
            .build()
        return GetCredentialRequest.Builder()
            .addCredentialOption(option)
            .build()
    }

    private fun createGoogleIdRequest(clientId: String, hashedNonce: String): GetCredentialRequest {
        val option = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(clientId)
            .setNonce(hashedNonce)
            .build()
        return GetCredentialRequest.Builder()
            .addCredentialOption(option)
            .build()
    }

    private fun toUserException(cause: Exception): GoogleAuthException = when (cause) {
        is GoogleIdTokenParsingException -> GoogleAuthException(
            "No se pudo validar la cuenta de Google. Inténtalo nuevamente.",
            cause
        )
        is GetCredentialCancellationException -> GoogleAuthException(
            "Inicio de sesión con Google cancelado.",
            cause
        )
        is NoCredentialException -> GoogleAuthException(
            "No se encontró una cuenta de Google disponible en este dispositivo.",
            cause
        )
        is GetCredentialProviderConfigurationException -> GoogleAuthException(
            "Google no está configurado para esta versión de la app.",
            cause
        )
        else -> GoogleAuthException("No se pudo iniciar sesión con Google. Inténtalo nuevamente.", cause)
    }

    private fun logFailure(cause: Throwable) {
        Log.e("RhemappGoogleAuth", "Credential Manager falló: ${cause::class.java.simpleName}")
    }

    private fun resolveServerClientId(): String? {
        BuildConfig.GOOGLE_WEB_CLIENT_ID.trim().takeIf { it.isNotEmpty() }?.let { return it }
        val resourceId = activity.resources.getIdentifier("default_web_client_id", "string", activity.packageName)
        if (resourceId == 0) return null
        return activity.getString(resourceId).trim().takeIf { it.isNotEmpty() }
    }

    private fun generateSecureNonce(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.NO_WRAP or Base64.NO_PADDING or Base64.URL_SAFE)
    }

    private fun hashNonce(nonce: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(nonce.toByteArray(Charsets.UTF_8))
        val hex = "0123456789abcdef"
        return buildString(digest.size * 2) {
            digest.forEach { byte ->
                val value = byte.toInt() and 0xff
                append(hex[value ushr 4])
                append(hex[value and 0x0f])
            }
        }
    }
}
