package pk.awaazpay.app.listener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Restarts the keep-alive service after a reboot so AwaazPay keeps listening
 * without the shopkeeper having to open the app first.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_LOCKED_BOOT_COMPLETED,
      "android.intent.action.QUICKBOOT_POWERON",
      -> KeepAliveService.start(context)
    }
  }
}
