package com.rhemapp.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

class MainActivity : ComponentActivity() {
    private var pendingDeepLink by mutableStateOf<Uri?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingDeepLink = intent?.data
        val api = RhemappApiClient(this)
        val googleAuth = GoogleAuthClient(this)
        setContent { RhemappTheme { RhemappApp(api, googleAuth, pendingDeepLink) { pendingDeepLink = null } } }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink = intent?.data
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RhemappApp(api: RhemappApiClient, googleAuth: GoogleAuthClient, deepLink: Uri?, onDeepLinkConsumed: () -> Unit) {
	var authenticated by remember { mutableStateOf(api.isAuthenticated()) }
	var screen by remember { mutableStateOf("daily") }

	LaunchedEffect(authenticated) { if (authenticated) api.refreshSession() }
	LaunchedEffect(deepLink) {
		if (parseCalendarMonth(deepLink) != null) screen = "calendar"
		else if (parseDailyDate(deepLink) != null) screen = "daily"
	}

    if (!authenticated) {
        LoginScreen(
            onLogin = { email, password -> api.login(email, password); authenticated = true },
            onGoogleLogin = { api.loginWithGoogle(googleAuth.signIn()); authenticated = true },
        )
        return
    }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(when (screen) { "daily" -> "Lecturas del día"; "calendar" -> "Calendario litúrgico"; else -> "Preferencias" }) },
            actions = {
                TextButton(onClick = { screen = if (screen == "calendar") "daily" else "calendar" }) { Text(if (screen == "calendar") "Lectura" else "Calendario") }
                TextButton(onClick = { screen = if (screen == "settings") "daily" else "settings" }) { Text(if (screen == "settings") "Lectura" else "Preferencias") }
                TextButton(onClick = { api.logout(); authenticated = false }) { Text("Salir") }
            },
        )
    }) { padding ->
        when (screen) {
            "daily" -> DailyScreen(api, deepLink, onDeepLinkConsumed, padding)
            "calendar" -> CalendarScreen(api, deepLink, onDeepLinkConsumed, padding) { screen = "daily" }
            else -> NotificationSettingsScreen(api, padding)
        }
    }
}

