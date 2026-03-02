/*
 *==========================================
 * CONTACT FORM - FILE UPLOAD
 * ↳ Drag & drop + click to upload
 * ↳ Supabase Storage integration (eager upload)
 *==========================================
 */

import { supabase } from '$utils/global/supabase/supabaseClient';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MO
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';
const BUCKET_NAME = 'contact-uploads';
const FORM_SELECTOR = '#wf-form-contact-form';

interface UploadedFile {
  file: File;
  id: string;
  publicUrl: string | null;
  uploading: boolean;
}

let uploadedFiles: UploadedFile[] = [];
let fileInput: HTMLInputElement | null = null;
let hiddenUrlsInput: HTMLInputElement | null = null;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" : type non supporté. Utilisez PDF, JPG ou PNG.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" : fichier trop lourd (${formatFileSize(file.size)}). Max 10 Mo.`;
  }
  return null;
}

/*
 *==========================================
 * SUPABASE - EAGER UPLOAD
 * ↳ Files are uploaded immediately when added
 * ↳ Hidden input is kept in sync with URLs
 *==========================================
 */

async function uploadFileToSupabase(uploaded: UploadedFile): Promise<void> {
  const timestamp = Date.now();
  const safeName = uploaded.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${timestamp}_${uploaded.id}_${safeName}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, uploaded.file);

  if (error) {
    console.error(`[Upload] Erreur pour ${uploaded.file.name}:`, error.message);
    uploaded.uploading = false;
    renderFileList();
    return;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  uploaded.publicUrl = publicUrl;
  uploaded.uploading = false;

  // Update hidden input with all available URLs
  syncHiddenInput();
  renderFileList();
}

function syncHiddenInput(): void {
  if (!hiddenUrlsInput) return;

  const urls = uploadedFiles.filter((u) => u.publicUrl).map((u) => u.publicUrl as string);

  hiddenUrlsInput.value = urls.join(' , ');
}

/*
 *==========================================
 * UI - FILE LIST
 *==========================================
 */

function createFileListElement(): HTMLElement {
  const list = document.createElement('div');
  list.classList.add('upload_file-list');
  return list;
}

function createPreview(file: File): HTMLElement {
  const preview = document.createElement('div');
  preview.classList.add('upload_file-preview');

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.classList.add('upload_file-thumb');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.onload = () => URL.revokeObjectURL(img.src);
    preview.appendChild(img);
  } else {
    // PDF icon
    const icon = document.createElement('span');
    icon.classList.add('upload_file-icon');
    icon.textContent = 'PDF';
    preview.appendChild(icon);
  }

  return preview;
}

function createFileItem(uploaded: UploadedFile): HTMLElement {
  const item = document.createElement('div');
  item.classList.add('upload_file-item');
  item.dataset.fileId = uploaded.id;

  // Show uploading state
  if (uploaded.uploading) {
    item.classList.add('is-uploading');
  }

  const preview = createPreview(uploaded.file);

  const info = document.createElement('div');
  info.classList.add('upload_file-info');

  const name = document.createElement('span');
  name.classList.add('upload_file-name');
  name.textContent = uploaded.file.name;

  const size = document.createElement('span');
  size.classList.add('upload_file-size');
  size.textContent = uploaded.uploading ? 'Envoi…' : formatFileSize(uploaded.file.size);

  info.appendChild(name);
  info.appendChild(size);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.classList.add('upload_file-remove');
  removeBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 12 12" fill="none"><path d="M0.707031 0.707153L10.707 10.7072M10.707 0.707153L0.707031 10.7072" stroke="currentColor" stroke-width="2"/></svg>';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    removeFile(uploaded.id);
  });

  item.appendChild(preview);
  item.appendChild(info);
  item.appendChild(removeBtn);

  return item;
}

function renderFileList(): void {
  const wrapper = document.querySelector<HTMLElement>('.form_field-wrapper:has(.is-upload)');
  if (!wrapper) return;

  // Remove existing list
  const existingList = wrapper.querySelector('.upload_file-list');
  if (existingList) existingList.remove();

  if (uploadedFiles.length === 0) return;

  const list = createFileListElement();
  uploadedFiles.forEach((uploaded) => {
    list.appendChild(createFileItem(uploaded));
  });

  wrapper.appendChild(list);
}

function addFiles(files: FileList | File[]): void {
  const errors: string[] = [];

  Array.from(files).forEach((file) => {
    const error = validateFile(file);
    if (error) {
      errors.push(error);
      return;
    }

    // Avoid duplicates by name + size
    const isDuplicate = uploadedFiles.some(
      (u) => u.file.name === file.name && u.file.size === file.size
    );
    if (isDuplicate) return;

    const uploaded: UploadedFile = {
      file,
      id: generateId(),
      publicUrl: null,
      uploading: true,
    };

    uploadedFiles.push(uploaded);

    // Upload immediately to Supabase
    uploadFileToSupabase(uploaded);
  });

  if (errors.length > 0) {
    alert(errors.join('\n'));
  }

  renderFileList();
  updateUploadZoneState();
}

function removeFile(id: string): void {
  uploadedFiles = uploadedFiles.filter((u) => u.id !== id);
  syncHiddenInput();
  renderFileList();
  updateUploadZoneState();
}

function updateUploadZoneState(): void {
  const zone = document.querySelector<HTMLElement>('.form_input.is-upload');
  if (!zone) return;

  if (uploadedFiles.length > 0) {
    zone.classList.add('has-files');
  } else {
    zone.classList.remove('has-files');
  }
}

/*
 *==========================================
 * EVENTS
 *==========================================
 */

function onFileInputChange(): void {
  if (fileInput?.files && fileInput.files.length > 0) {
    addFiles(fileInput.files);
    fileInput.value = '';
  }
}

function onDragEnter(e: DragEvent): void {
  e.preventDefault();
  const zone = document.querySelector<HTMLElement>('.form_input.is-upload');
  zone?.classList.add('is-drag-over');
}

function onDragOver(e: DragEvent): void {
  e.preventDefault();
}

function onDragLeave(e: DragEvent): void {
  e.preventDefault();
  const zone = e.currentTarget as HTMLElement;
  const related = e.relatedTarget as Node | null;
  if (related && zone.contains(related)) return;
  zone.classList.remove('is-drag-over');
}

function onDrop(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.querySelector<HTMLElement>('.form_input.is-upload');
  zone?.classList.remove('is-drag-over');

  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    addFiles(e.dataTransfer.files);
  }
}

/*
 *==========================================
 * INIT / DESTROY
 *==========================================
 */

export function initContactFileUpload(): void {
  destroyContactFileUpload();

  const zone = document.querySelector<HTMLElement>('.form_input.is-upload');
  if (!zone) return;

  // Ensure zone is positioned for the overlay input
  const computed = getComputedStyle(zone);
  if (computed.position === 'static') {
    zone.style.position = 'relative';
  }

  // Create an invisible <input type="file"> that covers the full zone
  fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = ALLOWED_EXTENSIONS;
  fileInput.multiple = true;
  fileInput.classList.add('upload_native-input');
  zone.appendChild(fileInput);

  // Create hidden input to store file URLs for Webflow form data
  const form = document.querySelector<HTMLFormElement>(FORM_SELECTOR);
  if (form) {
    hiddenUrlsInput = document.createElement('input');
    hiddenUrlsInput.type = 'hidden';
    hiddenUrlsInput.name = 'file-uploads';
    form.appendChild(hiddenUrlsInput);
  }

  // Listen for file selection
  fileInput.addEventListener('change', onFileInputChange);

  // Drag & drop events on the zone
  zone.addEventListener('dragenter', onDragEnter);
  zone.addEventListener('dragover', onDragOver);
  zone.addEventListener('dragleave', onDragLeave);
  zone.addEventListener('drop', onDrop);
}

export function destroyContactFileUpload(): void {
  const zone = document.querySelector<HTMLElement>('.form_input.is-upload');

  if (zone) {
    zone.removeEventListener('dragenter', onDragEnter);
    zone.removeEventListener('dragover', onDragOver);
    zone.removeEventListener('dragleave', onDragLeave);
    zone.removeEventListener('drop', onDrop);
    zone.classList.remove('is-drag-over', 'has-files');
  }

  if (fileInput) {
    fileInput.removeEventListener('change', onFileInputChange);
    fileInput.remove();
    fileInput = null;
  }

  if (hiddenUrlsInput) {
    hiddenUrlsInput.remove();
    hiddenUrlsInput = null;
  }

  const list = document.querySelector('.upload_file-list');
  if (list) list.remove();

  uploadedFiles = [];
}

/** Expose uploaded files for external use */
export function getUploadedFiles(): File[] {
  return uploadedFiles.map((u) => u.file);
}
