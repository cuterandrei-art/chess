package com.openingtrainer.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The Android app's reminders. The page keeps a snapshot of when each review
 * and missed puzzle falls due (AndroidBridge.setReminder); an inexact alarm
 * wakes this receiver at your hour, it counts what is due at that moment
 * (RemindLogic) and posts one notification a day. After a reboot the alarm is
 * set again. Nothing leaves the phone.
 */
public class ReminderReceiver extends BroadcastReceiver {

    static final String ACTION_CHECK = "com.openingtrainer.app.REMIND_CHECK";
    static final String ACTION_OPEN_DUE = "com.openingtrainer.app.OPEN_DUE";
    static final String PREFS = "remind";
    private static final String CHANNEL = "due";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_CHECK.equals(action)) check(ctx, System.currentTimeMillis());
        schedule(ctx);   // boot, or after a check: set the next one
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static long[] times(JSONObject o, String key) {
        JSONArray a = o.optJSONArray(key);
        if (a == null) return new long[0];
        long[] out = new long[a.length()];
        for (int i = 0; i < out.length; i++) out[i] = a.optLong(i);
        return out;
    }

    private static JSONObject snapshot(Context ctx) {
        try {
            String s = prefs(ctx).getString("snap", null);
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    static String decide(Context ctx, long now) {
        JSONObject o = snapshot(ctx);
        if (o == null) return null;
        return RemindLogic.decide(o.optBoolean("on"), o.optInt("hour", 19), o.optBoolean("reviews", true),
                o.optBoolean("puzzles", true), o.optBoolean("streak", true), times(o, "reviewTimes"),
                times(o, "puzzleTimes"), o.optInt("streakDays"), o.isNull("lastActive") ? null : o.optString("lastActive", null),
                now, prefs(ctx).getString("sent", null));
    }

    static void check(Context ctx, long now) {
        if (MainActivity.inFront) return;          // on screen, the app says it itself
        String text = decide(ctx, now);
        if (text == null) return;
        prefs(ctx).edit().putString("sent", RemindLogic.dayKey(now)).apply();
        post(ctx, text);
    }

    static void schedule(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(ACTION_CHECK);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 0, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        JSONObject o = snapshot(ctx);
        if (o == null || !o.optBoolean("on")) {
            am.cancel(pi);
            return;
        }
        long now = System.currentTimeMillis();
        boolean sentToday = RemindLogic.dayKey(now).equals(prefs(ctx).getString("sent", null));
        long when = RemindLogic.nextCheck(o.optInt("hour", 19), times(o, "reviewTimes"), times(o, "puzzleTimes"), now, sentToday);
        // inexact and not waking the phone: it is shown when the phone is next in use
        am.set(AlarmManager.RTC, when, pi);
    }

    static String permission(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            return prefs(ctx).getBoolean("asked", false) ? "denied" : "default";
        }
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        return (nm != null && nm.areNotificationsEnabled()) ? "granted" : "denied";
    }

    @SuppressWarnings("deprecation")
    static void post(Context ctx, String text) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Reminders", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("When opening reviews or missed puzzles are due");
            nm.createNotificationChannel(ch);
            b = new Notification.Builder(ctx, CHANNEL);
        } else {
            b = new Notification.Builder(ctx);
        }
        Intent open = new Intent(ctx, MainActivity.class).setAction(ACTION_OPEN_DUE)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(ctx, 1, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        b.setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle("Chess Career")
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true);
        try {
            nm.notify(1, b.build());
        } catch (SecurityException ignored) {
            // permission withdrawn since the check
        }
    }
}
