import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { html, fileName } = req.body as { html?: string; fileName?: string };

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Missing HTML content" });
    }

    const isServerless = !!(process.env.VERCEL || process.env.AWS_EXECUTION_ENV);
    // Use Sparticuz Chromium in serverless to avoid missing system libs (e.g., libnss3)
    const executablePath = isServerless
      ? await chromium.executablePath()
      : await puppeteer.executablePath();
    if (!executablePath) {
      throw new Error("Could not resolve Chromium executable path");
    }
    const headless = chromium.headless === "new" ? true : chromium.headless ?? true;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath,
      headless,
      // Provide chromium's recommended env to ensure bundled libs (e.g., libnss3) are found
      env: { ...process.env, ...chromium.env },
    });
    const page = await browser.newPage();

    const wrappedHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; text-align: justify; margin: 0; padding: 0; }
            p { margin: 0 0 9pt 0; }
            ul { margin: 0 0 9pt 14pt; padding: 0; }
            li { margin: 0 0 6pt 0; }
            strong { font-weight: 600; }
            br + br { line-height: 0; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    await page.setContent(wrappedHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "17mm", left: "15mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${fileName || "lettre_motivation.pdf"}\"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
}
