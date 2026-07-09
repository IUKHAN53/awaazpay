package pk.awaazpay.app.listener

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

/**
 * Speaks payment announcements. TTS-first:
 *  - Urdu via ur-PK TextToSpeech when the engine supports it, otherwise
 *    falls back to English so the shopkeeper still hears *something*.
 *  - Concatenative pre-recorded Urdu clips (the plan's target for budget
 *    phones with no Urdu TTS voice) plug in behind this same interface later.
 *
 * Singleton so the NotificationListenerService and the RN module share one
 * warmed-up engine.
 */
object Announcer {

  private const val TAG = "AwaazPayAnnouncer"

  @Volatile private var tts: TextToSpeech? = null
  @Volatile private var ready = false
  @Volatile private var urduAvailable = false

  fun init(context: Context) {
    if (tts != null) return
    synchronized(this) {
      if (tts != null) return
      tts = TextToSpeech(context.applicationContext) { status ->
        ready = status == TextToSpeech.SUCCESS
        if (ready) {
          val result = tts?.isLanguageAvailable(Locale("ur", "PK")) ?: TextToSpeech.LANG_NOT_SUPPORTED
          urduAvailable = result >= TextToSpeech.LANG_AVAILABLE
          tts?.setAudioAttributes(
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
              .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
              .build(),
          )
          Log.i(TAG, "TTS ready, urduAvailable=$urduAvailable")
        } else {
          Log.w(TAG, "TTS init failed: $status")
        }
      }
    }
  }

  fun isUrduAvailable(): Boolean = urduAvailable

  /**
   * Announce a payment. [language] "ur" or "en"; [repeat] 1..3;
   * [volume] 0..1 applied per-utterance.
   */
  fun announce(
    context: Context,
    payment: ParsedPayment,
    language: String,
    repeat: Int,
    volume: Float,
  ) {
    init(context)
    val engine = tts ?: return
    if (!ready) {
      Log.w(TAG, "TTS not ready, dropping announcement")
      return
    }

    val useUrdu = language == "ur" && urduAvailable
    val text = if (useUrdu) {
      UrduNumbers.announcementUrdu(payment.source, payment.amount)
    } else {
      UrduNumbers.announcementEnglish(payment.source, payment.amount)
    }
    engine.language = if (useUrdu) Locale("ur", "PK") else Locale.US

    val params = Bundle().apply {
      putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume.coerceIn(0.2f, 1f))
      putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC)
    }

    for (i in 0 until repeat.coerceIn(1, 3)) {
      val mode = if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
      engine.speak(text, mode, params, "awaazpay-${payment.hashCode()}-$i")
      // Small silence between repeats
      if (i < repeat - 1) engine.playSilentUtterance(600, TextToSpeech.QUEUE_ADD, null)
    }
  }

  fun shutdown() {
    synchronized(this) {
      tts?.shutdown()
      tts = null
      ready = false
    }
  }
}
