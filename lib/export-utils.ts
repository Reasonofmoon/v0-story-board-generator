/**
 * Export Utilities
 * Helper functions for exporting storyboards
 */
export class ExportUtils {
  /**
   * Download a file
   * @param content File content
   * @param filename Filename
   * @param contentType Content type
   */
  static downloadFile(content: BlobPart, filename: string, contentType: string): void {
    // Create a blob with the content
    const blob = new Blob([content], { type: contentType })

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a download link
    const link = document.createElement("a")
    link.href = url
    link.download = filename

    // Append the link to the document, click it, and remove it
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Revoke the URL to free up memory
    URL.revokeObjectURL(url)
  }

  /**
   * Sanitize a filename
   * @param filename Filename to sanitize
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Replace spaces with underscores and remove invalid characters
    return filename
      .replace(/\s+/g, "_")
      .replace(/[^\w\-.]/g, "")
      .replace(/_{2,}/g, "_")
  }

  /**
   * Format date for filenames
   * @param date Date to format
   * @returns Formatted date string
   */
  static formatDateForFilename(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  /**
   * Generate a filename for export
   * @param title Storyboard title
   * @param format Export format
   * @returns Generated filename
   */
  static generateFilename(title: string, format: string): string {
    const sanitizedTitle = this.sanitizeFilename(title)
    const dateStr = this.formatDateForFilename()
    return `${sanitizedTitle}_storyboard_${dateStr}.${format}`
  }
}
