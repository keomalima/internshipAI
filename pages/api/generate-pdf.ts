import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
  maxDuration: 10,
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

    // For Vercel deployment, use remote Chromium binary to avoid bundling issues
    // The local chromium-min package binaries don't get included in Vercel's deployment
    const isProduction = process.env.NODE_ENV === 'production';

    let executablePath: string;

    if (isProduction) {
      // Use remote Chromium binary for production (Vercel)
      // This URL points to the official @sparticuz/chromium release (x64 architecture)
      executablePath = await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar'
      );
    } else {
      // For local development, try to use the local binary
      executablePath = await chromium.executablePath();
    }

    const browser = await puppeteer.launch({
      args: isProduction
        ? [...chromium.args, '--disable-gpu', '--single-process']
        : chromium.args,
      defaultViewport: null,
      executablePath,
      headless: true,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return res.status(500).json({
      error: "Failed to generate PDF",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
}
