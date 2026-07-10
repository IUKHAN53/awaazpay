package pk.awaazpay.app.listener

import android.app.Notification
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * PRIMARY payment detector. Watches notifications posted by the wallet/bank
 * apps, parses out amount + payer, announces, stores, and (when the RN
 * runtime is alive) emits an event to JS.
 *
 * Runs independently of the React Native app process lifecycle — this is why
 * detection + announcement live natively.
 */
class PaymentNotificationListener : NotificationListenerService() {

  companion object {
    private const val TAG = "AwaazPayListener"

    /** True once Android has bound + connected this listener service. */
    @Volatile var connected: Boolean = false

    /** Set by PaymentListenerModule while the RN runtime is alive. */
    @Volatile var jsEmitter: ((source: String, amount: Long, payer: String, receivedAt: Long) -> Boolean)? = null

    /**
     * The shared payment pipeline: parse → filter by enabled source → dedupe →
     * announce → emit to JS (or queue if JS is dead). Called both by the live
     * NotificationListenerService and by the module's test simulator, so the
     * two paths are byte-for-byte identical.
     */
    fun process(context: Context, pkg: String, combinedText: String): ParsedPayment? {
      val config = PaymentStore.loadConfig(context)
      val parser = PaymentParser(config.templatesJson).apply { setExtraSenders(config.extraSenders) }
      val payment = parser.parseNotification(pkg, combinedText) ?: return null

      if (payment.source !in config.enabledSources) {
        Log.i(TAG, "Source ${payment.source} disabled, skipping")
        return null
      }
      if (PaymentStore.isDuplicate(context, payment)) {
        Log.i(TAG, "Duplicate payment skipped: ${payment.source} ${payment.amount}")
        return null
      }

      Log.i(TAG, "Payment detected: ${payment.source} Rs ${payment.amount}")
      val receivedAt = System.currentTimeMillis()
      Announcer.announce(context, payment, config.language, config.repeat, config.volume)
      val delivered = jsEmitter?.invoke(payment.source, payment.amount, payment.payer, receivedAt) ?: false
      if (!delivered) PaymentStore.appendPending(context, payment, receivedAt)
      return payment
    }
  }

  override fun onCreate() {
    super.onCreate()
    Announcer.init(this)
    Log.i(TAG, "Listener created")
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      handle(sbn)
    } catch (e: Exception) {
      // Never let a parse crash take down the listener service
      Log.e(TAG, "Error handling notification", e)
    }
  }

  private fun handle(sbn: StatusBarNotification) {
    val pkg = sbn.packageName ?: return
    if (pkg == packageName) return // ignore our own notifications

    val extras = sbn.notification?.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val big = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
    val body = if (big.length > text.length) big else text
    val combined = listOf(title, body).filter { it.isNotBlank() }.joinToString(". ")

    // Run the payment pipeline (no-ops for non-payment / unwatched packages).
    val payment = if (combined.isBlank()) null else process(this, pkg, combined)

    // Diagnostics: record EVERY notification we see so the user/dev can find the
    // real wallet package + wording and confirm the listener is actually alive.
    val parser = PaymentParser(PaymentStore.loadConfig(this).templatesJson)
    NotificationDebug.record(
      NotificationDebug.Seen(
        pkg = pkg,
        title = title,
        text = body,
        ts = System.currentTimeMillis(),
        watched = pkg in parser.watchedPackages(),
        matched = payment != null,
      ),
    )
    Log.d(TAG, "seen pkg=$pkg matched=${payment != null}")
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    connected = true
    Log.i(TAG, "Listener connected")
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    connected = false
    Log.w(TAG, "Listener disconnected")
  }
}
