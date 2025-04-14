import type { StoryboardData, SceneInfo, ShotInfo, ExportOptions } from "./types"

/**
 * HTML/CSS Export Service
 * Handles the generation of HTML and CSS code from storyboard data
 */
export class HTMLExportService {
  /**
   * Generate HTML and CSS from storyboard data
   * @param storyboardData Storyboard data
   * @param exportOptions Export options
   * @returns Object containing HTML and CSS code
   */
  generateHTML(storyboardData: StoryboardData, exportOptions: ExportOptions): { html: string; css: string } {
    // Generate CSS
    const css = this.generateCSS(storyboardData.aspectRatio)

    // Generate HTML
    const html = this.generateHTMLContent(storyboardData, exportOptions)

    return { html, css }
  }

  /**
   * Generate CSS code
   * @param aspectRatio Aspect ratio
   * @returns CSS code
   */
  private generateCSS(aspectRatio: string): string {
    return `
      /* Storyboard Styles */
      :root {
        --primary-color: #4a6da7;
        --secondary-color: #f0f4f8;
        --text-color: #333;
        --border-color: #ddd;
        --accent-color: #6b9080;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: white;
        padding: 20px;
      }
      
      .storyboard-container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .storyboard-title {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .storyboard-title h1 {
        font-size: 32px;
        margin-bottom: 10px;
        color: var(--primary-color);
      }
      
      .storyboard-title h2 {
        font-size: 20px;
        font-weight: normal;
        color: #666;
      }
      
      .storyboard-metadata {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
      }
      
      .metadata-item {
        padding: 10px;
        background-color: var(--secondary-color);
        border-radius: 4px;
      }
      
      .metadata-label {
        font-weight: bold;
        font-size: 12px;
        text-transform: uppercase;
        color: #666;
      }
      
      .metadata-value {
        font-size: 14px;
      }
      
      .scene {
        margin-bottom: 40px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .scene-header {
        background-color: var(--primary-color);
        color: white;
        padding: 10px 15px;
        border-radius: 4px 4px 0 0;
        margin-bottom: 15px;
      }
      
      .scene-title {
        font-size: 18px;
        margin-bottom: 5px;
      }
      
      .scene-description {
        font-size: 14px;
        margin-bottom: 15px;
        padding: 0 15px;
      }
      
      .shots-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
        gap: 20px;
      }
      
      .shot {
        border: 1px solid var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .shot-header {
        background-color: var(--secondary-color);
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-color);
        font-weight: bold;
      }
      
      .shot-content {
        display: flex;
        flex-direction: ${aspectRatio === "9:16" ? "column" : "row"};
      }
      
      .shot-image-placeholder {
        background-color: #f5f5f5;
        border: 1px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
        text-align: center;
        padding: 10px;
        ${this.getImagePlaceholderStyles(aspectRatio)}
      }
      
      .shot-details {
        flex: 1;
        padding: 15px;
      }
      
      .shot-description {
        margin-bottom: 10px;
      }
      
      .shot-info-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 5px 10px;
        font-size: 13px;
      }
      
      .shot-info-label {
        font-weight: bold;
        color: #555;
      }
      
      .shot-notes {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid var(--border-color);
        font-size: 13px;
        font-style: italic;
      }
      
      /* Print styles */
      @media print {
        body {
          padding: 0;
          font-size: 12px;
        }
        
        .storyboard-container {
          max-width: 100%;
        }
        
        .scene {
          page-break-after: always;
        }
        
        .shots-container {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
        
        .shot-image-placeholder {
          ${this.getImagePlaceholderPrintStyles(aspectRatio)}
        }
      }
    `
  }

  /**
   * Generate HTML content
   * @param storyboardData Storyboard data
   * @param exportOptions Export options
   * @returns HTML code
   */
  private generateHTMLContent(storyboardData: StoryboardData, exportOptions: ExportOptions): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(storyboardData.title)} - Storyboard</title>
  <style>
    /* CSS will be included here or linked externally */
  </style>
</head>
<body>
  <div class="storyboard-container">
    <div class="storyboard-title">
      <h1>${this.escapeHtml(storyboardData.title)}</h1>
      <h2>Storyboard</h2>
    </div>
    
    ${exportOptions.includeMetadata ? this.generateMetadataHTML(storyboardData) : ""}
    
    ${storyboardData.scenes.map((scene, sceneIndex) => this.generateSceneHTML(scene, sceneIndex + 1, exportOptions)).join("")}
  </div>
