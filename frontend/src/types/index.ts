export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type OcrMode = 'auto' | 'force_ocr' | 'no_ocr';

export interface SelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  probing?: boolean;
  pageCount?: number;
  pages?: number;
  isScanned?: boolean;
  is_scanned?: boolean;
  needs_ocr?: boolean;
  encrypted?: boolean;
  status: ConversionStatus;
  progress: number;
  docxFilename?: string;
  docxSize?: number;
  durationSeconds?: number;
  ocrApplied?: boolean;
  methodUsed?: string;
  errorMessage?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  original_filename: string;
  docx_filename: string;
  output_filename?: string;
  file_size: number;
  file_size_bytes?: number;
  docx_size: number;
  pages?: number;
  page_count: number;
  status: 'completed' | 'failed' | 'success';
  method_used?: string;
  duration_seconds: number;
  ocr_applied: boolean;
  exists_on_disk: boolean;
  download_url?: string;
  error_message?: string;
  error?: string;
}

export interface AppSettings {
  language: 'fr' | 'en';
  theme: 'light' | 'dark';
  naming_pattern: string;
  output_naming_pattern?: string;
  custom_output_dir: string;
  ocr_enabled: boolean;
  enable_ocr?: boolean;
  ocr_languages: string[];
  ocr_dpi: number;
  enhance_scans: boolean;
  ocr_enhance_scans?: boolean;
  max_file_size_mb: number;
}

export interface SystemDiagnostics {
  tesseract_available: boolean;
  tesseract_path: string;
  tesseract_version: string;
  tesseract_languages: string[];
  pymupdf_version: string;
  docx_version: string;
  python_version: string;
  storage_outputs_count: number;
  storage_free_space_gb: number;
  os_name: string;
  os_platform?: string;
}

export interface SingleConversionResult {
  id: string;
  original_filename: string;
  output_filename: string;
  download_url: string;
  status: 'success' | 'failed';
  pages: number;
  file_size_bytes: number;
  duration_seconds: number;
  method_used: string;
  error?: string;
}

export interface ConversionResponse {
  total: number;
  successful_count: number;
  failed_count: number;
  duration_seconds: number;
  results: SingleConversionResult[];
  batch_download_url?: string | null;
}
