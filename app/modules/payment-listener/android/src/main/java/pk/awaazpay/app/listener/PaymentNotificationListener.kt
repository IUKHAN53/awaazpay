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

  private lateinit var parser: PaymentParser

  override fun onCreate() {
    super.onCreate()
    val config = PaymentStore.loadConfig(this)
    parser = PaymentParser(config.templatesJson)
    Announcer.init(this)
    Log.i(TAG, "Listener created, watching: ${parser.watchedPackages()}")
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
    Log.d(TAG, "Notification posted by: $pkg") // delivery trace (all packages)
    if (pkg !in parser.watchedPackages()) return

    val extras = sbn.notification?.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val big = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
    val combined = listOf(title, if (big.length > text.length) big else text)
      .filter { it.isNotBlank() }
      .joinToString(". ")
    if (combined.isBlank()) return

    // Shared pipeline: parse → filter → dedupe → announce → emit/queue
    process(this, pkg, combined)
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    Log.i(TAG, "Listener connected")
  }
}
