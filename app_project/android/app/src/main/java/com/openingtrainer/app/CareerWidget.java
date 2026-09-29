package com.openingtrainer.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * The home-screen widget: where your career is, your next event (or the one
 * you are in), what is due and your streak. The page hands over a snapshot of
 * the career (AndroidBridge.setWidget) every time it saves; the due counts are
 * worked out here from the reminder snapshot's due times, so they are right at
 * the moment the widget is drawn — every half hour, when the reminder alarm
 * goes, and when the app saves. Nothing leaves the phone.
 */
public class CareerWidget extends AppWidgetProvider {

    static final String PREFS = "widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        RemoteViews v = views(ctx, System.currentTimeMillis());
        for (int id : ids) mgr.updateAppWidget(id, v);
    }

    /** Redraw every widget on the home screen, if there are any. */
    static void refresh(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, CareerWidget.class));
            if (ids == null || ids.length == 0) return;
            m.updateAppWidget(ids, views(ctx, System.currentTimeMillis()));
        } catch (Exception ignored) {
        }
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONObject read(SharedPreferences p) {
        try {
            String s = p.getString("snap", null);
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static long[] times(JSONObject o, String key) {
        JSONArray a = o == null ? null : o.optJSONArray(key);
        if (a == null) return new long[0];
        long[] out = new long[a.length()];
        for (int i = 0; i < out.length; i++) out[i] = a.optLong(i);
        return out;
    }

    /** The streak still counts if you trained today or yesterday. */
    private static int streak(JSONObject r, long now) {
        if (r == null) return 0;
        int n = r.optInt("streakDays");
        String last = r.isNull("lastActive") ? null : r.optString("lastActive", null);
        if (n <= 0 || last == null) return 0;
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.add(Calendar.DAY_OF_MONTH, -1);
        return last.equals(RemindLogic.dayKey(now)) || last.equals(RemindLogic.dayKey(c.getTimeInMillis())) ? n : 0;
    }

    static RemoteViews views(Context ctx, long now) {
        JSONObject w = read(prefs(ctx));
        JSONObject r = read(ReminderReceiver.prefs(ctx));
        JSONObject car = w == null ? null : w.optJSONObject("career");
        JSONObject tour = car == null ? null : car.optJSONObject("tour");
        JSONObject next = car == null ? null : car.optJSONObject("next");
        int rd = RemindLogic.countDue(times(r, "reviewTimes"), now);
        int pd = RemindLogic.countDue(times(r, "puzzleTimes"), now);

        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_career);
        v.setTextViewText(R.id.w_head, WidgetLogic.head(car == null ? 0 : car.optInt("year"), car == null ? 0 : car.optInt("week")));
        v.setTextViewText(R.id.w_career, car == null ? WidgetLogic.career(null, null, null, 0, 0)
                : WidgetLogic.career(car.optString("flag", ""), car.optString("name", ""), car.optString("title", ""),
                car.optInt("rating"), car.optInt("rank")));
        v.setTextViewText(R.id.w_event, WidgetLogic.event(
                tour == null ? null : tour.optString("name", ""), tour == null ? null : tour.optString("emoji", ""),
                tour == null ? 0 : tour.optInt("round"), tour == null ? 0 : tour.optInt("rounds"), tour == null ? 0 : tour.optDouble("score", 0),
                next == null ? null : next.optString("name", ""), next == null ? null : next.optString("emoji", ""),
                next == null ? 0 : next.optInt("inWeeks")));
        v.setTextViewText(R.id.w_due, WidgetLogic.due(rd, pd, streak(r, now)));

        Intent open = new Intent(ctx, MainActivity.class).setAction(Intent.ACTION_MAIN)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent po = PendingIntent.getActivity(ctx, 2, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent due = new Intent(ctx, MainActivity.class).setAction(ReminderReceiver.ACTION_OPEN_DUE)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pdue = PendingIntent.getActivity(ctx, 3, due,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, po);
        v.setOnClickPendingIntent(R.id.w_open, po);
        v.setOnClickPendingIntent(R.id.w_due_btn, pdue);
        return v;
    }
}
