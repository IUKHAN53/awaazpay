package pk.awaazpay.app.listener

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import android.service.notification.NotificationListenerService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * RN bridge for the payment listener. Exposes permission helpers, config
 * sync, pending-payment drain, and forwards live payment events to JS.
 */
class PaymentListenerModule : Module() {

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is unavailable" }

  override fun definition() = ModuleDefinition {
    Name("PaymentListener")

    Events("onPayment")

    OnCreate {
      // While JS is alive, deliver payments as events
      PaymentNotificationListener.jsEmitter = { source, amount, payer, receivedAt ->
        try {
          sendEvent(
            "onPayment",
            mapOf(
              "source" to source,
              "amount" to amount,
              "payer" to payer,
              "receivedAt" to receivedAt,
            ),
          )
          true
        } catch (e: Exception) {
          false
        }
      }
      Announcer.init(context)
    }

    OnDestroy {
      PaymentNotificationListener.jsEmitter = null
    }

    /** Whether the user has granted Notification Access to our listener. */
    Function("isNotificationAccessGranted") {
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners",
      ) ?: ""
      enabled.split(":").any {
        ComponentName.unflattenFromString(it)?.packageName == context.packageName
      }
    }

    /** Opens the system Notification Access settings screen. */
    Function("openNotificationAccessSettings") {
      context.startActivity(
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    /** Whether we are exempt from battery optimizations. */
    Function("isBatteryExempt") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    /** Asks the system to exempt us from battery optimizations. */
    Function("requestBatteryExemption") {
      context.startActivity(
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
          .setData(Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    /** Whether the device TTS engine can speak Urdu. */
    Function("isUrduTtsAvailable") {
      Announcer.isUrduAvailable()
    }

    /** Whether Android has bound + connected our NotificationListenerService. */
    Function("isListenerConnected") {
      PaymentNotificationListener.connected
    }

    /**
     * Force Android to (re)bind the listener. Fixes the common case where the
     * service doesn't start receiving immediately after access is first granted
     * (otherwise only an app/phone restart kicks it in).
     */
    Function("requestListenerRebind") {
      try {
        NotificationListenerService.requestRebind(
          ComponentName(context, PaymentNotificationListener::class.java),
        )
      } catch (e: Exception) {
        // best-effort
      }
    }

    /** Recent notifications the listener saw (for the Diagnostics screen). */
    Function("getSeenNotifications") {
      NotificationDebug.list().map {
        mapOf(
          "pkg" to it.pkg,
          "title" to it.title,
          "text" to it.text,
          "ts" to it.ts,
          "watched" to it.watched,
          "matched" to it.matched,
        )
      }
    }

    Function("clearSeenNotifications") {
      NotificationDebug.clear()
    }

    /**
     * Sync announcement config from JS settings.
     * extraSenders: { [source]: string[] } — user-added trusted SMS senders.
     */
    Function("setConfig") { language: String, repeat: Int, volume: Double, sources: List<String>, templates: String?, extraSenders: Map<String, List<String>> ->
      PaymentStore.saveConfig(context, language, repeat, volume.toFloat(), sources, templates, extraSenders)
    }

    /**
     * Validate a sender the user wants to add as trusted. Returns false for
     * personal mobile numbers and empty input — the UI blocks the add and
     * explains why, so the allowlist can never be widened to "any number".
     */
    Function("isAdmissibleSender") { sender: String ->
      SenderPolicy.isAdmissibleSenderId(sender)
    }

    /** The built-in official trusted senders per source (read-only in UI). */
    Function("officialSenders") {
      val parser = PaymentParser()
      // Rebuild the default map from the bundled templates
      val out = mutableMapOf<String, List<String>>()
      for (source in listOf("easypaisa", "jazzcash", "bank")) {
        out[source] = parser.sendersForSource(source)
      }
      out
    }

    /** Payments captured while JS was dead; returns and clears the queue. */
    Function("drainPendingPayments") {
      val arr = PaymentStore.drainPending(context)
      (0 until arr.length()).map { i ->
        val o = arr.getJSONObject(i)
        mapOf(
          "source" to o.getString("source"),
          "amount" to o.getLong("amount"),
          "payer" to o.getString("payer"),
          "receivedAt" to o.getLong("receivedAt"),
        )
      }
    }

    /** Speak a test announcement with the current config. */
    Function("announceTest") { language: String, volume: Double ->
      Announcer.announce(
        context,
        ParsedPayment("easypaisa", 1200, "Test", "test"),
        language,
        1,
        volume.toFloat(),
      )
    }

    /**
     * Feed text through the REAL notification pipeline (parse → announce →
     * store → emit), exactly as an incoming wallet notification would. Used to
     * verify the end-to-end flow on emulators / devices without a live wallet
     * app. Returns true if it parsed as a payment.
     */
    Function("simulateNotification") { pkg: String, text: String ->
      PaymentNotificationListener.process(context, pkg, text) != null
    }
  }
}
