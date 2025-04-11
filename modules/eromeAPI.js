import fetch from "node-fetch";
import * as cheerio from "cheerio";

// === This function is safe
function cleanFilename(title) {
  //Remove any special char, to improve and standardize the media name
  //You can further edit these.
  let filename = title.replace(/[^a-zA-Z0-9]/g, "_"); //Replace with underscore.

  // Double Underscore Cleanup if the title does weird things...
  filename = filename.replace(/_{2,}/g, "_"); //Consolidate sequential
  filename = filename.replace(/^_|_$/g, ""); //Kill leads/trailing

  return filename; //Send it back.
}
async function getEromeMedia(url) {
  try {
    // === Add Headers Here - Initial Headers ===
    const headers = {
      Referer: url, //  Important: Set the Referer
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", //  Use a standard browser User-Agent (Update this if your browser is different)
    };
    const response = await fetch(url, { headers: headers }); // Initial request

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // === Extract title first before sanitizing
    let title = $("div.page-content > h1").text().trim().replace(/\s+/g, "_");

    // == Pass thru clean function for easy filename output
    title = cleanFilename(title);

    if (!title) {
      title = "erome_media";
    }

    const media = [];
    const uniqueUrls = new Set();

    $("video").each((index, element) => {
      const videoSrc =
        $(element).find("source").attr("src") ||
        $(element).attr("src") ||
        $(element).attr("data-src") ||
        $(element).find("source").attr("data-src");

      if (videoSrc) {
        try {
          const absoluteVideoSrc = new URL(videoSrc, url).href;
          if (!uniqueUrls.has(absoluteVideoSrc)) {
            uniqueUrls.add(absoluteVideoSrc);
            media.push({
              type: "video",
              url: absoluteVideoSrc,
              filename: `${title}_${index}.mp4`,
            });
          }
        } catch (urlError) {
          console.error("Invalid URL found:", videoSrc, urlError);
        }
      }
    });

    $(
      ".img img, div.image-container > a > img, .image-gallery img, .image-container img, .image-list img"
    ).each((index, element) => {
      const imgSrc = $(element).attr("data-src") || $(element).attr("src");

      if (imgSrc) {
        try {
          const absoluteImgSrc = new URL(imgSrc, url).href;
          if (!uniqueUrls.has(absoluteImgSrc)) {
            uniqueUrls.add(absoluteImgSrc);
            media.push({
              type: "image",
              url: absoluteImgSrc,
              filename: `${title}_${index}.png`,
            });
          }
        } catch (urlError) {
          console.error("Invalid URL found", imgSrc, urlError);
        }
      }
    });

    return media;
  } catch (error) {
    console.error("Error fetching Erome media:", error);
    throw error;
  }
}

export { getEromeMedia };