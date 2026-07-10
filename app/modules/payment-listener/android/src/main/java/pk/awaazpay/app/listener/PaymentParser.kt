package pk.awaazpay.app.listener

import org.json.JSONArray
import org.json.JSONObject

data class ParsedPayment(
  val source: String,
  val amount: Long,
  val payer: String,
  val raw: String,
)

/**
 * Parses payment text (notification title+body, or SMS body) using
 * per-source regex templates. Defaults are bundled below; the JS side can
 * replace them at runtime with server-delivered templates so a wallet app
 * changing its wording never requires an app update.
 *
 * Template JSON shape:
 * [
 *   {
 *     "source": "easypaisa",
 *     "packages": ["pk.com.telenor.phoenix"],
 *     "senders": ["Easypaisa", "3737"],
 *     "patterns": [
 *       { "regex": "received\\s+Rs\\.?\\s*([\\d,]+)(?:\\.\\d+)?\\s+from\\s+([A-Za-z ]+)", "amountGroup": 1, "payerGroup": 2 }
 *     ]
 *   }, ...
 * ]
 */
class PaymentParser(templatesJson: String? = null) {

  private data class Pattern(
    val regex: Regex,
    val amountGroup: Int,
    val payerGroup: Int,
  )

  private data class Template(
    val source: String,
    val packages: Set<String>,
    val senders: Set<String>,
    val patterns: List<Pattern>,
  )

  private var templates: List<Template> = parseTemplates(templatesJson ?: DEFAULT_TEMPLATES)

  /** User-added trusted senders per source (e.g. their bank's short code). */
  private var extraSenders: Map<String, Set<String>> = emptyMap()

  fun updateTemplates(json: String) {
    templates = parseTemplates(json)
  }

  /**
   * Merge user-added trusted senders (from Settings) into the allowlist.
   * Each value is still gated by SenderPolicy at parse time, so a personal
   * number that somehow got persisted here can never actually match.
   */
  fun setExtraSenders(map: Map<String, Set<String>>) {
    extraSenders = map
  }

  private fun allowlistFor(template: Template): Set<String> =
    template.senders + (extraSenders[template.source] ?: emptySet())

  /** All Android package names we should listen to. */
  fun watchedPackages(): Set<String> = templates.flatMap { it.packages }.toSet()

  /** Parse a notification from [packageName] with combined [text]. */
  fun parseNotification(packageName: String, text: String): ParsedPayment? {
    val template = templates.firstOrNull { packageName in it.packages } ?: return null
    return matchPatterns(template, text)
  }

  /** All trusted sender IDs across every source (union of the allowlists). */
  fun allTrustedSenders(): Set<String> = templates.flatMap { it.senders }.toSet()

  /** Built-in official senders for a given source. */
  fun sendersForSource(source: String): List<String> =
    templates.firstOrNull { it.source == source }?.senders?.toList() ?: emptyList()

  /**
   * Parse an SMS from [sender] with [body] (full/sideload flavor only).
   *
   * ANTI-SCAM: the sender must be on a source's trusted allowlist AND pass
   * [SenderPolicy] (never a personal number). A payment-shaped SMS from an
   * untrusted number is dropped before any parsing so it can never announce.
   */
  fun parseSms(sender: String, body: String): ParsedPayment? {
    val template = templates.firstOrNull { t ->
      SenderPolicy.isTrusted(sender, allowlistFor(t))
    } ?: return null
    return matchPatterns(template, body)
  }

  private fun matchPatterns(template: Template, text: String): ParsedPayment? {
    for (p in template.patterns) {
      val m = p.regex.find(text) ?: continue
      val amountStr = m.groupValues.getOrNull(p.amountGroup)?.replace(",", "") ?: continue
      val amount = amountStr.toDoubleOrNull()?.toLong() ?: continue
      if (amount <= 0) continue
      val payer = if (p.payerGroup > 0) {
        m.groupValues.getOrNull(p.payerGroup)?.trim().takeUnless { it.isNullOrBlank() }
      } else null
      return ParsedPayment(template.source, amount, payer ?: "Customer", text)
    }
    return null
  }