</body>
</html>`
  }

  /**
   * Generate metadata HTML
   * @param storyboardData Storyboard data
   * @returns HTML code for metadata
   */
  private generateMetadataHTML(storyboardData: StoryboardData): string {
    return `
    <div class="storyboard-metadata">
      <div class="metadata-item">
        <div class="metadata-label">Author</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.author || "Not specified")}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Director</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.director || "Not specified")}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Date</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.date)}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Version</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.version)}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Style</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.style)}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Aspect Ratio</div>
        <div class="metadata-value">${this.escapeHtml(storyboardData.aspectRatio)}</div>
      </div>
    </div>`
  }

  /**
   * Generate scene HTML
   * @param scene Scene information
   * @param sceneNumber Scene number
   * @param exportOptions Export options
   * @returns HTML code for scene
   */
  private generateSceneHTML(scene: SceneInfo, sceneNumber: number, exportOptions: ExportOptions): string {
    return `
    <div class="scene">
      <div class="scene-header">
        <h3 class="scene-title">Scene ${sceneNumber}: ${this.escapeHtml(scene.title)}</h3>
      </div>
      <div class="scene-description">
        ${this.escapeHtml(scene.description)}
      </div>
      <div class="shots-container">
        ${scene.shots.map((shot, shotIndex) => this.generateShotHTML(shot, shotIndex + 1, exportOptions)).join("")}
      </div>
    </div>`
  }

  /**
   * Generate shot HTML
   * @param shot Shot information
   * @param shotNumber Shot number
   * @param exportOptions Export options
   * @returns HTML code for shot
   */
  private generateShotHTML(shot: ShotInfo, shotNumber: number, exportOptions: ExportOptions): string {
    return `
    <div class="shot">
      <div class="shot-header">
        Shot ${shotNumber}: ${this.escapeHtml(shot.shotType)}
      </div>
      <div class="shot-content">
        <div class="shot-image-placeholder">
          <div>Image Placeholder<br>${this.escapeHtml(shot.shotType)}</div>
        </div>
        <div class="shot-details">
          <div class="shot-description">
            ${this.escapeHtml(shot.shotDescription)}
          </div>
          <div class="shot-info-grid">
            <div class="shot-info-label">Camera Angle:</div>
            <div>${this.escapeHtml(shot.cameraAngle)}</div>
            
            <div class="shot-info-label">Camera Movement:</div>
            <div>${this.escapeHtml(shot.cameraMovement)}</div>
            
            ${
              shot.characters && shot.characters.length > 0
                ? `
            <div class="shot-info-label">Characters:</div>
            <div>${this.escapeHtml(shot.characters.join(", "))}</div>
            `
                : ""
            }
            
            ${
              shot.location
                ? `
            <div class="shot-info-label">Location:</div>
            <div>${this.escapeHtml(shot.location)}</div>
            `
                : ""
            }
            
            ${
              shot.timeOfDay
                ? `
            <div class="shot-info-label">Time of Day:</div>
            <div>${this.escapeHtml(shot.timeOfDay)}</div>
            `
                : ""
            }
            
            ${
              shot.lighting
                ? `
            <div class="shot-info-label">Lighting:</div>
            <div>${this.escapeHtml(shot.lighting)}</div>
            `
                : ""
            }
            
            ${
              shot.mood
                ? `
            <div class="shot-info-label">Mood:</div>
            <div>${this.escapeHtml(shot.mood)}</div>
            `
                : ""
            }
          </div>
          
          ${
            exportOptions.includeNotes && shot.notes
              ? `
          <div class="shot-notes">
            <strong>Notes:</strong> ${this.escapeHtml(shot.notes)}
          </div>
          `
              : ""
          }
          
          ${
            exportOptions.includePrompts && shot.prompt
              ? `
          <div class="shot-notes">
            <strong>Prompt:</strong> ${this.escapeHtml(shot.prompt)}
          </div>
          `
              : ""
          }
        </div>
      </div>
    </div>`
  }

  /**
   * Get image placeholder styles based on aspect ratio
   * @param aspectRatio Aspect ratio
   * @returns CSS styles for image placeholder
   */
  private getImagePlaceholderStyles(aspectRatio: string): string {
    switch (aspectRatio) {
      case "16:9":
        return `
          width: 240px;
          height: 135px;
          min-width: 240px;
        `
      case "4:3":
        return `
          width: 200px;
          height: 150px;
          min-width: 200px;
        `
      case "2.35:1":
        return `
          width: 235px;
          height: 100px;
          min-width: 235px;
        `
      case "1:1":
        return `
          width: 180px;
          height: 180px;
          min-width: 180px;
        `
      case "9:16":
        return `
          width: 100%;
          height: 200px;
        `
      default:
        return `
          width: 200px;
          height: 150px;
          min-width: 200px;
        `
    }
  }

  /**
   * Get image placeholder print styles based on aspect ratio
   * @param aspectRatio Aspect ratio
   * @returns CSS styles for image placeholder in print mode
   */
  private getImagePlaceholderPrintStyles(aspectRatio: string): string {
    switch (aspectRatio) {
      case "16:9":
        return `
          width: 160px;
          height: 90px;
          min-width: 160px;
        `
      case "4:3":
        return `
          width: 120px;
          height: 90px;
          min-width: 120px;
        `
      case "2.35:1":
        return `
          width: 141px;
          height: 60px;
          min-width: 141px;
        `
      case "1:1":
        return `
          width: 100px;
          height: 100px;
          min-width: 100px;
        `
      case "9:16":
        return `
          width: 100%;
          height: 160px;
        `
      default:
        return `
          width: 120px;
          height: 90px;
          min-width: 120px;
        `
    }
  }

  /**
   * Escape HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    if (!text) return ""
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
}
