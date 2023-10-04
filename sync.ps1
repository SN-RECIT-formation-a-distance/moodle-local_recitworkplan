$from = "moodle-local_recitworkplan/src/*"
$to = "shared/recitfad/local/recitworkplan"

try {
    . ("..\sync\watcher.ps1")
}
catch {
    Write-Host "Error while loading sync.ps1 script." 
}