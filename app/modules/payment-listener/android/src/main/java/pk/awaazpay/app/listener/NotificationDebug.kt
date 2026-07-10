package pk.awaazpay.app.listener

/**
 * In-memory ring buffer of the most recent notifications the listener saw.
 * Powers the in-app Diagnostics screen so a user/dev can discover the real
 * wallet package name + notification wording (to fix parser templates) and
 * confirm the listener is actually receiving events.
 *
 * Not persisted — cleared on process death. Never leaves the device unless the
 * user chooses to share a screenshot.
 */
object NotificationDebug {

  data class Seen(
    val pkg: String,
    val title: String,
    val text: String,
    val ts: Long,
    val watched: Boolean,
    val matched: Boolean,
  )

  private const val MAX = 40
  private val buffer = ArrayDeque<Seen>()

  @Synchronized
  fun record(s: Seen) {
    buffer.addFirst(s)
    while (buffer.size > MAX) buffer.removeLast()
  }

  @Synchronized
  fun list(): List<Seen> = buffer.toList()

  @Synchronized
  fun clear() = buffer.clear()
}
