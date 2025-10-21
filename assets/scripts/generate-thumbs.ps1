<#
Generate thumbnails for PDF first pages using ImageMagick.
Place this script in the repository and run from PowerShell in the project root.

Requirements:

What it does:

Usage:
  # From repository root (where index.html lives):
  .\assets\scripts\generate-thumbs.ps1

#>

# Preflight checks: ensure ImageMagick is available and report configuration
$base = Join-Path $PWD 'assets\pdfs'

Write-Output "Preflight: checking for ImageMagick (magick)..."
$magickCmd = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magickCmd) {
    Write-Error "ImageMagick 'magick' was not found in PATH. Please install ImageMagick (https://imagemagick.org) and ensure 'magick' is available in your PATH. Exiting."
    exit 2
}

Write-Output "ImageMagick executable: $($magickCmd.Path)"
Write-Output "--- magick -version ---"
magick -version

Write-Output "--- magick -list configure (showing Delegates and Module paths) ---"
# Print the full configure output; user can inspect delegates / module paths
magick -list configure

Write-Output "Preflight: checking for Ghostscript (gswin64c / gswin32c) — required by many ImageMagick builds to read PDFs"
$gsCmd = Get-Command gswin64c -ErrorAction SilentlyContinue
if (-not $gsCmd) { $gsCmd = Get-Command gswin32c -ErrorAction SilentlyContinue }
if ($gsCmd) {
    Write-Output "Ghostscript found: $($gsCmd.Path)"
    try { & $gsCmd -version } catch { }
} else {
    Write-Warning "Ghostscript executable (gswin64c or gswin32c) not found in PATH. PDF support may be missing. Install Ghostscript from https://www.ghostscript.com/ and re-run the script."
}

Write-Output "Scanning PDFs under: $base"
Get-ChildItem -Path $base -Recurse -Filter '*.pdf' -File | ForEach-Object {
    $pdf = $_.FullName
    $dir = Split-Path $pdf
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $thumbDir = Join-Path $dir 'thumbs'
    if (!(Test-Path $thumbDir)) { New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null }
    $jpg = Join-Path $thumbDir ($baseName + '-thumb.jpg')
    $webp = Join-Path $thumbDir ($baseName + '-thumb.webp')

    Write-Output "Generating thumbnail for: $($_.FullName)"
    try {
        # Generate 600px wide JPEG from first page
        # It's helpful to capture command output for diagnostics; run magick and capture stderr/stdout
        $cmd1 = "magick `"$($pdf)[0]`" -thumbnail 600x -background white -alpha remove -quality 80 `"$jpg`""
        Write-Output "Running: $cmd1"
        $out1 = magick "$($pdf)[0]" -thumbnail 600x -background white -alpha remove -quality 80 "$jpg" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "magick returned exit code $LASTEXITCODE while processing $pdf"
            Write-Warning $out1
            throw "magick failed for $pdf"
        }
        # Generate WebP variant from the generated JPEG
        $out2 = magick "$jpg" -quality 80 "$webp" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "magick returned exit code $LASTEXITCODE while converting $jpg to webp"
            Write-Warning $out2
            throw "magick webp conversion failed for $jpg"
        }
        Write-Output "Created: $jpg and $webp"
    } catch {
        Write-Warning ("Failed to generate thumbnail for $pdf. Error: " + $_.ToString())
        if ($out1) { Write-Output "Last magick output (step1):"; Write-Output $out1 }
        if ($out2) { Write-Output "Last magick output (step2):"; Write-Output $out2 }
        Write-Output "PowerShell error info: $($_)"
        Write-Output "Suggest: confirm ImageMagick and Ghostscript are installed and available in PATH. On Windows, ensure Ghostscript (gswin64c.exe) is on PATH and ImageMagick delegates include 'gslib' or 'gs'."
    }
}

Write-Output "Thumbnail generation complete. Update manifest.json with thumbnail paths if desired."
#>
