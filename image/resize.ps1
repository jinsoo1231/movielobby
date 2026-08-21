Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("D:\movielobby\image\icon_logo.PNG")
$bmp = New-Object System.Drawing.Bitmap 512, 512
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.DrawImage($img, 0, 0, 512, 512)
$bmp.Save("D:\movielobby\image\google_play_icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "Success"
