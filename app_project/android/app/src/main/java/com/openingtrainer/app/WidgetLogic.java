package com.openingtrainer.app;

/**
 * The home-screen widget's four lines. A line-for-line port of widgetHead(),
 * widgetCareer(), widgetEvent() and widgetDue() in the web app, kept free of
 * Android classes so validate-widget.mjs can compile it and check that both
 * give the same text.
 */
public final class WidgetLogic {

    private WidgetLogic() {}

    private static final String DOT = " · ";

    /** A score the way the app writes it: 2½, ½, 3. */
    public static String score(double s) {
        int w = (int) Math.floor(s + 1e-9);
        boolean half = (s - w) >= 0.5;
        return half ? (w != 0 ? String.valueOf(w) : "") + "½" : String.valueOf(w);
    }

    public static String head(int year, int week) {
        if (year <= 0) return "Chess Career";
        return year + DOT + "week " + week;
    }

    public static String career(String flag, String name, String title, int rating, int rank) {
        if (name == null || name.isEmpty()) return "No career yet — start one in the app";
        StringBuilder b = new StringBuilder();
        if (flag != null && !flag.isEmpty()) b.append(flag).append(' ');
        b.append(name).append(DOT);
        if (title != null && !title.isEmpty()) b.append(title).append(' ');
        b.append(rating > 0 ? String.valueOf(rating) : "unrated");
        if (rank > 0) b.append(DOT).append("world #").append(rank);
        return b.toString();
    }

    public static String event(String tour, String tourEmoji, int round, int rounds, double sc,
                               String next, String nextEmoji, int inWeeks) {
        if (tour != null && !tour.isEmpty()) {
            String s = (tourEmoji == null || tourEmoji.isEmpty() ? "" : tourEmoji + " ") + tour + DOT
                    + "round " + Math.min(round + 1, rounds) + " of " + rounds;
            if (round > 0) s += DOT + score(sc) + "/" + round;
            return s;
        }
        if (next != null && !next.isEmpty()) {
            return (nextEmoji == null || nextEmoji.isEmpty() ? "" : nextEmoji + " ") + next + DOT
                    + (inWeeks <= 0 ? "this week" : inWeeks == 1 ? "next week" : "in " + inWeeks + " weeks");
        }
        return "No event coming up — the opens run every week";
    }

    public static String due(int rd, int pd, int streak) {
        String s;
        if (rd > 0 && pd > 0) s = rd + " review" + (rd == 1 ? "" : "s") + " and " + pd + " puzzle" + (pd == 1 ? "" : "s") + " due";
        else if (rd > 0) s = rd + " opening review" + (rd == 1 ? "" : "s") + " due";
        else if (pd > 0) s = pd + " puzzle" + (pd == 1 ? "" : "s") + " to try again";
        else s = "Nothing due";
        if (streak > 0) s += DOT + "🔥 " + streak + " day" + (streak == 1 ? "" : "s");
        return s;
    }
}
