package com.grafic.app;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ShiftSyncWorker extends Worker {
    private static final Object SEND_LOCK = new Object();

    public ShiftSyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static void schedule(Context context) throws IOException {
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(ShiftSyncWorker.class)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build();
        try {
            WorkManager.getInstance(context)
                .enqueueUniqueWork("grafic-shifts", ExistingWorkPolicy.APPEND_OR_REPLACE, request)
                .getResult().get();
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted while scheduling shift sync", error);
        } catch (ExecutionException error) {
            throw new IOException("Unable to schedule shift sync", error);
        }
    }

    @NonNull
    @Override
    public Result doWork() {
        // A stopped WorkManager task may still be finishing an HTTP request.
        synchronized (SEND_LOCK) {
            return drainJournal();
        }
    }

    private Result drainJournal() {
        ShiftJournal journal = new ShiftJournal(getApplicationContext());
        try {
            JSONObject change;
            while (!isStopped() && (change = journal.peek()) != null) {
                String token = journal.device(null).getString("token");
                try {
                    sendChange(journal.url(), token, change);
                } catch (Unauthorized error) {
                    String renewed = journal.device(token).getString("token");
                    sendChange(journal.url(), renewed, change);
                }
                journal.acknowledge();
            }
            return isStopped() ? Result.retry() : Result.success();
        } catch (IOException | JSONException error) {
            Log.w("ShiftSync", "Shift sync will retry", error);
            return Result.retry();
        }
    }

    private void sendChange(String url, String token, JSONObject change) throws JSONException, IOException {
        JSONArray removals = change.getJSONArray("remove");
        for (int i = 0; i < removals.length(); i++) {
            JSONObject shift = removals.getJSONObject(i);
            String id = shift.optString("serverId", "");
            if (id.isEmpty()) id = findShiftId(url, token, shift);
            if (!id.isEmpty()) request(url, "DELETE", "/me/shifts/" + id, token, null);
        }
        JSONArray items = change.getJSONArray("items");
        if (items.length() > 0) {
            request(url, "PUT", "/me/shifts", token, new JSONObject().put("shifts", items));
        }
    }

    private static String findShiftId(String url, String token, JSONObject shift) throws JSONException, IOException {
        String date = shift.getString("date");
        String start = shift.getString("start");
        JSONArray matches = new JSONArray(request(url, "GET", "/me/shifts?from=" + date + "&to=" + date, token, null));
        for (int i = 0; i < matches.length(); i++) {
            JSONObject remote = matches.getJSONObject(i);
            if (start.equals(remote.getString("start"))) return remote.getString("id");
        }
        return "";
    }

    static String request(String url, String method, String path, String token, JSONObject body) throws IOException {
        URL endpoint = new URL(url.replaceAll("/+$", "") + path);
        HttpURLConnection connection = (HttpURLConnection) endpoint.openConnection();
        try {
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(15_000);
            connection.setRequestMethod(method);
            connection.setInstanceFollowRedirects(false);
            if (token != null) connection.setRequestProperty("Authorization", "Bearer " + token);
            if (body != null) {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
            }
            int status = connection.getResponseCode();
            if (status == 401) throw new Unauthorized();
            String contentType = connection.getContentType();
            if (status < 200 || status >= 300 || contentType == null
                || !contentType.toLowerCase(Locale.ROOT).contains("application/json")) {
                throw new IOException("Unexpected response from shift API: " + status);
            }
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                return new String(output.toByteArray(), StandardCharsets.UTF_8);
            }
        } finally {
            connection.disconnect();
        }
    }

    private static class Unauthorized extends IOException {}
}
