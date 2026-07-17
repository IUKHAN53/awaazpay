package pk.awaazpay.app.listener

/**
 * Kotlin port of src/data/urduNumbers.ts — the announcement must be
 * composable natively so it still speaks when the JS runtime is dead.
 * Keep both implementations in sync.
 */
object UrduNumbers {

  private val ONES = arrayOf(
    "صفر", "ایک", "دو", "تین", "چار", "پانچ", "چھ", "سات", "آٹھ", "نو",
    "دس", "گیارہ", "بارہ", "تیرہ", "چودہ", "پندرہ", "سولہ", "سترہ", "اٹھارہ", "انیس",
    "بیس", "اکیس", "بائیس", "تئیس", "چوبیس", "پچیس", "چھبیس", "ستائیس", "اٹھائیس", "انتیس",
    "تیس", "اکتیس", "بتیس", "تینتیس", "چونتیس", "پینتیس", "چھتیس", "سینتیس", "اڑتیس", "انتالیس",
    "چالیس", "اکتالیس", "بیالیس", "تینتالیس", "چوالیس", "پینتالیس", "چھیالیس", "سینتالیس", "اڑتالیس", "انچاس",
    "پچاس", "اکاون", "باون", "ترپن", "چون", "پچپن", "چھپن", "ستاون", "اٹھاون", "انسٹھ",
    "ساٹھ", "اکسٹھ", "باسٹھ", "ترسٹھ", "چونسٹھ", "پینسٹھ", "چھیاسٹھ", "سڑسٹھ", "اڑسٹھ", "انہتر",
    "ستر", "اکہتر", "بہتر", "تہتر", "چوہتر", "پچہتر", "چھہتر", "ستتر", "اٹھتر", "اناسی",
    "اسی", "اکیاسی", "بیاسی", "تراسی", "چوراسی", "پچاسی", "چھیاسی", "ستاسی", "اٹھاسی", "نواسی",
    "نوے", "اکانوے", "بانوے", "ترانوے", "چورانوے", "پچانوے", "چھیانوے", "ستانوے", "اٹھانوے", "ننانوے",
  )

  private fun below1000(n: Int): String {
    if (n < 100) return ONES[n]
    val h = n / 100
    val rest = n % 100
    val head = "${ONES[h]} سو"
    return if (rest == 0) head else "$head ${ONES[rest]}"
  }

  fun amountToWords(amount: Long): String {
    var n = if (amount < 0) -amount else amount
    if (n == 0L) return ONES[0]

    // Idiomatic "N sau" ONLY for 1100..1900 (1500 = پندرہ سو). Round thousands and
    // larger use standard ہزار decomposition — so 7000 = سات ہزار (NOT ستر سو).
    if (n in 1100..1900 && n % 100 == 0L) {
      return "${ONES[(n / 100).toInt()]} سو"
    }

    val parts = mutableListOf<String>()
    val crore = n / 10_000_000
    if (crore > 0) {
      parts.add("${amountToWords(crore)} کروڑ")
      n %= 10_000_000
    }
    val lakh = (n / 100_000).toInt()
    if (lakh > 0) {
      parts.add("${ONES[lakh]} لاکھ")
      n %= 100_000
    }
    val hazaar = (n / 1000).toInt()
    if (hazaar > 0) {
      parts.add("${ONES[hazaar]} ہزار")
      n %= 1000
    }
    if (n > 0) {
      parts.add(below1000(n.toInt()))
    }
    return parts.joinToString(" ")
  }

  private val SOURCE_URDU = mapOf(
    "easypaisa" to "ایزی پیسہ",
    "jazzcash" to "جاز کیش",
    "bank" to "بینک",
  )

  private val SOURCE_ENGLISH = mapOf(
    "easypaisa" to "Easypaisa",
    "jazzcash" to "JazzCash",
    "bank" to "bank",
  )

  fun announcementUrdu(source: String, amount: Long): String {
    val src = SOURCE_URDU[source] ?: source
    return "$src سے ${amountToWords(amount)} روپے موصول ہوئے"
  }

  fun announcementEnglish(source: String, amount: Long): String {
    val src = SOURCE_ENGLISH[source] ?: source
    return "Received $amount rupees on $src"
  }
}