  private fun parseTemplates(json: String): List<Template> {
    val arr = JSONArray(json)
    val out = mutableListOf<Template>()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      out.add(
        Template(
          source = o.getString("source"),
          packages = o.optJSONArray("packages").toStringSet(),
          senders = o.optJSONArray("senders").toStringSet(),
          patterns = o.optJSONArray("patterns").toPatterns(),
        ),
      )
    }
    return out
  }

  private fun JSONArray?.toStringSet(): Set<String> {
    if (this == null) return emptySet()
    return (0 until length()).map { getString(it) }.toSet()
  }

  private fun JSONArray?.toPatterns(): List<Pattern> {
    if (this == null) return emptyList()
    return (0 until length()).mapNotNull { i ->
      val o: JSONObject = getJSONObject(i)
      try {
        Pattern(
          regex = Regex(o.getString("regex"), RegexOption.IGNORE_CASE),
          amountGroup = o.optInt("amountGroup", 1),
          payerGroup = o.optInt("payerGroup", 0),
        )
      } catch (e: Exception) {
        null // a broken server-delivered regex must never crash the listener
      }
    }
  }

  companion object {
    /**
     * Best-guess defaults — MUST be validated against real notification/SMS
     * text captured from live Easypaisa/JazzCash apps, then moved to the
     * server-delivered template endpoint.
     */
    const val DEFAULT_TEMPLATES = """
      [
        {
          "source": "easypaisa",
          "packages": ["pk.com.telenor.phoenix", "com.telenor.phoenix", "pk.com.telenor.easypaisa"],
          "senders": ["Easypaisa", "easypaisa", "3737"],
          "patterns": [
            { "regex": "(?:received|credited|payment).{0,25}?(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,25}?from\\s+([A-Za-z0-9\\u0600-\\u06FF +()*-]+?)(?:\\.|,|$)", "amountGroup": 1, "payerGroup": 2 },
            { "regex": "(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,30}?from\\s+([A-Za-z0-9\\u0600-\\u06FF +()*-]+?)(?:\\.|,|$)", "amountGroup": 1, "payerGroup": 2 },
            { "regex": "(?:received|credited|deposited).{0,30}?(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?", "amountGroup": 1, "payerGroup": 0 },
            { "regex": "(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,30}?(?:received|credited|deposited)", "amountGroup": 1, "payerGroup": 0 }
          ]
        },
        {
          "source": "jazzcash",
          "packages": ["com.techlogix.mobilinkcustomer", "com.jazzcash.consumer", "com.jazz.jazzcash"],
          "senders": ["JazzCash", "Jazz Cash", "8558"],
          "patterns": [
            { "regex": "(?:received|credited|payment).{0,25}?(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,25}?from\\s+([A-Za-z0-9\\u0600-\\u06FF +()*-]+?)(?:\\.|,|$)", "amountGroup": 1, "payerGroup": 2 },
            { "regex": "(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,30}?from\\s+([A-Za-z0-9\\u0600-\\u06FF +()*-]+?)(?:\\.|,|$)", "amountGroup": 1, "payerGroup": 2 },
            { "regex": "(?:received|credited|deposited).{0,30}?(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?", "amountGroup": 1, "payerGroup": 0 },
            { "regex": "(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,30}?(?:received|credited|deposited)", "amountGroup": 1, "payerGroup": 0 }
          ]
        },
        {
          "source": "bank",
          "packages": [],
          "senders": ["Meezan Bank", "8079", "HBL", "4250", "UBL", "MCB", "ABL", "Bank Alfalah"],
          "patterns": [
            { "regex": "(?:credited|received|deposited).{0,40}?(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?", "amountGroup": 1, "payerGroup": 0 },
            { "regex": "(?:Rs|PKR|RS)\\.?\\s*([\\d,]+)(?:\\.\\d+)?.{0,40}?(?:credited|received|deposited)", "amountGroup": 1, "payerGroup": 0 }
          ]
        }
      ]
    """
  }
}
