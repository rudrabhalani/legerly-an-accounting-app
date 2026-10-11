package com.legerly.accounting;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Expose native bridge directly to WebView JavaScript context
        if (getBridge() != null && getBridge().getWebView() != null) {
            AndroidPdfSharer nativeBridge = new AndroidPdfSharer(this);
            getBridge().getWebView().addJavascriptInterface(nativeBridge, "AndroidPdfSharer");
            getBridge().getWebView().addJavascriptInterface(nativeBridge, "AndroidNativeBridge");
        }
    }
}
