$from = "moodle-local_recitworkplan/src/*"
$to = "shared/recitfad3/local/recitworkplan"
$source = "./src";

try {
    . ("..\sync\watcher.ps1")
}
catch {
    Write-Host "Error while loading sync.ps1 script." 
}