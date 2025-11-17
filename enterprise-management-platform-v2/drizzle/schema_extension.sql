-- Schema extension for construction documentation features

-- Daily Reports (Bautagebuch)
CREATE TABLE IF NOT EXISTS dailyReports (
  id VARCHAR(64) PRIMARY KEY,
  projectId VARCHAR(64) NOT NULL,
  reportDate DATE NOT NULL,
  weather VARCHAR(100),
  temperature VARCHAR(50),
  workDescription TEXT,
  specialOccurrences TEXT,
  attendees TEXT, -- JSON array of employee IDs
  workHours INT,
  equipmentUsed TEXT,
  materialsDelivered TEXT,
  visitorsContractors TEXT,
  safetyIncidents TEXT,
  photos TEXT, -- JSON array of photo URLs
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(64),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX project_idx (projectId),
  INDEX date_idx (reportDate)
);

-- Inspection Protocols (Begehungsprotokolle)
CREATE TABLE IF NOT EXISTS inspectionProtocols (
  id VARCHAR(64) PRIMARY KEY,
  projectId VARCHAR(64) NOT NULL,
  inspectionDate DATE NOT NULL,
  inspectionType VARCHAR(100), -- 'regular', 'special', 'final', 'acceptance'
  participants TEXT, -- JSON array of participants
  areas TEXT, -- JSON array of inspected areas
  findings TEXT, -- JSON array of findings with photos
  generalNotes TEXT,
  nextSteps TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'completed', 'approved'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(64),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX project_idx (projectId),
  INDEX date_idx (inspectionDate),
  INDEX status_idx (status)
);

-- Defect Protocols (Mängelprotokolle)
CREATE TABLE IF NOT EXISTS defectProtocols (
  id VARCHAR(64) PRIMARY KEY,
  projectId VARCHAR(64) NOT NULL,
  defectNumber VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200),
  trade VARCHAR(100), -- 'KG410', 'KG420', 'KG430', 'KG440', etc.
  category VARCHAR(100), -- 'construction', 'electrical', 'plumbing', 'hvac', etc.
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'verified', 'closed'
  responsibleParty VARCHAR(200),
  responsibleContact VARCHAR(200),
  detectedDate DATE NOT NULL,
  dueDate DATE,
  resolvedDate DATE,
  verifiedDate DATE,
  detectionPhotos TEXT, -- JSON array of photo URLs
  resolutionPhotos TEXT, -- JSON array of photo URLs
  detectedBy VARCHAR(64),
  assignedTo VARCHAR(64),
  resolutionNotes TEXT,
  verificationNotes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(64),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX project_idx (projectId),
  INDEX status_idx (status),
  INDEX severity_idx (severity),
  INDEX defect_number_idx (defectNumber)
);

