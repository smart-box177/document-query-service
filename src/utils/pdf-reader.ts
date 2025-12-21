import axios from "axios";
import * as pdfParse from "pdf-parse";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdf = (pdfParse as any).default || pdfParse;

/**
 * Reads a PDF from a given URL and extracts the first N words
 * @param url - The URL of the PDF file
 * @param wordLimit - Maximum number of words to extract (default: 300)
 * @returns The extracted text limited to the specified word count
 */
export async function readPdfFromUrl(
  url: string,
  wordLimit: number = 300
): Promise<string> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const pdfBuffer = Buffer.from(response.data);
    const data = await pdf(pdfBuffer);

    const words = data.text
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((word: string) => word.length > 0);

    const limitedWords = words.slice(0, wordLimit);
    return limitedWords.join(" ");
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to read PDF from URL: ${err}`);
  }
}

/**
 * Reads a PDF from a buffer and extracts the first N words
 * @param buffer - The PDF file buffer
 * @param wordLimit - Maximum number of words to extract (default: 300)
 * @returns The extracted text limited to the specified word count
 */
export async function readPdfFromBuffer(
  buffer: Buffer,
  wordLimit: number = 300
): Promise<string> {
  try {
    const data = await pdf(buffer);

    const words = data.text
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((word: string) => word.length > 0);

    const limitedWords = words.slice(0, wordLimit);
    return limitedWords.join(" ");
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to read PDF from buffer: ${err}`);
  }
}
