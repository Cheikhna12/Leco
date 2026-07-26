import { chromium } from "playwright";

const baseUrl = process.env.LECO_REVIEW_URL ?? "http://127.0.0.1:3000";
const channel = process.env.PLAYWRIGHT_CHANNEL;
const browser = await chromium.launch({
  ...(channel ? { channel } : {}),
  headless: true,
});

const viewports = [
  { height: 780, width: 320 },
  { height: 812, width: 375 },
  { height: 896, width: 414 },
  { height: 1024, width: 768 },
  { height: 1000, width: 1440 },
];
const views = [
  ["Découvrir", "discover"],
  ["Ma vibe", "vibe"],
  ["Messages", "messages"],
  ["Profil", "profile"],
];
const report = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      colorScheme: "dark",
      locale: "fr-FR",
      viewport,
    });
    const consoleErrors = [];
    const responseErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        !response.url().endsWith("/favicon.ico")
      ) {
        responseErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.locator(".app-frame").waitFor();
    await page.waitForTimeout(400);

    for (const [label, view] of views) {
      if (view !== "discover") {
        await page
          .getByRole("button", { name: new RegExp(`^${label}`) })
          .click();
        await page.waitForTimeout(180);
      }

      const metrics = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.height = 1;
        canvas.width = 1;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        const toRgba = (color) => {
          if (!context) return [0, 0, 0, 1];
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = "rgba(0, 0, 0, 0)";
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const [red, green, blue, alpha] = context.getImageData(
            0,
            0,
            1,
            1,
          ).data;
          return [red / 255, green / 255, blue / 255, alpha / 255];
        };

        const effectiveBackground = (element) => {
          let current = element;
          while (current) {
            const rgba = toRgba(getComputedStyle(current).backgroundColor);
            if (rgba[3] > 0.98) return rgba;
            current = current.parentElement;
          }
          return [1, 1, 1, 1];
        };

        const luminance = ([red, green, blue]) => {
          const linear = [red, green, blue].map((channel) =>
            channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4,
          );
          return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
        };

        const contrast = (foreground, background) => {
          const foregroundLuminance = luminance(foreground);
          const backgroundLuminance = luminance(background);
          return (
            (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
          );
        };

        const isVisible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        };

        const contrastIssues = [];
        for (const element of document.querySelectorAll("body *")) {
          if (
            !isVisible(element) ||
            element.closest("[disabled], [aria-disabled='true']")
          ) {
            continue;
          }

          const hasDirectText = [...element.childNodes].some(
            (node) =>
              node.nodeType === Node.TEXT_NODE &&
              Boolean(node.textContent?.trim()),
          );
          if (!hasDirectText) continue;

          const style = getComputedStyle(element);
          const ratio = contrast(
            toRgba(style.color),
            effectiveBackground(element),
          );
          const fontSize = Number.parseFloat(style.fontSize);
          const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
          const largeText =
            fontSize >= 24 || (fontSize >= 18 && fontWeight >= 700);
          const threshold = largeText ? 3 : 4.5;

          if (ratio + 0.02 < threshold) {
            contrastIssues.push(
              `${element.tagName.toLowerCase()}.${element.className || "unclassed"}=${ratio.toFixed(2)}:${threshold}`,
            );
          }
        }

        const wrappedControls = [];
        for (const element of document.querySelectorAll(
          "button, a, [role='tab']",
        )) {
          if (!isVisible(element)) continue;
          let hasWrappedText = false;
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
          );
          let textNode = walker.nextNode();
          while (textNode) {
            const textParent = textNode.parentElement;
            if (
              textNode.textContent?.trim() &&
              !textParent?.closest(".sr-only, [aria-hidden='true']")
            ) {
              const range = document.createRange();
              range.selectNodeContents(textNode);
              const lineTops = new Set();
              for (const rect of range.getClientRects()) {
                if (rect.width > 0) lineTops.add(Math.round(rect.top));
              }
              if (lineTops.size > 1) hasWrappedText = true;
            }
            textNode = walker.nextNode();
          }
          if (hasWrappedText) {
            wrappedControls.push(
              `${element.tagName.toLowerCase()}.${element.className || "unclassed"}`,
            );
          }
        }

        return {
          bodyWidth: document.body.scrollWidth,
          canvasReady:
            document
              .querySelector(".proximity__field")
              ?.getAttribute("data-renderer") ?? "not-in-view",
          clientWidth: document.documentElement.clientWidth,
          contrastIssues,
          headingFont: getComputedStyle(document.querySelector("h1"))
            .fontFamily,
          htmlWidth: document.documentElement.scrollWidth,
          wrappedControls,
        };
      });

      if (
        metrics.bodyWidth > metrics.clientWidth ||
        metrics.htmlWidth > metrics.clientWidth
      ) {
        throw new Error(
          `Horizontal overflow in ${view} at ${viewport.width}px: body=${metrics.bodyWidth}, html=${metrics.htmlWidth}, client=${metrics.clientWidth}`,
        );
      }
      if (metrics.contrastIssues.length > 0) {
        throw new Error(
          `Contrast failures in ${view} at ${viewport.width}px:\n${metrics.contrastIssues.join("\n")}`,
        );
      }
      if (metrics.wrappedControls.length > 0) {
        throw new Error(
          `Wrapped controls in ${view} at ${viewport.width}px:\n${metrics.wrappedControls.join("\n")}`,
        );
      }

      report.push({
        consoleErrors,
        responseErrors,
        view,
        viewport: viewport.width,
        ...metrics,
      });

      if (viewport.width === 1440 && view !== "discover") {
        await page.screenshot({
          fullPage: true,
          path: `artifacts/leco-premium-${view}-dark.png`,
        });
      }
    }

    await page.close();
  }
} finally {
  await browser.close();
}

const unexpectedErrors = report.flatMap(({ consoleErrors, viewport }) =>
  consoleErrors
    .filter(
      (message) =>
        !message.includes("Download the React DevTools") &&
        !message.includes(
          "upgrade-insecure-requests' is ignored when delivered in a report-only policy",
        ) &&
        !message.includes("Failed to load resource"),
    )
    .map((message) => `${viewport}px: ${message}`),
);
const failedResponses = report.flatMap(({ responseErrors, viewport }) =>
  responseErrors.map((message) => `${viewport}px: ${message}`),
);

if (unexpectedErrors.length > 0 || failedResponses.length > 0) {
  throw new Error(
    [
      unexpectedErrors.length
        ? `Browser console errors:\n${unexpectedErrors.join("\n")}`
        : "",
      failedResponses.length
        ? `Failed responses:\n${failedResponses.join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

if (process.env.LECO_REVIEW_VERBOSE === "1") {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(
    `UI review passed: ${report.length} view/viewport combinations, no overflow, contrast failure, wrapped control, console error, or failed response.`,
  );
}
