package com.legerly.accounting;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;

/**
 * Native Android interface for direct WhatsApp & PDF sharing via FileProvider.
 * Solves the issue where only text was sent without the PDF file attached.
 */
public class AndroidPdfSharer {
    private static final String TAG = "AndroidPdfSharer";
    private final Activity activity;

    public AndroidPdfSharer(Activity activity) {
        this.activity = activity;
    }

    /**
     * Shares a PDF file directly to WhatsApp (com.whatsapp or com.whatsapp.w4b)
     * with the customer's chat opened, PDF file attached, and caption prefilled.
     * Falls back cleanly to Android system share sheet if WhatsApp is not installed.
     */
    @JavascriptInterface
    public boolean sharePdfToWhatsApp(String base64Data, String fileName, String rawPhoneNumber, String caption) {
        return sharePdf(base64Data, fileName, rawPhoneNumber, caption, true);
    }

    /**
     * Shares a PDF file via Android native share chooser with FileProvider content URI.
     */
    @JavascriptInterface
    public boolean sharePdfGeneric(String base64Data, String fileName, String caption) {
        return sharePdf(base64Data, fileName, null, caption, false);
    }

    /**
     * Returns true if running within the native Android wrapper with this interface active.
     */
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

            // Remove data URI prefix if present (e.g., "data:application/pdf;base64,")
            int commaIndex = base64Data.indexOf(",");
            String cleanBase64 = commaIndex != -1 ? base64Data.substring(commaIndex + 1) : base64Data;
            byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

            // Sanitize file name
            String safeFileName = (fileName != null && !fileName.trim().isEmpty())
                    ? fileName.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "Invoice.pdf";
            if (!safeFileName.toLowerCase().endsWith(".pdf")) {
                safeFileName += ".pdf";
            }

            // Save to app cache directory (Scoped storage safe for Android 10-14, no external storage permission needed)
            File cacheDir = activity.getCacheDir();
            File pdfFile = new File(cacheDir, safeFileName);
            FileOutputStream fos = new FileOutputStream(pdfFile);
            fos.write(pdfBytes);
            fos.flush();
            fos.close();

            // Generate content URI via FileProvider
            String authority = activity.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(activity, authority, pdfFile);

            // Construct ACTION_SEND Intent with application/pdf MIME type
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/pdf");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            if (caption != null && !caption.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_TEXT, caption);
            }
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Grant ClipData URI permission for Android 10+ (API 29+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                shareIntent.setClipData(ClipData.newRawUri("PDF Invoice", contentUri));
            }

            // Format phone number for WhatsApp
            String cleanPhone = rawPhoneNumber != null ? rawPhoneNumber.replaceAll("[^0-9]", "") : "";
            if (cleanPhone.startsWith("0")) {
                cleanPhone = cleanPhone.substring(1);
            }
            if (cleanPhone.length() == 10) {
                cleanPhone = "91" + cleanPhone; // Default country code if 10 digits
            }

            if (targetWhatsApp) {
                boolean isWhatsAppStandard = isPackageInstalled("com.whatsapp");
                boolean isWhatsAppBusiness = isPackageInstalled("com.whatsapp.w4b");

                if (isWhatsAppStandard || isWhatsAppBusiness) {
                    String pkg = isWhatsAppStandard ? "com.whatsapp" : "com.whatsapp.w4b";
                    shareIntent.setPackage(pkg);
                    if (!cleanPhone.isEmpty()) {
                        // Direct customer chat jid extra: [phone]@s.whatsapp.net
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

            // Launch standard Android Chooser if WhatsApp was not selected or not installed
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

    private void showToast(final String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_LONG).show());
    }
}
