package pk.awaazpay.app.listener

/**
 * Anti-scam gate for the SMS path.
 *
 * Threat: anyone can text the shop from any number with fake "you received
 * Rs 5000" wording. If we announced that, the shopkeeper hands over goods for
 * money that never arrived. So an SMS is only ever treated as a payment when
 * BOTH hold:
 *   1. its sender is on the trusted allowlist for that source, AND
 *   2. its sender is NOT a personal mobile number.
 *
 * Official wallet/bank alerts always arrive from an alphanumeric sender ID
 * ("Easypaisa", "JazzCash") or a short code (3–6 digits). A real payment
 * notification NEVER comes from a personal MSISDN like 03xx-xxxxxxx, so those
 * are rejected unconditionally — this is the belt to the allowlist's braces,
 * and it's why users are blocked from adding personal numbers as "trusted".
 */
object SenderPolicy {

  // Personal Pakistani mobile formats: 03xxxxxxxxx, 923xxxxxxxxx, +923xxxxxxxxx,
  // and defensively any address carrying 8+ digits (short codes are ≤ 6).
  private val PERSONAL_NUMBER = Regex("""^\+?92?3\d{8,9}$""")
  private val LONG_DIGIT_RUN = Regex("""\d{8,}""")

  /** True when [sender] looks like a personal phone number (never trusted). */
  fun isPersonalNumber(sender: String): Boolean {
    val s = sender.trim().replace(" ", "").replace("-", "")
    if (PERSONAL_NUMBER.containsMatchIn(s)) return true
    // Any 8+ consecutive digits -> a full phone number, not a sender ID/short code
    return LONG_DIGIT_RUN.containsMatchIn(s)
  }

  /**
   * True only when [sender] can safely be admitted to the allowlist:
   * an alphanumeric ID or a short code (≤ 6 digits), and not a personal number.
   * Used both at parse time and to validate user-added senders in Settings.
   */
  fun isAdmissibleSenderId(sender: String): Boolean {
    val s = sender.trim()
    if (s.isEmpty()) return false
    if (isPersonalNumber(s)) return false
    val digitsOnly = s.all { it.isDigit() }
    if (digitsOnly) return s.length in 3..6 // short code
    return true // alphanumeric sender ID (e.g. "Easypaisa")
  }

  /**
   * Final gate: is an SMS from [sender] trusted for a source whose allowlist is
   * [allowlist]? Case-insensitive exact match against the allowlist, and the
   * sender must independently pass the admissibility check.
   */
  fun isTrusted(sender: String, allowlist: Set<String>): Boolean {
    if (!isAdmissibleSenderId(sender)) return false
    val normalized = sender.trim().lowercase()
    return allowlist.any { it.trim().lowercase() == normalized }
  }
}
