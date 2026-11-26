import QRCode from "qrcode";

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 1,
      color: {
        dark: "#064e3b", // Deep emerald
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    return "";
  }
}
