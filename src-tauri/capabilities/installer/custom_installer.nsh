!macro customInstall
  ; 1. Creamos la carpeta donde van a vivir las herramientas en el AppData del usuario
  CreateDirectory "$LOCALAPPDATA\com.ez.logistics.app\bin"

  ; 2. Le decimos al instalador que extraiga el ngrok.exe en esa carpeta
  ; Como el archivo .nsh y ngrok.exe están en la misma carpeta 'installer', la ruta es directa
  SetOutPath "$LOCALAPPDATA\com.tu_empresa.tu_app\bin"
  File "ngrok.exe"

  ; Nota de tranquilidad: La base de datos (.db) NO la metemos aquí.
  ; Tu backend de Python se encargará de crearla automáticamente en AppData cuando la app se abra.
!macroend