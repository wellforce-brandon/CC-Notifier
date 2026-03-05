# CC-Notifier Windows toast notification with protocol activation.
# Spawned by the extension to show toasts that open a vscode:// URI on click.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File toast.ps1 <uri> <title> <body> [sound]
#   sound: "true" or "false" (default "true")

param(
    [Parameter(Mandatory)][string]$Uri,
    [Parameter(Mandatory)][string]$Title,
    [Parameter(Mandatory)][string]$Body,
    [string]$Sound = "true"
)

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

function XmlEscape([string]$s) {
    return $s.Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;').Replace('"','&quot;').Replace("'",'&apos;')
}

$safeUri = XmlEscape($Uri)
$safeTitle = XmlEscape($Title)
$safeBody = XmlEscape($Body)

$audioXml = if ($Sound -eq "true") {
    '<audio src="ms-winsoundevent:Notification.IM" />'
} else {
    '<audio silent="true" />'
}

$template = @"
<toast activationType="protocol" launch="$safeUri">
  <visual>
    <binding template="ToastGeneric">
      <text>$safeTitle</text>
      <text>$safeBody</text>
    </binding>
  </visual>
  $audioXml
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Microsoft.Windows.Explorer")
$notifier.Show($toast)
