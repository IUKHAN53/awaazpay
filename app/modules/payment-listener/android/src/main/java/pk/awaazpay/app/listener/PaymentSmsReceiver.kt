package pk.awaazpay.app.listener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

/**
 * SECONDARY payment detector — bank credit alerts and wallet SMS when the app
 * isn't installed/logged in. Present ONLY in the `full` (sideload) flavor; the
 * Play-Store `store` flavor ships without RECEIVE_SMS and without this receiver
 * registered (see plugins/withPaymentListener.js).
 *
 * Every message is gated by SenderPolicy (via PaymentParser.parseSms): an SMS
 * from an untrusted or personal number is dropped before parsing, so a scammer
 * texting a fake "Rs 5000 received" from their own phone can never announce.
 */
class PaymentSmsReceiver : BroadcastReceiver() {

  companion object {
    private const val TAG = "AwaazPaySms"
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    try {
      handle(context, intent)
    } catch (e: Exception) {
      Log.e(TAG, "Error handling SMS", e)
    }
  }

  private fun handle(context: Context, intent: Intent) {
    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    if (messages.isEmpty()) return

    // Multipart SMS arrive as several parts from the same sender
    val sender = messages.first().displayOriginatingAddress ?: return
    val body = messages.joinToString("") { it.messageBody ?: "" }
    if (body.isBlank()) return

    val config = PaymentStore.loadConfig(context)
    val parser = PaymentParser(config.templatesJson)
    parser.setExtraSenders(config.extraSenders)

    // parseSms enforces the trusted-sender allowlist + personal-number rejection
    val payment = parser.parseSms(sender, body)
    if (payment == null) {
      Log.i(TAG, "SMS from '$sender' not a trusted payment — ignored")
      return
    }

    if (payment.source !in config.enabledSources) return
    if (PaymentStore.isDuplicate(context, payment)) {
      Log.i(TAG, "Duplicate payment skipped: ${payment.source} ${payment.amount}")
      return
    }

    Log.i(TAG, "Trusted SMS payment: ${payment.source} Rs ${payment.amount} from $sender")
    val receivedAt = System.currentTimeMillis()

    Announcer.announce(context, payment, config.language, config.repeat, config.volume)

    val delivered = PaymentNotificationListener.jsEmitter
      ?.invoke(payment.source, payment.amount, payment.payer, receivedAt) ?: false
    if (!delivered) {
      PaymentStore.appendPending(context, payment, receivedAt)
    }
  }
}
