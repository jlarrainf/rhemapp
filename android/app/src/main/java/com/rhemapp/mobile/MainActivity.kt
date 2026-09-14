package com.rhemapp.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.TimeZone

class MainActivity : ComponentActivity() {
    private var pendingDeepLink by mutableStateOf<Uri?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingDeepLink = intent?.data
        val api = RhemappApiClient(this)
        setContent {
            RhemappTheme {
                RhemappApp(
                    api = api,
                    deepLink = pendingDeepLink,
                    onDeepLinkConsumed = { pendingDeepLink = null },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink = intent?.data
    }
}

@Composable
private fun RhemappApp(api: RhemappApiClient, deepLink: Uri?, onDeepLinkConsumed: () -> Unit) {
    var authenticated by remember { mutableStateOf(api.isAuthenticated()) }
    var screen by remember { mutableStateOf("daily") }

    LaunchedEffect(authenticated) {
        if (authenticated) api.refreshSession()
    }

    if (!authenticated) {
        LoginScreen(onLogin = { email, password ->
            api.login(email, password)
            authenticated = true
        })
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (screen == "daily") "Lecturas del día" else "Preferencias") },
                actions = {
                    TextButton(onClick = { screen = if (screen == "daily") "settings" else "daily" }) {
                        Text(if (screen == "daily") "Preferencias" else "Lectura")
                    }
                    TextButton(onClick = { api.logout(); authenticated = false }) { Text("Salir") }
                },
            )
        },
    ) { padding ->
        if (screen == "daily") {
            DailyScreen(api, deepLink, onDeepLinkConsumed, padding)
        } else {
            NotificationSettingsScreen(api, padding)
        }
    }
}

@Composable
private fun LoginScreen(onLogin: suspend (String, String) -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Rhemapp", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(8.dp))
        Text("Inicia sesión para conservar tus preferencias.")
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(email, { email = it }, label = { Text("Correo electrónico") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(password, { password = it }, label = { Text("Contraseña") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) {
            Spacer(Modifier.height(12.dp))
            Text(error, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                pending = true
                error = ""
                scope.launch {
                    try {
                        withContext(Dispatchers.IO) { onLogin(email.trim(), password) }
                    } catch (cause: Exception) {
                        error = cause.message ?: "No se pudo iniciar sesión."
                    } finally {
                        pending = false
                    }
                }
            },
            enabled = !pending && email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (pending) CircularProgressIndicator(modifier = Modifier.height(20.dp)) else Text("Iniciar sesión")
        }
    }
}

@Composable
private fun DailyScreen(api: RhemappApiClient, deepLink: Uri?, onDeepLinkConsumed: () -> Unit, padding: PaddingValues) {
    val scope = rememberCoroutineScope()
    var reading by remember { mutableStateOf<DailyReading?>(null) }
    var pending by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    val dateKey = remember(deepLink) { parseDailyDate(deepLink) }

    LaunchedEffect(dateKey) {
        pending = true
        error = ""
        try {
            reading = api.getDailyReading(dateKey)
        } catch (cause: Exception) {
            error = cause.message ?: "No se pudo cargar la lectura del día."
        } finally {
            pending = false
            onDeepLinkConsumed()
        }
    }

    if (pending) {
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text("Cargando la lectura…")
        }
        return
    }
    if (error.isNotBlank() || reading == null) {
        Column(Modifier.fillMaxSize().padding(24.dp).padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(error.ifBlank { "No hay una lectura disponible." }, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(12.dp))
            Button(onClick = { scope.launch { reading = api.getDailyReading(dateKey) } }) { Text("Reintentar") }
        }
        return
    }

    val current = reading ?: return
    LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text(current.dateLabel, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.secondary)
            if (current.celebration.isNotBlank()) Text(current.celebration, style = MaterialTheme.typography.titleMedium)
            if (dateKey != null) Text("Lectura abierta desde un aviso", style = MaterialTheme.typography.bodySmall)
        }
        items(current.readings) { item ->
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(item.type.toReadingLabel(), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                if (item.title.isNotBlank()) Text(item.title, style = MaterialTheme.typography.titleMedium)
                Text(item.excerpt, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(top = 8.dp))
                Text(item.reference, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 8.dp))
            }
            HorizontalDivider(modifier = Modifier.padding(top = 16.dp))
        }
    }
}

