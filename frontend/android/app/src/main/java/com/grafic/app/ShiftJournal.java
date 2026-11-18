package com.grafic.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.io.IOException;
import java.util.Iterator;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class ShiftJournal {
    private static final Object JOURNAL_LOCK = new Object();
    private static final Object DEVICE_LOCK = new Object();
    private final SharedPreferences preferences;
    private final Context context;

    ShiftJournal(Context context) {
        this.context = context.getApplicationContext();
        preferences = this.context.getSharedPreferences("grafic_shift_sync", Context.MODE_PRIVATE);
    }

    JSONObject snapshot() throws JSONException {
        synchronized (JOURNAL_LOCK) {
            JSONObject state = new JSONObject(preferences.getString("journal", "{}"));
            if (!state.has("overrides")) state.put("overrides", new JSONObject());
            if (!state.has("pending")) state.put("pending", new JSONArray());
            return state;
        }
    }

    void append(JSONObject change, JSONObject overrides) throws JSONException, IOException {
        synchronized (JOURNAL_LOCK) {
            JSONObject state = snapshot();
            mergeOverrides(state, overrides);
            state.getJSONArray("pending").put(change);
            scheduleAndPersist(state);
        }
    }

    JSONObject cachedShifts(JSONObject legacy) throws JSONException, IOException {
        synchronized (JOURNAL_LOCK) {
            String stored = preferences.getString("cache", null);
            if (stored != null) return new JSONObject(stored);
            if (legacy != null) cacheShifts(legacy);
            return legacy;
        }
    }

    void cacheShifts(JSONObject cache) throws IOException {
        synchronized (JOURNAL_LOCK) {
            persist(preferences.edit().putString("cache", cache.toString()));
        }
    }

    private static void mergeOverrides(JSONObject state, JSONObject changes) throws JSONException {
        JSONObject overrides = state.getJSONObject("overrides");
        for (Iterator<String> keys = changes.keys(); keys.hasNext();) {
            String key = keys.next();
            overrides.put(key, changes.get(key));
        }
    }

    private void scheduleAndPersist(JSONObject state) throws IOException, JSONException {
        // The worker cannot peek until the caller releases the journal lock.
        if (state.getJSONArray("pending").length() > 0) ShiftSyncWorker.schedule(context);
        persist(preferences.edit().putString("journal", state.toString()));
    }

    JSONObject peek() throws JSONException {
        return snapshot().getJSONArray("pending").optJSONObject(0);
    }

    void acknowledge() throws JSONException, IOException {
        synchronized (JOURNAL_LOCK) {
            JSONObject state = snapshot();
            state.getJSONArray("pending").remove(0);
            persist(preferences.edit().putString("journal", state.toString()));
        }
    }

    void configure(String url, JSONObject device) throws IOException {
        // Keep configuration writes independent of network registration.
        synchronized (JOURNAL_LOCK) {
            SharedPreferences.Editor edit = preferences.edit().putString("url", url);
            if (device != null && !preferences.contains("device")) {
                edit.putString("device", device.toString());
            }
            persist(edit);
        }
    }

    String url() {
        return preferences.getString("url", "");
    }

    JSONObject device(String rejectedToken) throws JSONException, IOException {
        synchronized (DEVICE_LOCK) {
            synchronized (JOURNAL_LOCK) {
                JSONObject device = new JSONObject(preferences.getString("device", "{}"));
                if (device.has("token") && !device.getString("token").equals(rejectedToken)) return device;
            }
            JSONObject registered = new JSONObject(ShiftSyncWorker.request(url(), "POST", "/devices", null, null));
            registered.getString("token");
            registered.getString("userId");
            registered.getString("shareCode");
            synchronized (JOURNAL_LOCK) {
                persist(preferences.edit().putString("device", registered.toString()));
            }
            return registered;
        }
    }

    private static void persist(SharedPreferences.Editor edit) throws IOException {
        if (!edit.commit()) throw new IOException("Unable to persist shift journal");
    }
}
