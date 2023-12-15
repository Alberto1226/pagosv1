import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();

app.use(bodyParser.json());

// Función para generar la cadena encriptada
function generateEncryptedStringWithoutKeys(data) {
  const order = {
    tipoPlan: 1,
    terminal: 2,
    importe: 3,
    referencia: 4,
    clave: 5,
  };

  const valorClave = "SzXQUp554W";

  const updatedData = {};

  Object.keys(data)
    .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
    .forEach((key) => {
      updatedData[key] = data[key];
    });

  const sortedValuesWithoutKeys = Object.values(updatedData)
    .filter((value) => value !== undefined && value !== null)
    .join("");

  const combinedDataWithKey = sortedValuesWithoutKeys + valorClave;

  const hash = crypto
    .createHash("sha1")
    .update(combinedDataWithKey)
    .digest("hex");

  return { combinedDataWithKey, hash };
}

function generateEncryptedStringWithKeys(data) {
  const order = {
    tipoPlan: 1,
    terminal: 2,
    importe: 3,
    referencia: 4,
  };


  const updatedData = {};

  Object.keys(data)
    .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
    .forEach((key) => {
      updatedData[key] = data[key];
    });

  const sortedDataWithKeys = Object.keys(updatedData)
    .filter(
      (key) => updatedData[key] !== undefined && updatedData[key] !== null
    )
    .map((key) => `${key}=${updatedData[key]}`)
    .join("&");

  return { sortedDataWithKeys }; // Devolver un objeto con la clave sortedDataWithKeys
}

/**
 * encriptar id de la venta y la clave
 */
function encryptIdAndValorClave(combinedIdValorClave) {
  const encryptedIdValorClave = crypto
    .createHash("sha1")
    .update(combinedIdValorClave)
    .digest("hex");
  return encryptedIdValorClave;
}


/**
 * obtener resultado
 */



app.post("/nuevaventa", async (req, res) => {
  const {
    tipoPlan,
    terminal,
    pv,
    importe,
    referencia,
    correo,
    //terminalPuente,
  } = req.body;

  const { combinedDataWithKey, hash: cadenaEncriptada } =
    generateEncryptedStringWithoutKeys({
      tipoPlan,
      terminal,
      importe,
      referencia,
      correo,
      //terminalPuente,
    });

  const { sortedDataWithKeys } = generateEncryptedStringWithKeys({
    tipoPlan,
    terminal,
    importe,
    referencia,
    correo,
    pv,
    //terminalPuente,
  });

  console.log("Cadena Original:", combinedDataWithKey);
  console.log("Cadena Encriptada:", cadenaEncriptada);
  console.log("Cadena con keys:", sortedDataWithKeys);

  try {
    const baseUrl = "https://www.prosepago.net/v2/nuevaventav2.ashx";

    const requestBody = `&${sortedDataWithKeys}&cadenaEncriptada=${cadenaEncriptada}`;
    console.log("RequestBody:", requestBody);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    if (response.ok) {
      setTimeout(async () => {
      const data = await response.json();
      const id = data; // Guardar la respuesta en la variable global 'id'
      console.log(data);
      console.log(id);

      // Cifrar 'id' y 'valorClave'
      const valorClave = "SzXQUp554W"; // Considerando que esto ya está definido en tu código
      console.log(valorClave);

      const idCifradoSinEncriptar = id + valorClave;
      console.log("Cadena sin encriptar", idCifradoSinEncriptar);

      const idCifrado = encryptIdAndValorClave(idCifradoSinEncriptar);

      console.log("cadena encriptada", idCifrado);

      

      // Enviar solicitud POST a la nueva URL con 'idCifrado'
      const resultadoUrl = "https://www.prosepago.net/v2/resultadov2.ashx";
      const resultadoRequestBody = `&idsolicitud=${id}&cadenaEncriptada=${idCifrado}`;
      console.log("Body :", resultadoRequestBody);
      const resultadoResponse = await fetch(resultadoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: resultadoRequestBody,
      });
      
      //fin de pag
      //inicio de validacion de resultado
     
      if (resultadoResponse.ok) {
        
      
        
        
          try {
            const resultadoXMLText = await resultadoResponse.text(); // Obtiene el texto de la respuesta
            
            // Convertir el texto XML a Base64
            const encodedXML = Buffer.from(resultadoXMLText).toString('base64');
      
            //resultadoXMLBase64 = encodedXML; // Actualiza el valor de la cadena Base64
      
            // Aquí puedes utilizar 'encodedXML' según tus necesidades, como enviarlo o trabajar con él
            console.log("XML codificado en Base64:", encodedXML);
      
            // Ejemplo de envío como respuesta JSON con el XML codificado
            res.status(200).json({ encodedXML });
          } catch (error) {
            // Manejo de errores al procesar la respuesta XML
            res.status(500).send("Error al procesar la respuesta XML");
          }
        
        
      }  else {
        res.status(resultadoResponse.status).send("Error al obtener resultados");
      }
    }, 20000); // Esperar 20 segundos (20000 milisegundos)
    } else {
      res.status(response.status).send("Error");
    }
  } catch (error) {
    res.status(500).send("Error interno en el servidor");
  }
});

app.listen(3000, () => {
  console.log("Servidor iniciado en el puerto 3000");
});
