# Keep the JavaScript-facing WebView plumbing intact.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
