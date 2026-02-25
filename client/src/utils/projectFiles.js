/**
 * Project File Utilities
 * Handles .dlxplace file format (ZIP-based project files)
 */

/**
 * Serialize project data to a .dlxplace format string
 * Format structure:
 * {
 *   version: "1.0",
 *   projectName: "My Game",
 *   objects: [...],
 *   snapshots: [{ id, name, timestamp, objects }],
 *   exportedAt: ISO timestamp
 * }
 */
export function serializeProject(projectData) {
  // In a real implementation, this would create a ZIP file
  // For now, we'll use JSON with metadata
  return JSON.stringify(projectData, null, 2);
}

/**
 * Deserialize project data from .dlxplace format
 */
export function deserializeProject(fileContent) {
  try {
    const data = JSON.parse(fileContent);
    
    // Validate structure
    if (!data.version || !data.projectName || !Array.isArray(data.objects)) {
      throw new Error("Invalid project file format");
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate filename for project export
 */
export function generateProjectFilename(projectName) {
  const sanitized = projectName.replace(/[^a-z0-9-_]/gi, "_").toLowerCase();
  const timestamp = new Date().toISOString().split("T")[0];
  return `${sanitized}_${timestamp}.dlxplace`;
}

/**
 * Validate project data structure
 */
export function validateProjectData(data) {
  const issues = [];

  if (!data.version) issues.push("Missing version");
  if (!data.projectName || typeof data.projectName !== "string") issues.push("Invalid projectName");
  if (!Array.isArray(data.objects)) issues.push("objects must be an array");
  if (!Array.isArray(data.snapshots)) issues.push("snapshots must be an array");

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Helper to create a recovery backup filename
 */
export function getBackupFilename(projectName, backupNumber = 1) {
  return `${projectName}.backup.${backupNumber}.dlxplace`;
}

/**
 * Estimate project file size
 */
export function estimateProjectSize(projectData) {
  const json = JSON.stringify(projectData);
  return {
    bytes: json.length,
    kb: (json.length / 1024).toFixed(2),
    mb: (json.length / 1024 / 1024).toFixed(2),
  };
}

/**
 * Check if file is a valid .dlxplace file
 */
export function isValidDlxplaceFile(filename) {
  return filename.endsWith(".dlxplace");
}

/**
 * Parse project name from file path
 */
export function getProjectNameFromFile(filePath) {
  const filename = filePath.split(/[/\\]/).pop();
  return filename.replace(/\.dlxplace$/, "").replace(/_\d{4}-\d{2}-\d{2}$/, "");
}
