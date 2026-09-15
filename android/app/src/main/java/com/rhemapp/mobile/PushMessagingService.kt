package com.rhemapp.mobile

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class PushMessagingService : FirebaseMessagingService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        if (!SessionStore(applicationContext).isAuthenticated()) return
        scope.launch {
            try { RhemappApiClient(applicationContext).registerPushToken(token) } catch (_: Exception) { }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val title = message.data["title"] ?: message.notification?.title ?: "Lectura del día"
        val body = message.data["body"] ?: message.notification?.body ?: "Ya está disponible la lectura del día."
        val date = message.data["date"]
        val url = message.data["url"] ?: if (date.isNullOrBlank()) "https://rhemapp.com/daily" else "https://rhemapp.com/daily?date=$date"
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply { setPackage(packageName) }
        val pendingIntent = PendingIntent.getActivity(this, 1001, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel("daily_reading", "Lectura del día", NotificationManager.IMPORTANCE_DEFAULT))
        val notification = NotificationCompat.Builder(this, "daily_reading")
            .setSmallIcon(com.rhemapp.mobile.R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(this).notify((date ?: "daily").hashCode(), notification)
    }

    override fun onDestroy() { scope.cancel(); super.onDestroy() }
}
