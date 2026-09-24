package com.openingtrainer.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Thin native shell: a full-screen WebView that runs the bundled OpeningTrainer
 * app from assets. The app itself (HTML/JS/CSS, rules engine inlined) lives in
 * assets/www and works offline; Play-vs-Stockfish fetches the engine over the
 * network when available.
 *
 * A WebView on its own cannot save a download or open a file picker, and it
 * has no Web Share, so moving progress between devices needs three small
 * native pieces: a share sheet for the backup file (AndroidBridge.shareBackup),
 * a file chooser for "Receive progress", and "Open with Chess Career" for a
 * backup opened or shared from another app (AndroidBridge.takeIncoming).
 */
public class MainActivity extends Activity {

    private static final int REQ_FILE = 41;
    private static final String HOME = "file:///android_asset/www/";
    private static final int MAX_BACKUP = 64 * 1024 * 1024;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private volatile String pageUrl = "";
    private volatile String incoming = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);          // localStorage (progress, settings)
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setSupportZoom(false);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        // keep all in-app navigation inside the WebView
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                pageUrl = url == null ? "" : url;
                super.onPageStarted(view, url, favicon);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                // any type: file managers often do not know .json and would grey it out
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(pick, "Choose your Chess Career backup"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        setContentView(web);

        if (savedInstanceState == null) {
            web.loadUrl(HOME + "index.html");
        } else {
            web.restoreState(savedInstanceState);
        }
        readIncoming(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readIncoming(intent);
    }

    /** A backup shared to the app or opened with it: read it off the UI thread, then tell the page. */
    private void readIncoming(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = null;
        if (Intent.ACTION_VIEW.equals(action)) uri = intent.getData();
        else if (Intent.ACTION_SEND.equals(action)) uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return;
        final Uri src = uri;
        intent.setAction(Intent.ACTION_MAIN);   // a rotation must not deliver it twice
        new Thread(() -> {
            try (InputStream in = getContentResolver().openInputStream(src)) {
                if (in == null) return;
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                    if (out.size() > MAX_BACKUP) return;
                }
                incoming = out.toString("UTF-8");
                runOnUiThread(() -> web.evaluateJavascript(
                        "window.__androidIncoming&&window.__androidIncoming()", null));
            } catch (Exception ignored) {
            }
        }).start();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    /** What the page can ask of the phone. Only the bundled app may use it. */
    private class Bridge {
        private boolean trusted() {
            return pageUrl.startsWith(HOME);
        }

        @JavascriptInterface
        public void shareBackup(String name, String json) {
            if (!trusted() || name == null || json == null) return;
            final String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
            try {
                File dir = BackupProvider.dir(MainActivity.this);
                if (!dir.isDirectory() && !dir.mkdirs()) return;
                File[] old = dir.listFiles();
                if (old != null) for (File f : old) f.delete();
                File f = new File(dir, safe);
                try (OutputStream out = new FileOutputStream(f)) {
                    out.write(json.getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                return;
            }
            final Uri uri = Uri.parse("content://" + BackupProvider.AUTHORITY + "/" + safe);
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("application/json");
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.putExtra(Intent.EXTRA_SUBJECT, "Chess Career progress");
                send.setClipData(ClipData.newRawUri("", uri));
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try {
                    startActivity(Intent.createChooser(send, "Send your progress"));
                } catch (ActivityNotFoundException ignored) {
                }
            });
        }

        @JavascriptInterface
        public String takeIncoming() {
            if (!trusted()) return "";
            String t = incoming;
            incoming = null;
            return t == null ? "" : t;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