@Composable
private fun NotificationSettingsScreen(api: RhemappApiClient, padding: PaddingValues) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var preferences by remember { mutableStateOf(NotificationPreferences(false, "08:00", TimeZone.getDefault().id)) }
    var pending by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var waitingForPermission by remember { mutableStateOf(false) }
    var permissionResult by remember { mutableStateOf<Boolean?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        waitingForPermission = false
        permissionResult = granted
    }

    fun savePreferences() {
        saving = true
        error = ""
        message = ""
        scope.launch {
            try {
                if (preferences.enabled) {
                    if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        waitingForPermission = true
                        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        saving = false
                        return@launch
                    }
                    val token = withContext(Dispatchers.IO) { FirebaseMessaging.getInstance().token.await() }
                    api.registerPushToken(token)
                } else {
                    api.unregisterPushDevice()
                }
                preferences = api.saveNotificationPreferences(preferences)
                message = if (preferences.enabled) "Avisos activados en este dispositivo." else "Avisos desactivados."
            } catch (cause: Exception) {
                error = cause.message ?: "No se pudieron guardar las preferencias."
                if (preferences.enabled) {
                    preferences = preferences.copy(enabled = false)
                    try {
                        api.saveNotificationPreferences(preferences)
                    } catch (_: Exception) {
                        // Keep the local toggle disabled until the next explicit retry.
                    }
                }
            } finally {
                saving = false
            }
        }
    }

    LaunchedEffect(Unit) {
        try {
            preferences = api.getNotificationPreferences().let { current ->
                if (current.timezone.isBlank()) current.copy(timezone = TimeZone.getDefault().id) else current
            }
        } catch (cause: Exception) {
            error = cause.message ?: "No se pudieron cargar las preferencias."
        } finally {
            pending = false
        }
    }

    LaunchedEffect(permissionResult) {
        when (permissionResult) {
            true -> {
                permissionResult = null
                savePreferences()
            }
            false -> {
                permissionResult = null
                error = "El permiso fue denegado. Los avisos siguen desactivados."
                preferences = preferences.copy(enabled = false)
                scope.launch {
                    try {
                        api.unregisterPushDevice()
                    } catch (_: Exception) {
                        // The server-side preference remains unchanged for other devices.
                    }
                }
            }
            null -> Unit
        }
    }

    if (pending) {
        Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text("Cargando preferencias…")
        }
        return
    }

    Column(Modifier.fillMaxSize().padding(padding).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Avisos de la lectura", style = MaterialTheme.typography.headlineSmall)
        Text("La hora se interpreta en la zona horaria IANA elegida y se aplica a todos tus dispositivos Android.")
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.weight(1f)) {
                Text("Aviso diario", style = MaterialTheme.typography.titleMedium)
                Text("Predeterminado: 08:00 y desactivado.", style = MaterialTheme.typography.bodySmall)
            }
            Switch(checked = preferences.enabled, onCheckedChange = { preferences = preferences.copy(enabled = it) })
        }
        OutlinedTextField(preferences.localTime, { preferences = preferences.copy(localTime = it) }, label = { Text("Hora local (HH:MM)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(preferences.timezone, { preferences = preferences.copy(timezone = it) }, label = { Text("Zona horaria IANA") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.secondary)
        Button(onClick = { savePreferences() }, enabled = !saving && !waitingForPermission, modifier = Modifier.fillMaxWidth()) {
            if (saving) CircularProgressIndicator(modifier = Modifier.height(20.dp)) else Text("Guardar preferencias")
        }
    }
}

private fun parseDailyDate(uri: Uri?): String? {
    if (uri == null) return null
    val validHost = (uri.scheme == "rhemapp" && uri.host == "daily") || (uri.scheme == "https" && uri.host == "rhemapp.com" && uri.path?.startsWith("/daily") == true)
    if (!validHost) return null
    val date = uri.getQueryParameter("date") ?: return null
    return if (Regex("\\d{4}-\\d{2}-\\d{2}").matches(date)) date else null
}

private fun String.toReadingLabel(): String = when (this) {
    "first-reading" -> "Primera lectura"
    "psalm" -> "Salmo"
    "second-reading" -> "Segunda lectura"
    "gospel" -> "Evangelio"
    else -> "Lectura"
}

@Composable
private fun RhemappTheme(content: @Composable () -> Unit) {
    MaterialTheme(content = content)
}
