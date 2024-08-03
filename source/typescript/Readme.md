Para correr con coverage se debe de eliminar la línea

    "module": "ESNext"

del archivo `tsconfig.json`

Para generar las librerías para commonJS y ESM usar el comando

    npm run tsc_export

Esto lo generará sin usar webpack en la carpeta lib