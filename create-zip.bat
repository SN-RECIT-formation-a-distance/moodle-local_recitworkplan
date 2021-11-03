echo off
set zipName=local_recitworkplan
set pluginName=recitworkplan

rem remove the current 
del %zipName%

rem zip the folder
"c:\Program Files\7-Zip\7z.exe" a -mx "%zipName%.zip" "src\*" -mx0 -xr!"src\react_app\.cache" -xr!"src\react_app\node_modules" -xr!"src\react_app\src" -xr!"src\react_app\.babelrc" -xr!"src\react_app\package.json" -xr!"src\react_app\package-lock.json"

rem set the plugin name
"c:\Program Files\7-Zip\7z.exe" rn "%zipName%.zip" "src\" "%pluginName%\"

pause