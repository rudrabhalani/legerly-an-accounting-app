package com.legerly.accounting;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Native Android interface for:
 * 1. Direct WhatsApp & PDF sharing via FileProvider
 * 2. High-performance device contacts reading directly from ContactsContract
 */
public class AndroidPdfSharer {
    private static final String TAG = "AndroidNativeBridge";
    private final Activity activity;

    public AndroidPdfSharer(Activity activity) {
        this.activity = activity;
    }

    // ==========================================
    // 1. PDF & WHATSAPP SHARING METHODS
    // ==========================================

    @JavascriptInterface
    public boolean sharePdfToWhatsApp(String base64Data, String fileName, String rawPhoneNumber, String caption) {
        return sharePdf(base64Data, fileName, rawPhoneNumber, caption, true);
    }

    @JavascriptInterface
    public boolean sharePdfGeneric(String base64Data, String fileName, String caption) {
        return sharePdf(base64Data, fileName, null, caption, false);
    }

    @JavascriptInterface
    public boolean isNativeBridgeAvailable() {
        return true;
    }

    private boolean sharePdf(String base64Data, String fileName, String rawPhoneNumber, String caption, boolean targetWhatsApp) {
        try {
            if (base64Data == null || base64Data.trim().isEmpty()) {
                showToast("Cannot share empty PDF document.");
                return false;
            }

            int commaIndex = base64Data.indexOf(",");
            String cleanBase64 = commaIndex != -1 ? base64Data.substring(commaIndex + 1) : base64Data;
            byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

            String safeFileName = (fileName != null && !fileName.trim().isEmpty())
                    ? fileName.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "Invoice.pdf";
            if (!safeFileName.toLowerCase().endsWith(".pdf")) {
                safeFileName += ".pdf";
            }

            File cacheDir = activity.getCacheDir();
            File pdfFile = new File(cacheDir, safeFileName);
            FileOutputStream fos = new FileOutputStream(pdfFile);
            fos.write(pdfBytes);
            fos.flush();
            fos.close();

            String authority = activity.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(activity, authority, pdfFile);

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/pdf");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            if (caption != null && !caption.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_TEXT, caption);
            }
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                shareIntent.setClipData(ClipData.newRawUri("PDF Invoice", contentUri));
            }

            String cleanPhone = rawPhoneNumber != null ? rawPhoneNumber.replaceAll("[^0-9]", "") : "";
            if (cleanPhone.startsWith("0")) {
                cleanPhone = cleanPhone.substring(1);
            }
            if (cleanPhone.length() == 10) {
                cleanPhone = "91" + cleanPhone;
            }

            if (targetWhatsApp) {
                boolean isWhatsAppStandard = isPackageInstalled("com.whatsapp");
                boolean isWhatsAppBusiness = isPackageInstalled("com.whatsapp.w4b");

                if (isWhatsAppStandard || isWhatsAppBusiness) {
                    String pkg = isWhatsAppStandard ? "com.whatsapp" : "com.whatsapp.w4b";
                    shareIntent.setPackage(pkg);
                    if (!cleanPhone.isEmpty()) {
                        shareIntent.putExtra("jid", cleanPhone + "@s.whatsapp.net");
                    }

                    try {
                        activity.startActivity(shareIntent);
                        return true;
                    } catch (ActivityNotFoundException anfe) {
                        Log.w(TAG, "Direct WhatsApp start failed, falling back to chooser", anfe);
                        shareIntent.setPackage(null);
                    }
                }
            }

            Intent chooser = Intent.createChooser(shareIntent, "Share Invoice PDF");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(chooser);
            return true;

        } catch (Exception e) {
            Log.e(TAG, "Error sharing PDF via Android native bridge", e);
            showToast("Error sharing PDF: " + e.getMessage());
            return false;
        }
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            activity.getPackageManager().getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    // ==========================================
    // 2. NATIVE CONTACTS READING & PERMISSIONS
    // ==========================================

    @JavascriptInterface
    public boolean hasContactsPermission() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestContactsPermission() {
        activity.runOnUiThread(() -> {
            ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.READ_CONTACTS}, 101);
        });
    }

    @JavascriptInterface
    public void openAppSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", activity.getPackageName(), null);
            intent.setData(uri);
            activity.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error opening app settings", e);
        }
    }

    /**
     * Directly queries Android's ContactsContract to get all phone contacts.
     * Works on Android 6 through Android 14+ with zero plugin dependencies.
     * Returns JSON string: [{"id": "...", "name": "...", "phone": "9876543210", "displayPhone": "+91 9876543210"}]
     */
    @JavascriptInterface
    public String getDeviceContacts() {
        if (!hasContactsPermission()) {
            Log.w(TAG, "getDeviceContacts called without READ_CONTACTS permission");
            return "[]";
        }

        List<JSONObject> contactList = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();

        ContentResolver resolver = activity.getContentResolver();
        Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
        String[] projection = new String[]{
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
        };

        Cursor cursor = null;
        try {
            cursor = resolver.query(uri, projection, null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC");
            if (cursor != null) {
                int idCol = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                int nameCol = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numCol = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (cursor.moveToNext()) {
                    String id = idCol != -1 ? cursor.getString(idCol) : "";
                    String name = nameCol != -1 ? cursor.getString(nameCol) : "";
                    String number = numCol != -1 ? cursor.getString(numCol) : "";

                    if (name == null) name = "";
                    name = name.trim();

                    if (number == null) number = "";
                    String rawNumber = number.trim();

                    // Normalize phone number (digits only, strip leading 0 or +91 for 10-digit Indian numbers)
                    String digitsOnly = rawNumber.replaceAll("[^0-9]", "");
                    String cleanPhone = digitsOnly;
                    if (cleanPhone.startsWith("91") && cleanPhone.length() == 12) {
                        cleanPhone = cleanPhone.substring(2);
                    } else if (cleanPhone.startsWith("0") && cleanPhone.length() == 11) {
                        cleanPhone = cleanPhone.substring(1);
                    }

                    if (name.isEmpty() && cleanPhone.isEmpty()) continue;

                    String displayName = name.isEmpty() ? ("Contact " + cleanPhone) : name;
                    String dedupKey = displayName.toLowerCase() + "|" + cleanPhone;
                    if (seenKeys.contains(dedupKey)) continue;
                    seenKeys.add(dedupKey);

                    JSONObject item = new JSONObject();
                    item.put("id", id.isEmpty() ? ("c-" + cleanPhone) : id);
                    item.put("name", displayName);
                    item.put("phone", cleanPhone);
                    item.put("displayPhone", cleanPhone.length() == 10 ? ("+91 " + cleanPhone) : rawNumber);
                    contactList.add(item);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error querying ContactsContract", e);
        } finally {
            if (cursor != null) cursor.close();
        }

        // Sort alphabetically by name
        Collections.sort(contactList, new Comparator<JSONObject>() {
            @Override
            public int compare(JSONObject a, JSONObject b) {
                String nameA = a.optString("name", "");
                String nameB = b.optString("name", "");
                return nameA.compareToIgnoreCase(nameB);
            }
        });

        JSONArray jsonArray = new JSONArray();
        for (JSONObject obj : contactList) {
            jsonArray.put(obj);
        }

        Log.d(TAG, "Loaded " + jsonArray.length() + " contacts from Android ContactsContract");
        return jsonArray.toString();
    }

    private void showToast(final String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_LONG).show());
    }
}
