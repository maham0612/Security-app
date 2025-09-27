package com.myapp;

import android.app.Activity;
import android.view.WindowManager;
import android.os.Build;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

public class ScreenshotProtectionModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ScreenshotProtectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "ScreenshotProtection";
    }

    @ReactMethod
    public void enableScreenshotProtection() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
                        activity.getWindow().setFlags(
                            WindowManager.LayoutParams.FLAG_SECURE,
                            WindowManager.LayoutParams.FLAG_SECURE
                        );
                    }
                }
            }
        });
    }

    @ReactMethod
    public void disableScreenshotProtection() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
                        activity.getWindow().clearFlags(
                            WindowManager.LayoutParams.FLAG_SECURE
                        );
                    }
                }
            }
        });
    }
}
