package com.grafic.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

@CapacitorPlugin(name = "ShiftSync")
public class ShiftSyncPlugin extends Plugin {
    private static final ExecutorService REGISTRATION = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void open(PluginCall call) {
        try {
            ShiftJournal journal = new ShiftJournal(getContext());
            journal.configure(call.getString("url"), call.getObject("device"));
            if (journal.peek() != null) ShiftSyncWorker.schedule(getContext());
            JSObject snapshot = new JSObject();
            snapshot.put("overrides", journal.snapshot().getJSONObject("overrides"));
            JSONObject cache = journal.cachedShifts(call.getObject("legacyCache"));
            snapshot.put("cache", cache == null ? JSONObject.NULL : cache);
            call.resolve(snapshot);
        } catch (Exception error) {
            call.reject("Не удалось открыть локальное хранилище смен.", error);
        }
    }

    @PluginMethod
    public void cacheShifts(PluginCall call) {
        try {
            JSONObject cache = new JSONObject()
                .put("owner", call.getString("owner"))
                .put("shifts", call.getArray("shifts"));
            new ShiftJournal(getContext()).cacheShifts(cache);
            call.resolve();
        } catch (Exception error) {
            call.reject("Не удалось сохранить график на устройстве.", error);
        }
    }

    @PluginMethod
    public void append(PluginCall call) {
        try {
            ShiftJournal journal = new ShiftJournal(getContext());
            journal.append(call.getObject("change"), call.getObject("overrides"));
            call.resolve();
        } catch (Exception error) {
            call.reject("Не удалось сохранить изменения графика.", error);
        }
    }

    @PluginMethod
    public void device(PluginCall call) {
        REGISTRATION.execute(() -> {
            try {
                ShiftJournal journal = new ShiftJournal(getContext());
                journal.configure(call.getString("url"), call.getObject("device"));
                call.resolve(new JSObject(journal.device(call.getString("rejectedToken")).toString()));
            } catch (Exception error) {
                call.reject("Не удалось подключиться к серверу.", error);
            }
        });
    }
}