@Composable
private fun LoginScreen(onLogin: suspend (String, String) -> Unit, onGoogleLogin: suspend () -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var pending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Rhemapp", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(8.dp))
        Text("Inicia sesión para conservar tus preferencias.")
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(email, { email = it }, label = { Text("Correo electrónico") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(password, { password = it }, label = { Text("Contraseña") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) { Spacer(Modifier.height(12.dp)); Text(error, color = MaterialTheme.colorScheme.error) }
        Spacer(Modifier.height(20.dp))
        Button(onClick = {
            pending = true; error = ""
            scope.launch {
                try { withContext(Dispatchers.IO) { onLogin(email.trim(), password) } }
                catch (cause: Exception) { error = cause.message ?: "No se pudo iniciar sesión." }
                finally { pending = false }
            }
        }, enabled = !pending && email.isNotBlank() && password.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
            if (pending) CircularProgressIndicator(modifier = Modifier.height(20.dp)) else Text("Iniciar sesión")
        }
        Spacer(Modifier.height(12.dp))
        Text("o", style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(12.dp))
        OutlinedButton(onClick = {
            pending = true; error = ""
            scope.launch {
                try { onGoogleLogin() }
                catch (cause: Exception) { error = cause.message ?: "No se pudo iniciar sesión con Google." }
                finally { pending = false }
            }
        }, enabled = !pending, modifier = Modifier.fillMaxWidth()) {
            if (pending) CircularProgressIndicator(modifier = Modifier.height(20.dp)) else Text("Continuar con Google")
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

    fun load() {
        scope.launch {
            pending = true; error = ""
            try { reading = api.getDailyReading(dateKey) }
            catch (cause: Exception) { error = cause.message ?: "No se pudo cargar la lectura del día." }
            finally { pending = false; onDeepLinkConsumed() }
        }
    }
    LaunchedEffect(dateKey) { load() }

    if (pending) return Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { CircularProgressIndicator(); Spacer(Modifier.height(12.dp)); Text("Cargando la lectura…") }
    if (error.isNotBlank() || reading == null) return Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { Text(error.ifBlank { "No hay una lectura disponible." }, color = MaterialTheme.colorScheme.error); Spacer(Modifier.height(12.dp)); Button(onClick = { load() }) { Text("Reintentar") } }

    val current = reading ?: return
    LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text(current.dateLabel, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.secondary)
            val primary = current.celebrations.firstOrNull { it.isPrimary } ?: current.celebrations.firstOrNull()
            if (primary != null) Text(primary.name, style = MaterialTheme.typography.titleMedium)
            else if (current.celebration.isNotBlank()) Text(current.celebration, style = MaterialTheme.typography.titleMedium)
            current.celebrations.drop(1).forEach { celebration -> Text("${celebration.name} (${celebration.rank.toRankLabel()})", style = MaterialTheme.typography.bodySmall) }
            if (current.liturgicalSeason.isNotBlank() || current.liturgicalColor.isNotBlank()) Text(listOf(current.liturgicalSeason.toSeasonLabel(), current.liturgicalColor.toColorLabel()).filter { it.isNotBlank() }.joinToString(" · "), style = MaterialTheme.typography.bodySmall)
            if (dateKey != null) Text("Lectura abierta desde un aviso", style = MaterialTheme.typography.bodySmall)
        }
        items(current.readings) { item ->
            Column(Modifier.fillMaxWidth()) { Text(item.type.toReadingLabel(), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary); if (item.title.isNotBlank()) Text(item.title, style = MaterialTheme.typography.titleMedium); Text(item.excerpt, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(top = 8.dp)); Text(item.reference, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 8.dp)) }
            HorizontalDivider(modifier = Modifier.padding(top = 16.dp))
        }
    }
}

@Composable
private fun CalendarScreen(api: RhemappApiClient, deepLink: Uri?, onDeepLinkConsumed: () -> Unit, padding: PaddingValues, onOpenDate: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var calendar by remember { mutableStateOf<LiturgicalCalendar?>(null) }
    var pending by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    val monthKey = remember(deepLink) { parseCalendarMonth(deepLink) ?: currentCalendarMonth() }

    fun load() {
        scope.launch {
            pending = true; error = ""
            try { calendar = api.getCalendarMonth(monthKey) }
            catch (cause: Exception) { error = cause.message ?: "No se pudo cargar el calendario litúrgico." }
            finally { pending = false; onDeepLinkConsumed() }
        }
    }
    LaunchedEffect(monthKey) { load() }

    if (pending) return Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { CircularProgressIndicator(); Spacer(Modifier.height(12.dp)); Text("Cargando el calendario…") }
    if (error.isNotBlank() || calendar == null) return Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { Text(error.ifBlank { "No hay un calendario disponible." }, color = MaterialTheme.colorScheme.error); Spacer(Modifier.height(12.dp)); Button(onClick = { load() }) { Text("Reintentar") } }

    val current = calendar ?: return
    LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(current.monthLabel, style = MaterialTheme.typography.headlineSmall); Text("Calendario chileno · zona horaria de Chile", style = MaterialTheme.typography.bodySmall) }
        items(current.days) { day ->
            Column(Modifier.fillMaxWidth()) {
                Text(day.dateLabel, style = MaterialTheme.typography.titleMedium)
                if (day.available) {
                    Text(day.primaryCelebration.ifBlank { "Celebración litúrgica" }, style = MaterialTheme.typography.bodyLarge)
                    if (day.saints.isNotEmpty()) Text("Santos: ${day.saints.joinToString(", ")}", style = MaterialTheme.typography.bodySmall)
                    TextButton(onClick = { onOpenDate(day.dateKey) }) { Text("Abrir lecturas") }
                } else Text("Lecturas no publicadas para este día.", style = MaterialTheme.typography.bodySmall)
                HorizontalDivider(modifier = Modifier.padding(top = 8.dp))
            }
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

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted -> waitingForPermission = false; permissionResult = granted }

    fun savePreferences() {
        saving = true; error = ""; message = ""
        scope.launch {
            try {
                if (preferences.enabled) {
                    if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        waitingForPermission = true; permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS); saving = false; return@launch
                    }
                    api.registerPushToken(withContext(Dispatchers.IO) { FirebaseMessaging.getInstance().token.await() })
                } else api.unregisterPushDevice()
                preferences = api.saveNotificationPreferences(preferences)
                message = if (preferences.enabled) "Avisos activados en este dispositivo." else "Avisos desactivados."
            } catch (cause: Exception) {
                error = cause.message ?: "No se pudieron guardar las preferencias."
                if (preferences.enabled) {
                    preferences = preferences.copy(enabled = false)
                    try { api.saveNotificationPreferences(preferences) } catch (_: Exception) { }
                }
            } finally { saving = false }
        }
    }

    LaunchedEffect(Unit) {
        try { preferences = api.getNotificationPreferences() }
        catch (cause: Exception) { error = cause.message ?: "No se pudieron cargar las preferencias." }
        finally { pending = false }
    }
    LaunchedEffect(permissionResult) {
        when (permissionResult) {
            true -> { permissionResult = null; savePreferences() }
            false -> { permissionResult = null; error = "El permiso fue denegado. Los avisos siguen desactivados."; preferences = preferences.copy(enabled = false); scope.launch { try { api.unregisterPushDevice() } catch (_: Exception) { } } }
            null -> Unit
        }
    }
    if (pending) return Column(Modifier.fillMaxSize().padding(padding), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { CircularProgressIndicator(); Spacer(Modifier.height(12.dp)); Text("Cargando preferencias…") }

    Column(Modifier.fillMaxSize().padding(padding).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Avisos de la lectura", style = MaterialTheme.typography.headlineSmall)
        Text("La hora se interpreta en la zona horaria IANA elegida y se aplica a todos tus dispositivos Android.")
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) { Column(Modifier.weight(1f)) { Text("Aviso diario", style = MaterialTheme.typography.titleMedium); Text("Predeterminado: 08:00 y desactivado.", style = MaterialTheme.typography.bodySmall) }; Switch(checked = preferences.enabled, onCheckedChange = { preferences = preferences.copy(enabled = it) }) }
        OutlinedTextField(preferences.localTime, { preferences = preferences.copy(localTime = it) }, label = { Text("Hora local (HH:MM)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(preferences.timezone, { preferences = preferences.copy(timezone = it) }, label = { Text("Zona horaria IANA") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.secondary)
        Button(onClick = { savePreferences() }, enabled = !saving && !waitingForPermission, modifier = Modifier.fillMaxWidth()) { if (saving) CircularProgressIndicator(modifier = Modifier.height(20.dp)) else Text("Guardar preferencias") }
    }
}

private fun parseDailyDate(uri: Uri?): String? {
    if (uri == null) return null
    val validHost = (uri.scheme == "rhemapp" && uri.host == "daily") || (uri.scheme == "https" && uri.host == "rhemapp.com" && uri.path == "/daily")
    if (!validHost) return null
    val date = uri.getQueryParameter("date") ?: return null
    return if (Regex("\\d{4}-\\d{2}-\\d{2}").matches(date)) date else null
}

private fun parseCalendarMonth(uri: Uri?): String? {
    if (uri == null) return null
    val validHost = (uri.scheme == "rhemapp" && uri.host == "calendar") || (uri.scheme == "https" && uri.host == "rhemapp.com" && uri.path == "/calendario")
    if (!validHost) return null
    val month = uri.getQueryParameter("month") ?: return null
    return if (Regex("\\d{4}-(0[1-9]|1[0-2])").matches(month)) month else null
}

private fun currentCalendarMonth(): String = ZonedDateTime.now(ZoneId.of("America/Santiago")).format(DateTimeFormatter.ofPattern("yyyy-MM"))

private fun String.toReadingLabel(): String = when (this) { "first-reading" -> "Primera lectura"; "psalm" -> "Salmo"; "second-reading" -> "Segunda lectura"; "gospel" -> "Evangelio"; else -> "Lectura" }

private fun String.toRankLabel(): String = when (this) { "weekday" -> "día litúrgico"; "memorial" -> "memoria"; "optional-memorial" -> "memoria opcional"; "feast" -> "fiesta"; "solemnity" -> "solemnidad"; "commemoration" -> "conmemoración"; else -> "celebración" }

private fun String.toSeasonLabel(): String = when (this) { "advent" -> "Adviento"; "christmas" -> "Navidad"; "lent" -> "Cuaresma"; "easter" -> "Pascua"; "ordinary" -> "Tiempo Ordinario"; else -> "" }

private fun String.toColorLabel(): String = when (this) { "green" -> "color verde"; "white" -> "color blanco"; "red" -> "color rojo"; "violet" -> "color violeta"; "rose" -> "color rosa"; "black" -> "color negro"; "gold" -> "color dorado"; else -> "" }

@Composable
private fun RhemappTheme(content: @Composable () -> Unit) { MaterialTheme(content = content) }
