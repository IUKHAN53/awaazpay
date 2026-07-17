package pk.awaazpay.app.listener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.service.notification.NotificationListenerService
import android.util.Log

/**
 * Persistent foreground service that keeps the app process alive so the
 * NotificationListenerService stays bound and payments are heard reliably —
 * without this, aggressive OEM battery managers kill the process in the
 * background and detection becomes "hit and miss". Shows an ongoing low-priority
 * notification ("AwaazPay is listening"), the standard soundbox pattern.
 */
class KeepAliveService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notification)
    }

    // Make sure the listener is bound (it may have been killed with the process).
    try {
      NotificationListenerService.requestRebind(
        ComponentName(this, PaymentNotificationListener::class.java),
      )
    } catch (e: Exception) {
      Log.w(TAG, "requestRebind failed", e)
    }

    return START_STICKY // restart if the OS kills us
  }

  private fun buildNotification(): Notification {
    val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL, "AwaazPay listening", NotificationManager.IMPORTANCE_LOW).apply {
        setShowBadge(false)
        description = "Keeps AwaazPay listening for incoming payments"
      }
      mgr.createNotificationChannel(channel)
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    return builder
      .setContentTitle("AwaazPay is listening")
      .setContentText("Announcing payments as they arrive")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .build()
  }

  companion object {
    private const val TAG = "AwaazPayKeepAlive"
    private const val CHANNEL = "awaazpay_keepalive"
    private const val NOTIF_ID = 4201

    fun start(context: Context) {
      val intent = Intent(context, KeepAliveService::class.java)
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
      } catch (e: Exception) {
        Log.w(TAG, "start failed", e)
      }
    }
  }
}
