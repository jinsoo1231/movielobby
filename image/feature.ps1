Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 1024, 500
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 17, 32))
$graph.FillRectangle($brush, 0, 0, 1024, 500)

$img = [System.Drawing.Image]::FromFile("D:\movielobby\image\icon_logo.PNG")
$graph.DrawImage($img, 362, 100, 300, 300)

$bmp.Save("D:\movielobby\image\google_play_feature.png", [System.Drawing.Imaging.ImageFormat]::Png)
$brush.Dispose()
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "Success Feature Graphic"
