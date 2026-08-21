Add-Type -AssemblyName System.Drawing

$files = @("movielobby_main.jpg", "movielobby_review.jpg", "movielobby_talks.jpg", "movielobby_detailpage.jpg")
$bgColor = [System.Drawing.Color]::FromArgb(255, 11, 17, 32)
$targetWidth = 1080
$targetHeight = 1920

foreach ($f in $files) {
    $path = "D:\movielobby\image\$f"
    if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile($path)
        
        $bmp = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
        $graph = [System.Drawing.Graphics]::FromImage($bmp)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $graph.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
        
        # Calculate scale to fit inside 1080x1920
        $scale = [math]::Min($targetWidth / $img.Width, $targetHeight / $img.Height)
        $newWidth = [int]($img.Width * $scale)
        $newHeight = [int]($img.Height * $scale)
        
        $x = [int](($targetWidth - $newWidth) / 2)
        $y = [int](($targetHeight - $newHeight) / 2)
        
        $graph.DrawImage($img, $x, $y, $newWidth, $newHeight)
        
        $outPath = "D:\movielobby\image\playstore_$f"
        $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        $brush.Dispose()
        $graph.Dispose()
        $bmp.Dispose()
        $img.Dispose()
        
        Write-Output "Processed: $f -> playstore_$f"
    } else {
        Write-Output "File not found: $f"
    }
}
