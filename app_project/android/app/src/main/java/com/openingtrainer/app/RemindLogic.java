package com.openingtrainer.app;

import java.util.Calendar;

/**
 * Whether a reminder should go out, and what it says. A line-for-line port of
 * remindDecide() in the web app (and in sw.js), kept free of Android classes so
 * validate-remind.mjs can compile and run it next to the JavaScript and check
 * that all three give the same answer.
 */
public final class RemindLogic {

    private RemindLogic() {}

    /** The day of `now` in local time, as the web app writes it: 2026-09-24. */
    public static String dayKey(long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        return String.format(java.util.Locale.ROOT, "%04d-%02d-%02d",
                c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    public static int countDue(long[] times, long now) {
        int n = 0;
        if (times == null) return 0;
        for (int i = 0; i < times.length && times[i] <= now; i++) n++;
        return n;
    }

    public static String text(int rd, int pd, int streak) {
        StringBuilder parts = new StringBuilder();
        if (rd > 0) parts.append(rd).append(" opening review").append(rd == 1 ? "" : "s");
        if (pd > 0) {
            if (parts.length() > 0) parts.append(" and ");
            parts.append(pd).append(" puzzle").append(pd == 1 ? "" : "s").append(" you got wrong");
        }
        if (parts.length() > 0) {
            parts.append(rd + pd == 1 ? " is" : " are").append(" due.");
            if (streak > 0) parts.append(" Keep your ").append(streak).append("-day streak going.");
            return parts.toString();
        }
        if (streak > 0) return "Your " + streak + "-day streak ends at midnight — one puzzle keeps it.";
        return null;
    }

    /** The reminder to send at `now`, or null. `sent` is the day the last one went out. */
    public static String decide(boolean on, int hour, boolean reviews, boolean puzzles, boolean streakOn,
                                long[] reviewTimes, long[] puzzleTimes, int streakDays, String lastActive,
                                long now, String sent) {
        if (!on) return null;
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        if (c.get(Calendar.HOUR_OF_DAY) < hour) return null;
        String today = dayKey(now);
        if (today.equals(sent)) return null;
        int rd = reviews ? countDue(reviewTimes, now) : 0;
        int pd = puzzles ? countDue(puzzleTimes, now) : 0;
        int streak = (streakOn && streakDays >= 2 && lastActive != null && !lastActive.isEmpty()
                && !lastActive.equals(today)) ? streakDays : 0;
        return text(rd, pd, streak);
    }

    /** The next moment worth looking again after `now`: your hour, or the next thing to fall due after it. */
    public static long nextCheck(int hour, long[] reviewTimes, long[] puzzleTimes, long now, boolean sentToday) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        long todayAt = c.getTimeInMillis();
        c.add(Calendar.DAY_OF_MONTH, 1);
        long tomorrowAt = c.getTimeInMillis();
        if (now < todayAt) return todayAt;
        if (sentToday) return tomorrowAt;
        // past the hour and nothing said yet today. Something already due means the app was on
        // screen when the alarm came: try again in an hour. Otherwise look again when the next
        // item falls due, if that is still before tomorrow's hour.
        for (long[] list : new long[][]{reviewTimes, puzzleTimes}) {
            if (list != null && list.length > 0 && list[0] <= now) return now + 3_600_000L;
        }
        long next = tomorrowAt;
        for (long[] list : new long[][]{reviewTimes, puzzleTimes}) {
            if (list == null) continue;
            for (long t : list) if (t > now) { if (t < next) next = t; break; }
        }
        return Math.max(now + 60_000L, next);
    }
}
