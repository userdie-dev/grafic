package com.grafic.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScheduleStorage")
public class ScheduleStoragePlugin extends Plugin {
    private SharedPreferences preferences() {
        return getContext().getSharedPreferences("grafic_schedule", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void read(PluginCall call) {
        JSObject response = new JSObject();
        String snapshot = preferences().getString("friends", null);
        if (snapshot != null) response.put("snapshot", snapshot);
        call.resolve(response);
    }

    @PluginMethod
    public void write(PluginCall call) {
        if (preferences().edit().putString("friends", call.getString("snapshot")).commit()) {
            call.resolve();
        } else {
            call.reject("Could not save the friend list");
        }
    }
}
