Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("D:\movielobby\image\google_play_feature.png")
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.Clear([System.Drawing.Color]::White)
$graph.DrawImage($img, 0, 0, $img.Width, $img.Height)
$bmp.Save("D:\movielobby\image\google_play_feature.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "Saved as JPG"
