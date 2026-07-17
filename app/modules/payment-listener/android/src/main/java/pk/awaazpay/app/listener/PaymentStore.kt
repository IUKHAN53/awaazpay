package pk.awaazpay.app.listener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * SharedPreferences-backed storage shared by the NotificationListenerService
 * and the RN module:
 *  - config (language / repeat / volume / enabled sources / templates)
 *  - pending payments captured while the JS runtime was dead, flushed to RN
 *    on next launch
 *  - dedupe keys so a re-posted notification (or notification + SMS pair)
 *    announces only once
 */
object PaymentStore {

  private const val PREFS = "awaazpay_listener"
  private const val KEY_CONFIG = "config"
  private const val KEY_PENDING = "pending"
  private const val KEY_DEDUPE = "dedupe"
  private const val DEDUPE_WINDOW_MS = 3 * 60_000L
  private const val MAX_PENDING = 200

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // ---- Config ----

  data class Config(
    val language: String,
    val repeat: Int,
    val volume: Float,
    val enabledSources: Set<String>,
    val templatesJson: String?,
    /** User-added trusted SMS senders per source. */
    val extraSenders: Map<String, Set<String>>,
  )

  fun saveConfig(
    context: Context,
    language: String,
    repeat: Int,
    volume: Float,
    enabledSources: List<String>,
    templatesJson: String?,
    extraSenders: Map<String, List<String>>,
  ) {
    val sendersObj = JSONObject()
    for ((source, ids) in extraSenders) {
      // Persist only admissible sender IDs — personal numbers are never stored
      val safe = ids.filter { SenderPolicy.isAdmissibleSenderId(it) }
      if (safe.isNotEmpty()) sendersObj.put(source, JSONArray(safe))
    }
    val o = JSONObject()
      .put("language", language)
      .put("repeat", repeat)
      .put("volume", volume.toDouble())
      .put("sources", JSONArray(enabledSources))
      .put("extraSenders", sendersObj)
    if (templatesJson != null) o.put("templates", templatesJson)
    prefs(context).edit().putString(KEY_CONFIG, o.toString()).apply()
  }

  fun loadConfig(context: Context): Config {
    val raw = prefs(context).getString(KEY_CONFIG, null)
      ?: return Config("ur", 2, 1f, setOf("easypaisa", "jazzcash"), null, emptyMap())
    val o = JSONObject(raw)
    val sources = mutableSetOf<String>()
    o.optJSONArray("sources")?.let { arr ->
      for (i in 0 until arr.length()) sources.add(arr.getString(i))
    }
    val extra = mutableMapOf<String, Set<String>>()
    o.optJSONObject("extraSenders")?.let { obj ->
      for (key in obj.keys()) {
        val arr = obj.getJSONArray(key)
        extra[key] = (0 until arr.length()).map { arr.getString(it) }.toSet()
      }
    }
    return Config(
      language = o.optString("language", "ur"),
      repeat = o.optInt("repeat", 2),
      volume = o.optDouble("volume", 1.0).toFloat(),
      enabledSources = sources,
      templatesJson = if (o.has("templates")) o.getString("templates") else null,
      extraSenders = extra,
    )
  }

  // ---- Dedupe ----

  /** Returns true when this payment was already seen inside the window. */
  fun isDuplicate(context: Context, p: ParsedPayment): Boolean {
    val now = System.currentTimeMillis()
    val key = "${p.source}:${p.amount}"
    val raw = prefs(context).getString(KEY_DEDUPE, "{}") ?: "{}"
    val o = JSONObject(raw)

    // Drop expired entries while we're here
    val fresh = JSONObject()
    for (k in o.keys()) {
      val ts = o.getLong(k)
      if (now - ts < DEDUPE_WINDOW_MS) fresh.put(k, ts)
    }

    val dup = fresh.has(key)
    if (!dup) fresh.put(key, now)
    prefs(context).edit().putString(KEY_DEDUPE, fresh.toString()).apply()
    return dup
  }

  // ---- Pending payments (captured while JS dead) ----

  fun appendPending(context: Context, p: ParsedPayment, receivedAt: Long) {
    val raw = prefs(context).getString(KEY_PENDING, "[]") ?: "[]"
    val arr = JSONArray(raw)
    arr.put(
      JSONObject()
        .put("source", p.source)
        .put("amount", p.amount)
        .put("payer", p.payer)
        .put("txnId", p.txnId ?: "")
        .put("receivedAt", receivedAt),
    )
    // Cap growth
    val trimmed = if (arr.length() > MAX_PENDING) {
      JSONArray().also { out ->
        for (i in arr.length() - MAX_PENDING until arr.length()) out.put(arr.get(i))
      }
    } else arr
    prefs(context).edit().putString(KEY_PENDING, trimmed.toString()).apply()
  }

  /** Returns pending payments and clears the queue. */
  fun drainPending(context: Context): JSONArray {
    val raw = prefs(context).getString(KEY_PENDING, "[]") ?: "[]"
    prefs(context).edit().putString(KEY_PENDING, "[]").apply()
    return JSONArray(raw)
  }
}
