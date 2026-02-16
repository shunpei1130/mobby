Add-Type -AssemblyName System.Drawing

function Compress-Image {
    param(
        [string]$InputPath,
        [int]$MaxDimension = 800,
        [int]$Quality = 75
    )
    
    $file = Get-Item $InputPath
    $originalKB = [math]::Round($file.Length / 1024)
    
    $img = [System.Drawing.Image]::FromFile($InputPath)
    $w = $img.Width
    $h = $img.Height
    
    if ($w -gt $MaxDimension -or $h -gt $MaxDimension) {
        if ($w -gt $h) {
            $newW = $MaxDimension
            $newH = [int]([math]::Round($h * $MaxDimension / $w))
        }
        else {
            $newH = $MaxDimension
            $newW = [int]([math]::Round($w * $MaxDimension / $h))
        }
    }
    else {
        $newW = $w
        $newH = $h
    }
    
    $resized = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $img.Dispose()
    
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    
    $tempFile = $InputPath + ".optimized.jpg"
    $resized.Save($tempFile, $codec, $ep)
    $g.Dispose()
    $resized.Dispose()
    
    # Replace original
    [System.IO.File]::Delete($InputPath)
    [System.IO.File]::Move($tempFile, $InputPath)
    
    $newFile = Get-Item $InputPath
    $newKB = [math]::Round($newFile.Length / 1024)
    Write-Host "$($file.Name): $originalKB KB -> $newKB KB ($w x $h -> $newW x $newH)"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Working in: $scriptDir"

$images = @("1.jpg", "2.jpg", "3.jpg", "4.jpg")
foreach ($name in $images) {
    $path = Join-Path $scriptDir $name
    if (Test-Path $path) {
        Compress-Image -InputPath $path
    }
    else {
        Write-Host "$name not found at $path"
    }
}
Write-Host "DONE"
